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
export const CO2_EMISSIONS_BAU = 653e6;
// CO2 emissions (Mt) goal.
export const CO2_EMISSIONS_GOAL = 265e6;  // <-- 2017 CO2 * 15 years / 2, i.e. linear ramp to 0 in 15 years.
// Max CO2 emissions value to display.
export const CO2_EMISSIONS_MAX = 1000e6;

export const START_TIMESTAMP = (new Date(Date.UTC(2020, 1 - 1, 1, 0, 0))).getTime();
export const END_TIMESTAMP = (new Date(Date.UTC(2040, 2 - 1, 15, 0, 0))).getTime();

// emissions goal: want a tick at 1.5C-compatible level.
//
// https://www.ipcc.ch/site/assets/uploads/sites/2/2019/02/SR15_Chapter2_Low_Res.pdf
//
// something like, need to get to zero by 2035. Doing straight line from 2020 to 0 at 2035 yields
// about 243Mt

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


// Lazard cost numbers, from https://www.lazard.com/media/450784/lazards-levelized-cost-of-energy-version-120-vfinal.pdf
//
// PV crystalline, utility-scale (50MW)
//   1,250-950 $/KW; 12-9 $/KW/y; const time 9 mos.
//   Avg: 1.1 $/W; 10.5 $/KW/y. 30 yr life.
// Wind, onshore (150MW)
//   1,150-1,550 $/KW; 28-36 $/KW/y; const time 12 mos.
//   Avg: 1.35 $/W; 32 $/KW/y. 20 yr life.
// Hydro
//   (no hydro figures)
// Nuclear (2,200MW)
//   6,500-12,250 $/KW; 115-135 $/KW/y; var 0.75 $/MWh; fuel 0.85 $/mmBTU, heat rate 10,450 BTU/kWh;  const time 69mo (5.75y).
//   Avg: 9,375 $/KW; 125 $/KW/y. Fuel: 0.00888 $/kWh, var 0.00075 $/kWh, sum 0.00963 $/kWh. 40 yr life.
// Gas Peaking (241-50)
//   700-950 $/KW; fixed 5-20 $/KW/y; var 4.70-10 $/MWh; fuel 3.45 $/mmBTU, heat rate 9804-8000 BTU/kWh; const time 12-18 mos.
//   Avg 825 $/KW; 7.35 $/KW/y. Fuel: 0.0307 $/kWh, var: 0.00735 $/kWh, sum 0.03805 $/kWh. 20 yr life.
// Coal (600MW)
//   3,000-8,400 $/KW; fixed 40-80 $/KW/y; var 2-5 $/MWh; fuel 1.45 $/mmBTU, heat rate 8,750-12,000 BTU/kWh; const time 60-66 mos (5-5.5y).
//   Avg 5,700 $/KW; 60 $/KW/y; Fuel: 0.0150 $/kWh, var: 0.0035 $/KWh, sum 0.0185 $/kWh. 40 yr life.


// Lazard cost numbers, v13, Nov 2019, from https://www.lazard.com/media/451086/lazards-levelized-cost-of-energy-version-130-vf.pdf
//
// PV crystalline, utility-stale (100MW)
//   1,100-900 $/KW; 12-9 $/KW/y; 9 mos; 30 years.
//   Avg: 1.0 $/W, 10.5 $/KW/y; 9 mos; 30 y.
// Wind, onshore (150MW)
//   1,100-1,500 $/KW; 28-36 $/KW/y; 12 mos; 20 y.
//   Avg: 1.3 $/W; 32 $/KW/y; 12 mos; 20 y.
// Hydro
//   --
// Nuclear (2200MW)
//   6,900-12,200 $/KW; 108-133 $/KW/y; var 3.50-4.25 $/MWh; fuel 0.85 $/mmBTU, heat rate 10,450 BTU/kWh; 69 mo (5.75y); 40 y.
//   Avg: 9.55 $/W; 120 $/KW/y; fuel 0.00888 $/kWh, var 0.00375 $/kWh, sum 0.012 $/kWh. 5.75y; 40y.
// Gas Peaking (240-50)
//   700-950 $/KW; fixed 5.5-20.75 $/KW/y, var 4.75-6.25 $/MWh; fuel 3.45 $/mmBTU, heat rate 9804-8000 BTU/kWh; 1-1.5y; 20 y.
//   Avg: 825 $/KW; 13.125 $/KW/y; fuel 0.0307 $/kWh, var 0.0055 $/kWh, sum 0.0362 $/kWh. 1-1.5y; 20y.
// Coal (600MW)
//   3,000-6,250 $/KW; 40.75-81.75 $/KW/y, var 2.75-5 $/MWh; fuel 1.45 $/mmBTU, heat rate 8,750-12,000 BTU/KWh; 5-5.5y; 40 y.
//   Avg: 4.625 $/W; 61.125 $/KW/y; fuel 0.015 $/kWh, var 0.003875 $/kWh, sum 0.018875 $/kWh; 5y; 40y.


// Wind 5 year CAGR: 7%
// PV 5 year CAGR: 13%

// Learning rates: https://www.mdpi.com/2071-1050/11/8/2310/pdf
// * 1-factor (learn by doing) vs 2-factor (learn by doing + learn by searching (R&D))



