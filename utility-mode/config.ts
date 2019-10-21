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


// CO2 emissions (Mt) for business-as-usual.
export const CO2_EMISSIONS_BAU = 657e6;
// CO2 emissions (Mt) goal.
export const CO2_EMISSIONS_GOAL = 265e6;  // <-- 2017 CO2 * 15 years / 2, i.e. linear ramp to 0 in 15 years.
// Max CO2 emissions value to display.
export const CO2_EMISSIONS_MAX = 1000e6;

export const START_TIMESTAMP = (new Date(Date.UTC(2020, 1 - 1, 1, 0, 0))).getTime();
export const END_TIMESTAMP = (new Date(Date.UTC(2040, 2 - 1, 15, 0, 0))).getTime();

// The default state of the dataset selection and page controls.
// export const BASELINE: ScenarioOutcomeBreakdown<UtilityEnergySource> = {
//   cost: 104e9, // $USD
//   co2: 57.0e6, // metric tonnes/year
//   energy: 280e6, // MWh/year
//   // Note: the per-energy source breakdown is currently not utilized by utility
//   // mode, but if required at some future point, the national-level breakdown
//   // would make sense here.
//   breakdown: null,
// };
// export const POPULATION = 39.1e6; // California; Source: 2015 US Census.

/*
// Fixed cost (capital + fixed) per MW of capacity by energy source.
//
// Units are dollars USD per MW of capacity ($/MW)
export const FIXED_COST: UtilityEnergySourceMap<number> = {
  ng: 770633.,
  solar: 1356035.,
  wind: 2181533.,
  nuclear: 4667258.,
  coal: 3388939.,
  //  ngccs: 1505159,
  //  coalccs: 4559261.,
  battery: 1156000.,
  h2: 2000000.,
};

// Variable cost (including fuel) per MW-hour by energy source.
//
// Units are dollars USD per MWh ($/MWh).
export const VARIABLE_COST: UtilityEnergySourceMap<number> = {
  ng: 32.1,
  nuclear: 24.0,  //xxxx
  solar: 5.0,
  wind: 12.0,  //xxx
  coal: 23.3,
  //  ngccs: 47.7,
  //  coalccs: 42.9,
  battery: 5.0,
  h2: 5.0,
};

// Rate of CO2 creation for each energy source.
//
// Units are tonnes-of-co2 per MWh-of-energy-supplied (tonnes/MWh)
export const CO2_RATE: UtilityEnergySourceMap<number> = {
  ng: 0.4538,
  nuclear: 0.004,  //xxx
  solar: -0.002,  //xxx
  wind: 0.0,
  coal: 0.8582,
  //  ngccs: 0.0549,
  //  coalccs: 0.1013,
  battery: 0.0,
  h2: 0.0,
};

// Hours of storage for storage types.
export const STORAGE_HOURS: StorageEnergySourceMap<number> = {
  battery: 4.,
  h2: 720.,
};

export const STORAGE_ROUND_TRIP_EFFICIENCY: StorageEnergySourceMap<number> = {
  battery: 0.8,
  h2: 0.4,
};
*/

// Grid mix (2018)
// https://www.iso-ne.com/about/key-stats/resource-mix/
//
// total: 103702 GWh
// gas: 49%
// nuclear: 30%
// wind: 3.2%
// refuse: 2.9%  <-- pretend this is gas?
// wood: 2.6%  <-- pretend this is gas?
// solar: 1.2%
// hydro: 8.4%  <-- matters! pretend it's baseload
// oil: 1.1%
// coal: 1%
//
// Imports: 17%  (Quebec 64%, NB 18%, NY 16%)

// Rounding & condensing:
// gas = (49 + 3 + 2) = 54% but oversize it because it's dispatchable
// nuclear = 30%
// wind: 4% (round up for 2020 #'s)
// solar: 2% (round up for 2020 #'s)
// hydro: 8% (round down)

