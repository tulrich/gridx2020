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


// Type definition specific to utility mode.
type UtilityEnergySource = /* 'coalccs' | 'ngccs' | */ EnergySource;
type ProfileSeries = 'supply' | 'demand' | 'unmet' | 'co2' | 'spend' | UtilityEnergySource;  // TODO 'stored'
type StorageEnergySource = 'battery' | 'h2';

// Object literal types keyed by a fixed set of values.
type UtilityEnergySourceMap<T> = {[K in UtilityEnergySource]: T};
type UtilityEnergySourceSubsetMap<T> = {[K in UtilityEnergySource]?: T};
type ProfileSeriesMap<T> = {[K in ProfileSeries]: T};
type StorageEnergySourceMap<T> = {[K in StorageEnergySource]: T};

type UtilityOutcomeBreakdown = ScenarioOutcomeBreakdown<UtilityEnergySource>;

/**
 * A collection of energy supply and demand profiles with a common time domain.
 */
interface ProfileDataset {
  // Time domain index that maps 1:1 with each profile series.
  //
  // Each value should be an integer timestamp that is milliseconds since
  // 1 January, 1970 UTC (i.e., UNIX epoch, but in milliseconds).
  index: number[];

  // Common energy profile units for each series.
  //
  // Used for validating conversion of data during dimensional analysis; i.e.,
  // a string consumed by humans while auditing rather than for display;
  // e.g., 'MW'.
  units: string;

  // A set of energy profiles that map 1:1 with one another and the time index.
  //
  // i.e., for all i, series.foo[i] <=> series.bar[i] <=> index[i].
  series: ProfileSeriesMap<number[]>;

  sumCo2?: number;
  sumMwh?: number;
  sumDiscountedCost?: number;
  sumDiscountedMwh?: number;
}

interface Ramp {
  // capacity started construction / endYear avg demand
  buildFraction: number;
  atYear: number;
}

/**
 * Parameters for modeling an energy source during the transition.
 */
interface SourceParameters {
  // year 1 avg output / year 1 avg demand
  initialFraction: number;

  // Desired changes to capacity.
  ramp: Ramp[];

  // Years to construct a plant.
  buildTime: number;
  // $/Watt.
  buildCost: number;
  // Fixed: $/KW/year (staff, rent, maintenance, etc)
  operatingCost: number;
  // Variable: $/MWh
  fuelCost: number;
  // Fraction per doubling. 0.15 means 15% cost reduction per doubling of capacity.
  // Can go negative (increase in cost with increased experience).
  costLearningRate: number; 
  // Fraction of year0 demand to use as baseline for learning, in
  // addition to initial capacity.
  costLearningBase: number;
  // gCO2/KWh
  co2Intensity: number;

  // Years.
  plantLifetime: number;
  // Maximum output per nameplate due to refueling/maintenance.
  maxCapacityFactor: number;

  // 0 means run as baseload, just emit full output.  Non-zero means
  // this is a load-following source, so adjust output to not exceed
  // demand. The number prioritizes this source against other sources
  // (lower numbers dispatched first).
  loadFollowPriority: number;

  // True if this is dispatchable, i.e. scale the output to demand, as
  // opposed to always outputting at max.
  isDispatchable: boolean;
  // True if this is a storage tech.
  isStorage: boolean;
  // For storage tech: between 0 and 1.
  storageRoundTripEfficiency: number;
  // Energy capacity per watt of power capacity.
  storageHours: number;
}

interface ScenarioParameters {
  discountRate: number;
  demandGrowthRate: number;
  carbonPrice: number;
  firstYear: number;
  lastYear: number;
  source: UtilityEnergySourceMap<SourceParameters>;
}

/**
 * Per-energy source allocation fractions.
 *
 * Values are in [0, 1] inclusive, with 0 indicating 0% allocation and
 * 1 indicating 100% allocation for the given energy source (e.g., 'nuclear').
 */
type ProfileAllocations = UtilityEnergySourceMap<number>;

/**
 * Utility mode data and configuration view.
 */
interface UtilityDataView extends SummaryDataView<UtilityEnergySource> {
  // The allocated time profile for each available energy source.
  profiles: ProfileDataset;

  // A highlight profile, subsetting a region of interest.
  highlightProfiles?: ProfileDataset;

  // The simulation parameters.
  params: ScenarioParameters;
}

/**
 * Components that render views of the utility data.
 */
interface UtilityDataComponent {
  /**
   * Updates the component to render data within the new data view.
   *
   * @param view The new data view to render.
   */
  update(view: UtilityDataView);
}