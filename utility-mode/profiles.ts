/* Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/


import * as config from './config';
import * as util from '../util';


/**
 * Gets the amount of energy generation required for fulfilling demand.
 *
 * Non-dispatchable energy sources may generate energy in excess of demand
 * for any given time point due to the fact that these energy sources cannot
 * avoid generating in excess of demand.
 *
 * @param profiles Supply and demand energy profiles.
 * @return The aggregated amount of energy supplied for demand fulfillment
 *     per energy source.
 */
export function getSuppliedEnergyBreakdown(profiles: ProfileDataset) {
  const supplied = {};
  config.ALL_ENERGY_SOURCES.forEach(source => supplied[source] = 0);

  // Iterate over the time series and track the per-time point excess generated
  // for each energy source.
  for (let t = 0; t < profiles.index.length; ++t) {
    // Find the amount of excess energy generated by non-dispatchable sources
    // at the current time point.
    const demand = profiles.series.demand[t];
    const nonDispatchableGenerated = util.sum(
        config.NON_DISPATCHABLE_ENERGY_SOURCES.map(s => profiles.series[s][t]));
    const excess = nonDispatchableGenerated - demand;
    if (excess > 0) {
      // Attribute the excess across all non-dispatchable sources.
      //
      // The excess for a non-dispatchable power source at time t is:
      // excess[t] * (generation[source][t] / non-dispatchable-generation[t])
      config.NON_DISPATCHABLE_ENERGY_SOURCES.map(source => {
        const generated = profiles.series[source][t];
        // Attribute a weighted fraction of the excess generation to each
        // source; power sources generating more non-dispatchable power are
        // attributed a larger fraction of the excess.
        const sourceExcess = generated * excess / nonDispatchableGenerated;
        supplied[source] += generated - sourceExcess;
      });
    } else {
      // No excess energy was generated from non-dispatchables, so 100% of the
      // generation at the current time point can be attributed towards meeting
      // the demand at time t.
      config.NON_DISPATCHABLE_ENERGY_SOURCES.map(source => {
        supplied[source] += profiles.series[source][t];
      });
    }

    // Dispatchable energy sources do not generate energy in excess of demand;
    // by definition, all dispatchable energy generation goes towards supplying
    // demand.
    config.DISPATCHABLE_ENERGY_SOURCES.forEach(source => {
      supplied[source] += profiles.series[source][t];
    });
  }

  return supplied;
}

/**
 * Gets the fixed (monetary) cost of given energy generation capacity.
 *
 * @param capacity Energy generation capacity in MW.
 * @param source The type of energy source (e.g., 'nuclear').
 * @return The fixed cost of building the specified energy generation capacity.
 */
function getFixedCost(capacity: number, source: string) {
  // Dimensional analysis: MW * $USD/MW => $USD
  return capacity * config.FIXED_COST[source];
}

/**
 * Gets the variable (monetary) cost to generate the given amount of energy.
 *
 * Variable costs are amortized over the 30-year lifetime of the given energy
 * generation capacity with an applied discount rate.
 *
 * @param energy The total amount of energy generated in MWh.
 * @param source The energy source that generated the energy (e.g., 'nuclear').
 * @return The variable cost of generating the given amount of energy.
 */
function getVariableCost(energy: number, source: string) {
  // Dimensional analysis: MWh * $USD/MWh => $USD
  return energy * config.VARIABLE_COST[source] * util.DISCOUNT_RATE_WEEKLY;
}

/**
 * Gets the annual CO2 created while generating the given amount of energy.
 *
 * @param energy The total amount of energy generated in MWh.
 * @param source The energy source that generated the energy (e.g., 'nuclear').
 * @return The total CO2 created as a result of energy generation in
 *     metric tonnes.
 */
function getCo2(energy: number, source: string): number {
  // Dimensional analysis: MWh * lbs/MWh * tonnes/lbs => tonnes
  //
  // Note: the 1-week co2 is scaled to the 1-year level for consistency with
  // scenario outcome datasets.
  return energy * config.CO2_RATE[source] * util.WEEKS_PER_YEAR;
}

/**
 * Gets an energy profile set scaled by the given per-source allocations.
 *
 * For non-dispatchable energy sources (e.g., solar, wind, nuclear), the shape
 * of each profile is maintained and the integral is scaled according to the
 * assigned allocation.
 *
 * For dispatchable energy sources (e.g., natural gas), the shape of each
 * profile is taken as the upper bound of available dispatch capacity. In the
 * returned energy profile set, dispatchable source profiles reflect the amount
 * of energy that was required to meet demand (without overage) at each point
 * in time.
 *
 * Note: only one (or zero) dispatchable energy sources may be enabled
 * concurrently (e.g., either ng or ngccs, but not both, can be non-zero).
 *
 * @param allocations Per-energy source allocation fractions (in [0,1]).
 * @param profiles A set of energy generation profiles.
 * @return A scaled set of energy generation profiles covering the same
 *   time period.
 */