// co2Intensity
// CO2 intensity, clear chart here: https://web.stanford.edu/group/efmh/jacobson/Articles/I/NuclearVsWWS.pdf
// Including only Lifecycle + Anthro heat + water vapor
//
// solar: lifecycle 10-29, heat -2.2
//   "The range is derived from Fthenakis and Raugei (2017). It is
//   inclusive of the 17 g-CO2/kWh mean for CdTe panels at 11 percent
//   efficiency, the 27 g-CO2e/kWh mean for multi-crystalline silicon
//   panels at 13.2 percent efficiency, and the 29 gCO2e/kWh mean for
//   mono-crystalline silicon panels at 14 percent efficiency. The
//   upper limit of the range is held at the mean for
//   multi-crystalline silicon since panel efficiencies are now much
//   higher than 13.2 percent. The lower limit is calculated by
//   scaling the CdTe mean to 18.5 percent efficiency, its maximum in
//   2018."
// wind: lifecycle 7.0-10.8, heat -2.2
// hydro: lifecycle 17-22, heat 2.7-26
// nuclear: lifecycle 9-70, heat,vapor 4.4
// ng ccs: lifecycle 179-405, heat, vapor 0.61, 3.7
// coal ccs: lifecycle 230-935, heat vapor 1.5, 3.6
// battery: ~0 because of cycling?
// h2: ?

// For low carbon sources, take the low end of the range. Because,
// these values are in the noise until grid is decarbonized, so they
// should represent decarbonized industry.
//
// solar: 8
// wind: 5
// hydro: 17 + 14.35 = 31
// nuclear: 13
// ng: (be generous, this one calibrated to ISO-NE report) 447
// coal: (take high value) 940 --> use max slider value of 927
// battery: 0
// h2: 4

// EIA chart here: https://www.eia.gov/environment/emissions/co2_vol_mass.php
// EIA says:
// ng: 53.07kg/mmBTU. 1mmBTU=293KWh. Apply efficiency, 0.40-0.60 --> 301-452 g/KWh
// 
// IPCC:
//   https://www.ipcc.ch/site/assets/uploads/2018/02/ipcc_wg3_ar5_chapter7.pdf
//   IPCC (2014) says: " For RE, emissions are mainly associated with
//   the manufacturing and installation of the power plants, but for
//   nuclear power, uranium enrichment can be significant (Warner and
//   Heath, 2012). Generally, the ranges are quite wide reflecting
//   differences in local resource conditions, technology, and
//   methodological choices of the assessment. The lower end of
//   estimates often reflects incomplete systems while the higher end
//   reflects poor local conditions or outdated technology. "
// Cites Hsu 2012, https://onlinelibrary.wiley.com/doi/full/10.1111/j.1530-9290.2011.00439.x
//   "After harmonizing key performance characteristics (irradiation
//   of 1,700 kilowatt‐hours per square meter per year (kWh/m2/yr);
//   system lifetime of 30 years; module efficiency of 13.2% or 14.0%,
//   depending on module type; and a performance ratio of 0.75 or
//   0.80, depending on installation, the median estimate decreased to
//   45 and the IQR tightened to 39 to 49. The median estimate and
//   variability were reduced compared to published estimates mainly
//   because of higher average assumptions for irradiation and system
//   lifetime."
// 40 * 13.8 / 20 --> 27.6. Modules must be thinner now...


// NE-ISO 2017 Emissions:
// https://www.iso-ne.com/static-assets/documents/2019/04/2017_emissions_report.pdf
// In 2017, 102,500 GWh, 31.7 Mt CO2, avg 309 g/KWh
// Mix:
//  48% gas
//  1% oil
//  2% coal
//  31% nuclear
//  7% hydro
//  7% other renewables (trash, biomass, etc?)
//  3% wind
//
// Allowance: 31.7 * 7.5 = 237.7 ~= 240
//            38.6 * 7.5 = 290
// Average them: 265Mt


// Build costs
//
// H2:
// Electrolysis:
//
// https://www.hydrogen.energy.gov/pdfs/14004_h2_production_cost_pem_electrolysis.pdf
//   PEM electrolyser $5.12 / kg H2
//
// Cap cost: $900/kW
// Installation cost: 12% of uninstalled cap cost.
// Installed total: $1008/kW.
//
// 7 year component replacement interval, needs 15% investment of uninstalled cost to replace stuff
//   So, $135/kW every 7 years, let's say add opex of $19/KW/y --> OUCH!
//
//   Maybe this is more accurately analysed as a fuel cost, i.e. per
//   kWh. pay $19 per KWy --> $2.2 / MWh
//
// 40 year plant life.
//
// What about the hydrogen storage tanks? Salt caverns?
// https://prod-ng.sandia.gov/techlib-noauth/access-control.cgi/2011/114845.pdf
// * underground storage is extremely cheap, ~0.3 $/KWh.
// * tank storage is more, $15/KWh.
// For 720 hour storage, underground is 0.3 * 720 = $216/KW --> 0.22 $/W, pretty cheap.
// Tank is $15 * 720 = $10,800 --> 11 $/W, too expensive. Underground it is.
// 
//
// H2 turbine cost:
//   Assume it's like gas? so add gas operatingCost of 1.2 $/KW/y
//     add buildCost of 0.85 $/W
//
// H2 PEM + turbine
//   buildCost: 1.008 + 0.85 + 0.22 == $/W
//   operatingCost: 20.2
//
// Round trip: 80% PEM * 40% open-cycle turbine == 0.32