// Lazard storage numbers, from https://www.lazard.com/media/450774/lazards-levelized-cost-of-storage-version-40-vfinal.pdf
// Lithium-ion (Wholesale)
//   232-398 $/KWh. EPC costs $16. Installed cost $114-181. O&M % of BESS 1.28-0.76%. O&M % of PCS 1.71-1.01%. Warranty expense % of BESS 1.50%. Warranty expense $ of PCS 2.0%. eff 87-90%. Lifetime 20y.
//   What is BESS?? Battery Energy System.
//   What is PCS?? Power Conversion System.
//   Average all the %'s and apply to capital cost -> fixed: (1.28+.76+1.71+1.01)/4+(1.5+2.0)/2/100 * ((232+398)/2) = 6.70 $/KW/y.
//   4 X ( Avg: 315 $/KWh; 6.70 $/KW/y ).
//   Avg: $1.26/W, $26.8 $/KW/y; 20 year life.

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
      buildTime: 1,
      buildCost: 1.0,
      operatingCost: 10.5,
      fuelCost: 0,
      costLearningRate: 0.15,
      costLearningBase: 0.08,  // More solar deployed outside ISO-NE, less learning rate benefit.
      co2Intensity: 8,
      plantLifetime: 30,
      maxCapacityFactor: 0.98,
      loadFollowPriority: 0,

      isDispatchable: false,
      isStorage: false,
      storageRoundTripEfficiency: 0,
      storageHours: 0,
    },
    wind: {
      initialFraction: 0.04,
      buildTime: 1,
      buildCost: 1.3,
      ramp: [{
          buildFraction: 0.20,
          atYear: 2030,
        }, {
          buildFraction: 0.50,
          atYear: 2040,
        }],
      operatingCost: 32,
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
      buildTime: 4,
      buildCost: 2.95,
      ramp: [{
          buildFraction: 0.08,
          atYear: 2030,
        }, {
          buildFraction: 0.08,
          atYear: 2040,
        }],
      operatingCost: 40.85,
      fuelCost: 1.36,
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
      buildTime: 6,
      buildCost: 9.55,
      ramp: [{
          buildFraction: 0.30,
          atYear: 2030,
        }, {
          buildFraction: 0.30,
          atYear: 2040,
        }],
      operatingCost: 120,
      fuelCost: 12,
      costLearningRate: 0.1,
      costLearningBase: 0.3,
      co2Intensity: 13,
      plantLifetime: 40,
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
      buildTime: 1,
      buildCost: 0.825,
      ramp: [{
          buildFraction: 1.85,
          atYear: 2030,
        }, {
          buildFraction: 2.45,
          atYear: 2040,
        }],
      operatingCost: 13.125,
      fuelCost: 36.2,
      costLearningRate: 0.05,
      costLearningBase: 1.4,
      co2Intensity: 447,
      plantLifetime: 20,
      maxCapacityFactor: 0.95,
      loadFollowPriority: 2,

      isDispatchable: true,
      isStorage: false,
      storageRoundTripEfficiency: 0,
      storageHours: 0,
    },
    coal: {
      initialFraction: 0.02,
      buildTime: 5,
      buildCost: 4.625,
      ramp: [{
          buildFraction: 0.0,
          atYear: 2025,
        }, {
          buildFraction: 0.0,
          atYear: 2040,
        }],
      operatingCost: 61.1,
      fuelCost: 18.9,
      costLearningRate: 0.05,
      costLearningBase: 1,
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
      buildCost: 1.26,
      operatingCost: 26.8,
      fuelCost: 0,
      costLearningRate: 0.15,
      costLearningBase: 0,
      co2Intensity: 0,
      plantLifetime: 20,
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
      operatingCost: 20,
      fuelCost: 5.5,  // Includes membrane replacement of ~ $2.2/MWh / 40%
      costLearningRate: 0.15,
      costLearningBase: 0,
      co2Intensity: 4,
      plantLifetime: 20,
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
export type UtilityPresetOption = 'DEFAULT' | 'RE' | 'NUCLEAR' | 'NO_H2' | 'FLAT' | 'GAS';
export const PRESET_ALLOCATIONS:
    {[K in UtilityPresetOption]: string} = {
  // Default.
  DEFAULT: "ASAECQgTBAkKEwIJAhMGCQYTJQkxEwAEABMACQATAAkAEw==",
  RE: "AiAJBBYTDQgSEwIJAhMGCQYTJQkxEwAAABMECQgTCgVTEw==",
  NUCLEAR: "AiAJBAADBwcAEwIJAhMWBiUTIQ0CEwAAABMICAsTAQUZEw==",
  NO_H2: "AiANBRwTDQgUEwIJAhMGCQYTJQkxEwAEABMXCGQTAAUAEw==",
  FLAT: "Am8gFAACABMAEwALBQAoEh1iAgETABMADhAAKA8TXwQCCQITAx4UAxlBMWIPBgkGEwVePxMjHjFbRhoJGxMACARMHqsTXwABEwATBDkeJR7IJ18AAAkAEwANDQAoChNiUAMAAAkAEwEVCgsoDhNfIC8=",
  GAS: "AiAAAAATAAAAEwIJAhMGCQYTKQk5EwATABMACQATAAkAEw==",
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