export function getAllocatedEnergyProfiles(
    allocations: ProfileAllocations,
    profiles: ProfileDataset): ProfileDataset {

  // Currently, the full amount of potential dispatch is directed at a single
  // energy source; if support for multiple energy sources is desired in the
  // future, a policy for selecting capacity from the available set of dispatch
  // options must be implemented (e.g., equal amounts from each, cheapest first
  // until capacity is exhausted, etc.).
  if (allocations.ng > 0 && allocations.ngccs > 0) {
    throw new Error(
        'Unsupported allocation of multiple dispatchable energy sources')
  }

  // Scale the energy profiles by their user-assigned capacity allocations.
  const allocatedProfiles: UtilityEnergySourceMap<number[]> = {
    solar: profiles.series.solar.map(x => x * allocations.solar),
    wind: profiles.series.wind.map(x => x * allocations.wind),
    nuclear: profiles.series.nuclear.map(x => x * allocations.nuclear),
    ng: profiles.series.ng.map(x => x * allocations.ng),
    coal: profiles.series.coal.map(x => x * allocations.coal),
    ngccs: profiles.series.ngccs.map(x => x * allocations.ngccs),
    coalccs: profiles.series.coalccs.map(x => x * allocations.coalccs),
  };

  // Given the non-dispatchable energy supply profiles, which are fixed,
  // compute the available dispatchable energy supply profile and remaining
  // unmet demand profile.
  const unmetProfile = [];
  const dispatchProfile = [];
  const supplyProfile = [];
  for (let i = 0; i < profiles.series.demand.length; ++i) {
    // Find the total power supplied at time[i] for non-dispatchables.
    let supplied = 0;
    config.NON_DISPATCHABLE_ENERGY_SOURCES.forEach(name => {
      supplied += allocatedProfiles[name][i];
    });

    // Any remaining gap beteween demand[i] and sum(non_dispatchable[k][i])
    // needs to be fulfilled by a dispatchable power supply or it goes
    // unfulfilled.
    let needed = Math.max(profiles.series.demand[i] - supplied, 0);
    let dispatchAvailable = Math.max(
        allocatedProfiles.ng[i], allocatedProfiles.ngccs[i]);
    let dispatched = 0;
    let unmet = 0;
    if (dispatchAvailable >= needed) {
      // We have enough dispatch to cover current timepoint's demand.
      //
      // Dispatch only what's needed currently
      dispatched = needed;
      unmet = 0;
    } else {
      // Insufficient dispatch available... gap in power supply.
      //
      // Dispatch all available and record gap
      dispatched = dispatchAvailable;
      unmet = needed - dispatched;
    }

    // Add any additional energy that was dispatched to meet demand.
    supplied += dispatched;

    dispatchProfile.push(dispatched);
    unmetProfile.push(unmet);
    supplyProfile.push(supplied);
  }

  return {
    index: profiles.index,
    units: profiles.units,
    series: {
      // Demand curve targeted for fulfillment.
      demand: profiles.series.demand,

      // Profile of unmet demand.
      unmet: unmetProfile,

      // Profile of total energy generation.
      supply: supplyProfile,

      // Non-dispatchable energy supplied.
      solar: allocatedProfiles.solar,
      wind: allocatedProfiles.wind,
      nuclear: allocatedProfiles.nuclear,
      coal: allocatedProfiles.coal,
      coalccs: allocatedProfiles.coalccs,

      // Dispatchable-energy supplied.
      ng: allocations.ng > 0 ? dispatchProfile : allocatedProfiles.ng,
      ngccs: allocations.ngccs > 0 ? dispatchProfile : allocatedProfiles.ngccs,
    }
  };
}

/**
 * Summarize the given profile set into aggregated cost and co2 values.
 *
 * Note: assumes provided profiles are for exactly 1 week in 168 hour-sized
 * slices when accounting for the co2 emissions discount rate as part of
 * variable costs.
 *
 * @param profiles An energy profile collection for which to aggregate stats.
 * @return A summary of cost and co2 outcomes by energy generation source.
 */
export function summarize(profiles: ProfileDataset): UtilityOutcomeBreakdown {
  // Compute the consumed (by demand) subset of the energy generation profiles.
  const supplyBreakdown = getSuppliedEnergyBreakdown(profiles);

  // Compute the cost and co2 contributions for each energy source.
  let breakdown = {
    ng: null,
    solar: null,
    wind: null,
    nuclear: null,
    coal: null,
    ngccs: null,
    coalccs: null,
  };
  config.ALL_ENERGY_SOURCES.forEach(source => {
    // Find the total energy generated by the profile (MWh).
    let profileEnergy = util.sum(profiles.series[source]);

    // Find the minimum capacity required to support the profile (MW).
    let profileCapacity = util.max(profiles.series[source]);

    breakdown[source] = {
      capacity: profileCapacity,
      energy: profileEnergy,
      consumed: supplyBreakdown[source],
      fixedCost: getFixedCost(profileCapacity, source),
      variableCost: getVariableCost(profileEnergy, source),
      co2: getCo2(profileEnergy, source),
    };
  });

  // Compute rollups across all energy sources.
  const totalCo2 = util.sum(Object.keys(breakdown).map(s => breakdown[s].co2));
  const totalCost = util.sum(Object.keys(breakdown).map(s => {
    return breakdown[s].fixedCost + breakdown[s].variableCost;
  }));
  // The energy generation from the weekly profile is replicated for a year-long
  // timespan, as is done for the total co2 emissions.
  const totalConsumed = util.sum(Object.keys(breakdown).map(s => {
    return breakdown[s].energy * util.WEEKS_PER_YEAR;
  }));

  return {
    co2: totalCo2,
    cost: totalCost,
    energy: totalConsumed,
    breakdown: breakdown,
  };
}