// Operating Costs:
// EIA on costs: https://www.eia.gov/tools/faqs/faq.php?id=19&t=3
// https://www.eia.gov/electricity/annual/html/epa_08_04.html
// (use 2017 numbers)

//
// mills/kWh == $/MWh
// gas: opex 2.45, maint 2.83, fuel 26.48, total 31.76
// nuclear: opex 10.27, maint 6.63, fuel 7.47 total 24.38
// hydro: opex 6.33, maint 3.96, fuel 0, total 10.29
// coal: ?
// solar: close to 0?
// wind: close to 0?


// EIA: Cost and Performance Characteristics of New Generating Technologies,
// Annual Energy Outlook 2019
// https://www.eia.gov/outlooks/aeo/assumptions/pdf/table_8.2.pdf

// Solar, fixed tilt:
// 2 year lead time. Total overnight: $1.78/W. Fixed O&M: $22.5/KW/y. Variable O&M: 0.
// Wind, onshore:
// 3 year lead time. Total overnight: $1.62/W. Fixed O&M: $48.4/KW/y. Variable O&M: 0.
// Hydro:
// 4 year lead time. Total overnight: $2.95/W. Fixed: $40.85/KW/y. Varaible: $1.36/MWh.
// Nuclear (adv):
// 6 year lead time. Total overnight: $6.03/W. Fixed O&M: $103.31/KW/y. Variable O&M: $2.37/MWh.
// Conventional combustion turbine:
// 2 year lead time. Total overnight: $1.13/W. Fixed: $18.03/KW/y. Variable: $3.61/MWh.
// Battery:
// 1 year lead time. Total overnight: $1.95/W. Fixed: $36.32/KW/y. Variable: $7.26/MWh.


//
// combine opex and maint into operatingCost
// MW capacity * capFactor * 8760 hrs == MWh/year per MW
// cost per MW == $/MWh / (MWh/year per MW) == $/MWh / 8760 * CF

// $/MWh * 8760 * CF = $/MW/y

// E.g. Nuclear plant: 1000 * 8760 * 0.91 * 17 --> 135,517,200 $/y. $/MW/y = 1000 * 8760 * 0.91 * 17 / 1000 = $135,517. $/KW/y = $135. $/W/y = $0.135

// E.g. Solar: 1000 * 8760 * 0.20 * 10 --> 17,520,000 $/y. $/MW/y = 17,520,000 / 1000 = $17,520.

// e.g. nuclear (10.27 + 6.63) / (0.91 * 8760) * 1000 --> 2.12 $/KW/y
// gas, (2.45 + 2.83) / (0.50 * 8760) * 1000 --> 1.21 $/KW/y
// hydro, (6.33 + 3.96) / (0.95 * 8760) * 1000 --> 1.24 $/KW/y
// solar, (wild guess!!) 0.50 / (0.20 * 8760) * 1000 --> 0.29 $/KW/y
// wind, (wild guess!!) 1 / (0.31 * 8760) * 1000 --> 0.37 $/KW/y
// h2, PEM is 1 $/KW/y plus membrane replacement cost modeled as fuel at $5.5/MWh

// Re fuel -- from https://www.eia.gov/electricity/monthly/update/resource_use.php
// "price of natural gas at New York City ($17.93/MWh) was below the price of
//  Central Appalachian coal ($28.41/MWh) during July 2019,"
// But that's for combined-cycle gas. Peaking requires simple
// cycle which uses more fuel, let's assume price for gas of $22/MWh.

// Re carbon price -- we don't have an explicit price in the US as of
// 2019, so I'm defaulting it to 0.
// European carbon price on 2019 Oct 7 is approximately $26/t.

export const DEFAULT_PARAMETERS: ScenarioParameters = {
  discountRate: 0.06,
  demandGrowthRate: 0.03,
  // $/ton CO2
  carbonPrice: 0,
  firstYear: 2020,
  lastYear: 2040,
  source: {
    solar: {
      initialFraction: 0.02,
      ramp: [{
          buildFraction: 0.20,
          atYear: 2030,
        }, {
          buildFraction: 0.40,
          atYear: 2040,
        }],
      buildTime: 2,  // was 1
      buildCost: 1.78,  // was 1.1 (guess)
      // https://medium.com/@solar.dao/everything-you-need-to-know-about-operations-maintenance-o-m-for-utility-scale-pv-solar-plants-9d0048e9b9a2
      operatingCost: 22,  // was 0.30 "No idea, need support for this." Duncan Campbell says "on small commerical projects I'm using 18, including amortized cost of inverter replacement once, I figured utility scale would be even less"
      fuelCost: 0,
      costLearningRate: 0.15,
      costLearningBase: 0.08,  // More solar deployed outside ISO-NE, less learning rate benefit.
      co2Intensity: 8,
      plantLifetime: 25,
      maxCapacityFactor: 0.98,
      loadFollowPriority: 0,

      isDispatchable: false,
      isStorage: false,
      storageRoundTripEfficiency: 0,
      storageHours: 0,
    },
    wind: {
      initialFraction: 0.04,
      buildTime: 3,
      buildCost: 1.62,  // was 2.0, "check!"
      ramp: [{
          buildFraction: 0.20,
          atYear: 2030,
        }, {
          buildFraction: 0.50,
          atYear: 2040,
        }],
      operatingCost: 48,
      fuelCost: 0,
      costLearningRate: 0.15,
      costLearningBase: 0.05,  // A little bit more wind deployed outside ISO-NE, relatively
      co2Intensity: 5,
      plantLifetime: 20,
      maxCapacityFactor: 0.95,
      loadFollowPriority: 0,

      isDispatchable: false,
      isStorage: false,
      storageRoundTripEfficiency: 0,
      storageHours: 0,
    },
    hydro: {
      initialFraction: 0.08,
      buildTime: 4, // was 10,
      buildCost: 2.95, // was 4.0,
      ramp: [{
          buildFraction: 0.08,
          atYear: 2030,
        }, {
          buildFraction: 0.08,
          atYear: 2040,
        }],
      operatingCost: 40,
      fuelCost: 0,
      costLearningRate: 0,
      costLearningBase: 0,
      co2Intensity: 31,
      plantLifetime: 50,
      maxCapacityFactor: 0.98,
      loadFollowPriority: 0,

      isDispatchable: false,
      isStorage: false,
      storageRoundTripEfficiency: 0,
      storageHours: 0,
    },
    nuclear: {
      initialFraction: 0.30,
      buildTime: 6,  // was 10
      buildCost: 6.03,  // was 5.0
      ramp: [{
          buildFraction: 0.30,
          atYear: 2030,
        }, {
          buildFraction: 0.30,
          atYear: 2040,
        }],
      operatingCost: 104, // actual value 103.31, but slider doesn't go that high
      fuelCost: 2.37,
      costLearningRate: 0.1,
      costLearningBase: 0,
      co2Intensity: 13,
      plantLifetime: 50,
      // servicing: ~2 months every ~2 years, spring or fall
      // https://www.eia.gov/todayinenergy/detail.php?id=1490
      maxCapacityFactor: 0.91,
      loadFollowPriority: 0,

      isDispatchable: false,
      isStorage: false,
      storageRoundTripEfficiency: 0,
      storageHours: 0,
    },
    ng: {
      initialFraction: 1.40,
      buildTime: 2,
      buildCost: 1.13, // was 0.85,
      ramp: [{
          buildFraction: 1.85,
          atYear: 2030,
        }, {
          buildFraction: 2.45,
          atYear: 2040,
        }],
      operatingCost: 18,
      fuelCost: 3.61,
      costLearningRate: 0.05,
      costLearningBase: 0,
      co2Intensity: 447,
      plantLifetime: 40,
      maxCapacityFactor: 0.95,
      loadFollowPriority: 2,

      isDispatchable: true,
      isStorage: false,
      storageRoundTripEfficiency: 0,
      storageHours: 0,
    },
    coal: {
      initialFraction: 0.02,
      buildTime: 2,
      buildCost: 1.13, // copied gas, dunno real value. was 0.80,
      ramp: [{
          buildFraction: 0.0,
          atYear: 2025,
        }, {
          buildFraction: 0.0,
          atYear: 2040,
        }],
      operatingCost: 18,  // not sure, setting same as gas.
      fuelCost: 2.8,  // not sure, find a source for this
      costLearningRate: 0.05,
      costLearningBase: 0,
      co2Intensity: 927,  // max slider value
      plantLifetime: 40,
      maxCapacityFactor: 0.95,
      loadFollowPriority: 3,

      isDispatchable: false,
      isStorage: false,
      storageRoundTripEfficiency: 0,
      storageHours: 0,
    },
    battery: {
      initialFraction: 0,
      ramp: [{
          buildFraction: 0,
          atYear: 2030,
        }, {
          buildFraction: 0,
          atYear: 2040,
        }],
      buildTime: 1,
      buildCost: 1.156,  // 2019 price for 4-hour turnkey
      operatingCost: 36,
      fuelCost: 0,  // EIA report says 7.26, what does that mean? Is it elec input???
      costLearningRate: 0.15,
      costLearningBase: 0,
      co2Intensity: 0,
      plantLifetime: 15,
      maxCapacityFactor: 0.98,
      loadFollowPriority: 1,

      isDispatchable: true,
      isStorage: true,
      storageRoundTripEfficiency: 0.80,
      storageHours: 4,
    },
    h2: {
      initialFraction: 0,
      ramp: [{
          buildFraction: 0,
          atYear: 2030,
        }, {
          buildFraction: 0,
          atYear: 2040,
        }],
      buildTime: 2,
      buildCost: 2.08,
      operatingCost: 40,
      fuelCost: 5.5,  // Includes membrane replacement of ~ $2.2/MWh / 40%
      costLearningRate: 0.15,
      costLearningBase: 0,
      co2Intensity: 4,
      plantLifetime: 40,
      maxCapacityFactor: 0.95,
      loadFollowPriority: 1,

      isDispatchable: true,
      isStorage: true,
      storageRoundTripEfficiency: 0.32,
      storageHours: 720,
    },
  },
}

// Pre-configured allocations that support the utility-mode preset buttons.
export type UtilityPresetOption = 'DEFAULT'; // xxxx | 'WIND' | 'SOLAR' | 'RE_AND_STORAGE';
export const PRESET_ALLOCATIONS:
    {[K in UtilityPresetOption]: string} = {
  // Default.
  DEFAULT: "ASAECQgTBAkKEwIJAhMGCQYTJQkxEwAEABMACQATAAkAEw==",
//   // Wind-heavy.
//   WIND: "AW8gGg0BBAkPEwALAwAoEBhiAhoJIxMBFAQAKBATXwQCCQITCSgMABkUMWIPBgkGEwkyFQ8jEhNbMhIJHBMBCQwsHqEnXwEABAATAQgMOB7CJ18AAAkAEwAMAgAoCg5iUAMAAAkAEwEVCgsoCidfIC8=",
//   // Solar-heavy.
//   SOLAR: "AW8gGg0BIwMyEwALAwAoEBhiAgQJChMBFAQAKBATXwQCCQITCSgMABkUMWIPBgkGEwkyFQ8jEhNbMhQJHBMBCQwsHqEnXwEABAATAQgMOB7CJ18AAAkAEwAMAgAoCg5iUAMAAAkAEwEVCgsoCidfIC8=",
//   RE_AND_STORAGE: "AW8gGg0BEAMuEwALAwAoEBhiAgoDFBMBFAQAKBATXwQCCQITCSgMABkUMWIPBgkGEwkyFQ8jEhNbMhQJHBMBCQwsHqEnXwEABAATAQgMOB7CJ18AAgBBEwAMAgAoCg5iUAMAAAkAEwEVCgsoCidfIC8=",
};

// Categorization of energy sources by dispatch capability.
export const NON_DISPATCHABLE_ENERGY_SOURCES: UtilityEnergySource[] = [
                                                                       'solar', 'wind', 'hydro', 'nuclear', 'coal'];
export const STORAGE_ENERGY_SOURCES: UtilityEnergySource[] = [
       'battery', 'h2'];
export const DISPATCHABLE_ENERGY_SOURCES: UtilityEnergySource[] = [
                                                                   'ng'];
export const ALL_ENERGY_SOURCES: UtilityEnergySource[] = (
    DISPATCHABLE_ENERGY_SOURCES.concat(NON_DISPATCHABLE_ENERGY_SOURCES)).concat(STORAGE_ENERGY_SOURCES);
// Not all energy sources have a corresponding slider directly controlling;
// fossil fuel-based sources have multiple variants (ccs/non-ccs).
export const SLIDER_ENERGY_SOURCES: UtilityEnergySource[] = [
    'solar', 'wind', 'hydro', 'nuclear', 'coal', 'ng', 'battery', 'h2'];
