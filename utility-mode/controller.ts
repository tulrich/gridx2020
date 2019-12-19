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

/// <reference path="../typings/index.d.ts" />

import * as profiles from './profiles';
import * as util from '../util';
import * as config from './config';
import * as style from '../style';
import * as transforms from '../transforms';
import * as material from '../node_modules/material-design-lite/material.min.js';
import {OptionToggle} from '../components/toggle';
import {PresetOptionGroup} from '../components/presets';
import {UnmetEnergyDemand} from './unmet-demand';
import {TotalCost} from '../components/cost';
import {Slider} from '../components/slider';
import {CO2GoalChart} from '../components/co2-bar';
import {SupplyDemandProfilesChart} from '../components/energy-profiles';

interface SliderNotifee {
  sliderChanged(binder: SliderBinder): void;
}

const kFormatVersion = 2;

class StateReader {
  _index: number;
  _inString: string;

  constructor(inString: string) {
    this._index = 0;
    this._inString = inString;
  }

  length(): number {
    return this._inString.length;
  }

  nextValue() {
    let i = this._index;
    if (i < this._inString.length) {
      this._index++;
      return this._inString.charCodeAt(i);
    }
    return 0;
  }
}

class SliderBinder {
  id: string;
  _object: Object;
  _key: string;
  _toValueFn: (sliderValue: number) => number;
  _fromValueFn: (value: number) => number;
  _labelFormat: string;
  _slider: Slider;
  _notifee: SliderNotifee;
  _colorIfChanged: boolean;
  tick: number;
  value: number;

  constructor(id: string, object: Object, key: string,
              maxTick: number,  // inclusive
              toValueFn: (tick: number) => number,
              fromValueFn: (value: number) => number,
              labelFormat: string,  // tuple of prefix, d3 format string, and suffix, separated by '|'.
              notifee: SliderNotifee,
              colorIfChanged?: boolean) {
    this.id = id;
    this._object = object;
    this._key = key;
    this._toValueFn = toValueFn;
    this._fromValueFn = fromValueFn;
    this._labelFormat = labelFormat;
    this._notifee = notifee;
    this._colorIfChanged = colorIfChanged ? true : false;

    // Round-trip the value through the tick mapper.
    this.tick = Math.round(fromValueFn(object[key]));
    this.value = toValueFn(this.tick);
    object[key] = this.value;

    let formatParts = this._labelFormat.split('|');
    if (formatParts.length != 3) {
      throw new Error('bad labelFormat');
    }
    let element = document.getElementById(id);
    if (!element) {
      console.log("can't find element " + id);
      return;
    }
    this._slider = new Slider(element,
                              0, maxTick, 1,
                              this.tick,
                              d3.range(0, maxTick + 1).map(x => {
                                  return formatParts[0] + d3.format(formatParts[1])(toValueFn(x)) + formatParts[2];
                                }));
    this._slider.addChangeListener(newTick => {
        this.setTickNoNotify(newTick);
        this._notifee.sliderChanged(this);
      });
  }

  getDefaultTick(): number {
    return this._slider.getDefaultValue();
  }

  setTickNoNotify(tick: number) {
    this._slider.setValueNoNotify(tick);
    this.tick = tick;
    this.value = this._toValueFn(this.tick);
    this._object[this._key] = this.value;
    if (this._colorIfChanged) {
      this._slider.colorIfChanged();
    }
  }
}

/**
 * Controller for utility mode.
 */
export class UtilityController implements SliderNotifee {
  _components: UtilityDataComponent[];
  _dataView: UtilityDataView;
  _animateDataView: {(view: UtilityDataView)};
  _profilesChart: SupplyDemandProfilesChart;
  _highlightProfilesChart: SupplyDemandProfilesChart;
  _co2ProfilesChart: SupplyDemandProfilesChart;
  _parameters: ScenarioParameters;
  _sliderBinders: SliderBinder[];  // All the sliders: plan and assumptions.
  _planSliders: SliderBinder[];  // Just the plan sliders.
  _assumptionSliders: SliderBinder[];   // Just the assumption sliders.
  _defaultStateString: string;

  profileDataset: ProfileDataset;
  transitionDatasetUrl: string;
  _presetOptions: PresetOptionGroup<config.UtilityPresetOption>;

  /**
   * Constructor.
   *
   * @param transitionDatasetUrl The URL containing hourly demand, solar and
   *     wind profiles for at least a year.
   */
  constructor(transitionDatasetUrl: string) {
    this.transitionDatasetUrl = transitionDatasetUrl;
    this._components = [];

    this._animateDataView = util.animate(
        // Calls to animateDataView immediately update the current data view.
        (newView: UtilityDataView) => {
          this._dataView = newView;
        },
        // On animation frame callbacks, the latest data view is rendered.
        () => {
	  this._highlightProfilesChart.configureLayout(this._dataView);
	  this._co2ProfilesChart.configureLayout(this._dataView);
          this._show(this._dataView);
	  this._components.forEach(c => {
	      c.update(this._dataView)
	    });
          this._updateUrl();
        });

    // Non-animated update. Doesn't seem to affect speed.
    /*
    this._animateDataView = (newView: UtilityDataView) => {
      this._dataView = newView;
      this._highlightProfilesChart.configureLayout(this._dataView);
      this._co2ProfilesChart.configureLayout(this._dataView);
      this._show(this._dataView);
      this._components.forEach(c => {
	  c.update(this._dataView)
	});
      this._updateUrl();
    };
    */
  }

  /**
   * Initializes the controller.
   */
  init() {
    //xxx d3.json(this.dataUrl, this._handleDataLoaded.bind(this));

    d3.csv(this.transitionDatasetUrl, this._handleDataLoaded.bind(this));

    let csv_link = document.getElementsByClassName('download-csv-link')[0];
    csv_link['onclick'] = (event: Event) => {
      let data = this._buildCsv(this._dataView); // "some,data,for,test\n0,1,2,3\n";
      let blob = new Blob([data], {type: "text/csv"}); // {type: "octet/stream"});
      let url = window.URL.createObjectURL(blob);
      csv_link['href'] = url;
      csv_link['target'] = '_blank';
      csv_link['download'] = 'gridx2020_dump.csv';  // add some hash or something to the name?
    };
  }

  /**
   * Constructs a utility mode data view from the given elements.
   *
   * @param params Model input parameters.
   * @param allocatedProfiles Full-res hourly profiles from model.
   * @param condensedProfiles Energy source profiles, condensed for display.
   * @param highlightProfiles Profile focused on a region of interest.
   * @returns A utility data view that packages together the current state.
   */
  _asUtilityDataView(params, allocatedProfiles, condensedProfiles, highlightProfiles, outcome): UtilityDataView {
    return {
      params: params,
      rawProfiles: allocatedProfiles,
      profiles: condensedProfiles,
      highlightProfiles: highlightProfiles,
      summary: outcome,
      population: 0, // config.POPULATION,
      baseline: {} as any, // config.BASELINE,
      deltaToRef: {} as any, // transforms.deltas(config.BASELINE, outcome)
    };
  }

  _handleDataLoaded0(error: Error, profileDataset: ProfileDataset) {
    if (error) {
      throw new Error('Failed to load profile dataset.');
    }

    this.profileDataset = profileDataset;
    console.debug('Loaded energy profile dataset0', profileDataset);

    this._initComponents();
  }

  _handleDataLoaded(error: Error, profileDatasetCsv: string[][]) {
    if (error) {
      throw new Error('Failed to load profile dataset.');
    }
    console.debug('[Retrieved] policy mode scenario dataset: '
		  + `${profileDatasetCsv.length} rows`);
    this.profileDataset = profiles.parseAndPadCsv(profileDatasetCsv);
    this._initComponents();
    this._defaultStateString = this._encodeState();
    console.log('default: ' + this._defaultStateString);
    this._decodeUrl();
  }

  sliderChanged(binder?: SliderBinder) {
    this._presetOptions.deselectAll();
    this._updateView();
  }

  _updateView() {
    const allocatedProfiles = profiles.simulateGrid(this._parameters, this.profileDataset);

    const [condensedProfiles, highlightProfiles] = profiles.condenseByPeriod(allocatedProfiles, this._parameters);
    const summary = profiles.summarize(this._parameters, condensedProfiles);
    const newView = this._asUtilityDataView(
					    this._parameters, allocatedProfiles, condensedProfiles, highlightProfiles, summary);
    const perMWhBreakdown: any = {};
    config.ALL_ENERGY_SOURCES.forEach(source => {
      const cost = newView.summary.breakdown[source].cost;
      const consumed = newView.summary.breakdown[source].consumed;
      perMWhBreakdown[source] = {
        cost: cost,
        consumed: consumed,
        perMWh: transforms.perMWhCost(cost, consumed * 52),
      }
    });

    this._animateDataView(newView);
  }

  /*
  _updateAllocations(allocations: ProfileAllocations) {
    return;//xxxxx
    // Recompute the utility data view based upon the updated allocations.
    const allocatedProfiles = profiles.getAllocatedEnergyProfiles(
        allocations,
        this.profileDataset);

    const [condensedProfiles, highlightProfiles] = profiles.condenseByPeriod(allocatedProfiles);
    const summary = profiles.summarize(this._parameters, condensedProfiles);
    const newView = this._asUtilityDataView(
      this._parameters, condensedProfiles, highlightProfiles, summary);
    const perMWhBreakdown: any = {};
    config.ALL_ENERGY_SOURCES.forEach(source => {
      const cost = newView.summary.breakdown[source].cost;
      const consumed = newView.summary.breakdown[source].consumed;
      perMWhBreakdown[source] = {
        cost: cost,
        consumed: consumed,
        perMWh: transforms.perMWhCost(cost, consumed * 52),
      }
    });

    this._animateDataView(newView);
  }
  */

  _initComponents() {
    // Create the initial data view.
    this._parameters = {} as any;
    util.mergeDeep(config.DEFAULT_PARAMETERS, this._parameters);

    const allocatedProfiles = profiles.simulateGrid(this._parameters, this.profileDataset);
    const [condensedProfiles, highlightProfiles] = profiles.condenseByPeriod(allocatedProfiles, this._parameters);
    const updatedSummary = profiles.summarize(this._parameters, condensedProfiles);
    const utilityDataView = this._asUtilityDataView(
						    this._parameters, allocatedProfiles, condensedProfiles, highlightProfiles, updatedSummary);

    // Create each of the output components.
    const kChartWidth = 350;

    this._profilesChart = new SupplyDemandProfilesChart(
        document.getElementById('utility-mode-profiles-chart'),
        //document.getElementById('utility-mode-highlight-profiles-chart'),
        utilityDataView,
        {
           size: { width: kChartWidth, height: 200 },//xxxx
        });
    this._components.push(this._profilesChart);

    this._highlightProfilesChart = new SupplyDemandProfilesChart(
         document.getElementById('utility-mode-highlight-profiles-chart'),
         //document.getElementById('utility-mode-profiles-chart'),
	 utilityDataView,
	 {
           size: { width: kChartWidth, height: 200 },//xxxx
           useHighlightProfiles: true //xxxx
         });
    this._components.push(this._highlightProfilesChart);

    this._co2ProfilesChart = new SupplyDemandProfilesChart(
	 document.getElementById('utility-mode-co2-profiles-chart'),
	 utilityDataView,
	 {
           size: { width: kChartWidth, height: 200 },
	   useCo2Profiles: true,
	   profileLines: ['co2'],
	   labels: { yAxis: 'CO2 (Mt/y)' },
	 });
    this._components.push(this._co2ProfilesChart);

    const CO2_CHART_DATA_CONFIG = {
      max: config.CO2_EMISSIONS_MAX,
      markers: [
        {value: 0, label: ''},
        {value: config.CO2_EMISSIONS_MAX, label: ''},
        {value: config.CO2_EMISSIONS_BAU, label: 'Default'},
        {value: config.CO2_EMISSIONS_GOAL, label: 'Min Goal'},
      ]
    };
    this._components.push(new CO2GoalChart(
        document.getElementById('utility-mode-goal-progress'),
        utilityDataView, {
          data: CO2_CHART_DATA_CONFIG,
          bar: {width: kChartWidth, height: 25},
          textRight: { offset: { x: kChartWidth - 20, y: 6 } },
          ticks: {alignThreshold: 5},
        }));

    // Create each of the input sliders.
    const maxDemandPower = d3.max(this.profileDataset.series.demand);
    const sliderFormatter = d3.format('.1f');
    function getDisplayValues(series) {
      //const maxPower = d3.max(series); // Megawatts.
      return d3.range(0, 101).map(percent => {
        // Render slider values as Gigawats.
        return sliderFormatter(maxDemandPower / 1000 * (percent / 100));
      });
    }

    this._planSliders = [];
    this._assumptionSliders = [];
    this._sliderBinders = [];
    let addPlanSlider = (s: SliderBinder) => {
      this._planSliders.push(s);
      this._sliderBinders.push(s);
    };
    let addAssumptionSlider = (s: SliderBinder) => {
      this._assumptionSliders.push(s);
      this._sliderBinders.push(s);
    };
    addAssumptionSlider(new SliderBinder('discount-rate-slider',
                                         this._parameters, 'discountRate',
                                         40,
                                         (tick: number) => { return (tick - 20) / 200; },
                                         (value: number) => { return value * 200 + 20; },
                                         "|.1%|", this, true));
    addAssumptionSlider(new SliderBinder('demand-growth-rate-slider',
                                            this._parameters, 'demandGrowthRate',
                                            40,
                                            (tick: number) => { return (tick - 20) / 200; },
                                            (value: number) => { return value * 200 + 20; },
                                            "|.1%|", this, true));
    addAssumptionSlider(new SliderBinder('carbon-price-slider',
                                            this._parameters, 'carbonPrice',
                                            100,
                                            (tick: number) => { return tick * 2; },
                                            (value: number) => { return value / 2; },
                                            "$|.0f|/t", this, true));
    for (let source in this._parameters.source) {
      addAssumptionSlider(new SliderBinder(`${source}-initial-fraction-slider`,
                                          this._parameters.source[source], 'initialFraction',
                                          100,
                                          (tick: number) => { return tick / 50; },
                                          (value: number) => { return value * 50; },
                                          '|.2f|x', this, true));
      addPlanSlider(new SliderBinder(`${source}-ramp0-build-fraction-slider`,
                                          this._parameters.source[source].ramp[0], 'buildFraction',
                                          100,
                                          (tick: number) => { return tick / 20; },
                                          (value: number) => { return value * 20; },
                                          '|.2f|x', this));
      addPlanSlider(new SliderBinder(`${source}-ramp0-at-year-slider`,
                                          this._parameters.source[source].ramp[0], 'atYear',
                                          19,
                                          (tick: number) => { return tick + 2021; },
                                          (value: number) => { return value - 2021; },
                                          "|.0f|", this));
      addPlanSlider(new SliderBinder(`${source}-ramp1-build-fraction-slider`,
                                          this._parameters.source[source].ramp[1], 'buildFraction',
                                          100,
                                          (tick: number) => { return tick / 20; },
                                          (value: number) => { return value * 20; },
                                          '|.2f|x', this));
      addPlanSlider(new SliderBinder(`${source}-ramp1-at-year-slider`,
                                          this._parameters.source[source].ramp[1], 'atYear',
                                          19,
                                          (tick: number) => { return tick + 2021; },
                                          (value: number) => { return value - 2021; },
                                          "|.0f|", this));
      addAssumptionSlider(new SliderBinder(`${source}-build-time-slider`,
                                          this._parameters.source[source], 'buildTime',
                                          11,
                                          (tick: number) => { return tick + 1; },
                                          (value: number) => { return value - 1; },
                                          '|.0f|y', this, true));
      addAssumptionSlider(new SliderBinder(`${source}-build-cost-slider`,
                                          this._parameters.source[source], 'buildCost',
                                          100,
                                          (tick: number) => { return tick / 10; },
                                          (value: number) => { return value * 10; },
                                          '$|.1f|/W', this, true));
      addAssumptionSlider(new SliderBinder(`${source}-operating-cost-slider`,
                                          this._parameters.source[source], 'operatingCost',
                                          100,
                                          (tick: number) => { return tick * 2; },
                                          (value: number) => { return value / 2; },
                                          '$|.2f|/KW', this, true));
      addAssumptionSlider(new SliderBinder(`${source}-fuel-cost-slider`,
                                          this._parameters.source[source], 'fuelCost',
                                          100,
                                          (tick: number) => { return tick / 2; },
                                          (value: number) => { return value * 2; },
                                          '$|.1f|/MWh', this, true));
      addAssumptionSlider(new SliderBinder(`${source}-cost-learning-rate-slider`,
                                          this._parameters.source[source], 'costLearningRate',
                                          50,
                                          (tick: number) => { return (tick - 25) / 100; },
                                          (value: number) => { return value * 100 + 25; },
                                          '|.0%|', this, true));
      addAssumptionSlider(new SliderBinder(`${source}-co2-intensity-slider`,
                                          this._parameters.source[source], 'co2Intensity',
                                          200,
                                          (tick: number) => {
                                            if (tick <= 20) {
                                              return tick - 10;
                                            } else {
                                              return Math.pow(10, 1 + (tick - 20) * 2 / 183);
                                            }
                                          },
                                          (value: number) => {
                                            if (value < 10) {
                                              return value + 10;
                                            } else {
                                              return ((Math.log(value)*Math.LOG10E - 1) * 183 / 2) + 20;
                                            }
                                          },
                                          '|.0f|g/KWh', this, true));
      addAssumptionSlider(new SliderBinder(`${source}-plant-lifetime-slider`,
                                          this._parameters.source[source], 'plantLifetime',
                                          49,
                                          (tick: number) => { return tick + 1; },
                                          (value: number) => { return value - 1; },
                                          '|.0f|y', this, true));
      addAssumptionSlider(new SliderBinder(`${source}-max-capacity-factor-slider`,
                                          this._parameters.source[source], 'maxCapacityFactor',
                                          100,
                                          (tick: number) => { return tick / 100; },
                                          (value: number) => { return value * 100; },
                                          '|.0%|', this, true));
      if (this._parameters.source[source].isStorage) {
        addAssumptionSlider(new SliderBinder(`${source}-storage-round-trip-efficiency-slider`,
                                            this._parameters.source[source], 'storageRoundTripEfficiency',
                                            100,
                                            (tick: number) => { return tick / 100; },
                                            (value: number) => { return value * 100; },
                                            '|.0%|', this, true));
        addAssumptionSlider(new SliderBinder(`${source}-storage-hours-slider`,
                                            this._parameters.source[source], 'storageHours',
                                            50,
                                            (tick: number) => {
                                              if (tick < 10) {
                                                return tick + 1;
                                              } else {
                                                return Math.pow(10, 1 + (tick - 10) / 20);
                                              }
                                            },
                                            (value: number) => {
                                              if (value <= 10) {
                                                return value - 1;
                                              } else {
                                                return ((Math.log(value) * Math.LOG10E - 1) * 20) + 10;
                                              }
                                            },
                                            '|.0f|h', this, true));
      }
    }

    this._components.push(new UnmetEnergyDemand([
                                                 document.getElementById('utility-outcome-summary-unmet'),
                                                 document.getElementById('scroll-container'),
                                                 document.getElementById('co2-cost-tab'),
                                                 document.getElementById('profile-focus-tab'),
                                                 //document.getElementById('utility-outcome-summary')
                                                 ]));

    // Initialize the preset buttons that can specify slider states.
    this._presetOptions = createUtilityPresets((stateString: string) => {
        if (!this._decodeState(stateString)) {
          // Clear hash.
          history.replaceState({}, '', `${location.origin + location.pathname}`);
        }
      });

    // Hook up response to tab taps.
    let t1 = document.getElementById('graph-tabs');
    let anchorTags = t1.getElementsByTagName('a');
    for (let i = 0; i < anchorTags.length; i++) {
      let a = anchorTags[i];
      //...
    }

    this.sliderChanged(undefined);
  }

  _buildCsv(view: UtilityDataView) {
    let csv = '';

    // Results summary.
    csv += 'LCOE $/MWh,CO2 g/KWh,unmet demand hours\n';
    csv +=
      d3.format('.2f')(view.profiles.sumDiscountedCost / view.profiles.sumDiscountedMwh) + ',' +
      d3.format('.0f')(view.profiles.sumCo2 * 1e3 / view.profiles.sumMwh) + ',' +
      view.rawProfiles.series['unmet'].filter(value => value > 0).length + '\n';
    csv += '\n';

    // Parameters.
    let paramsKeys = getKeys(view.params, ['source', 'firstYear', 'lastYear']);
    csv += csvHeaderLine(paramsKeys);
    csv += csvValueLine(paramsKeys, view.params);
    csv += '\n';
    let sourceRowKeys = getKeys(view.params.source, []);
    let sourceParams = ['source', 'build0Fraction', 'build0Year', 'build1Fraction', 'build1Year']
      .concat(getKeys(view.params.source['solar'], ['ramp']));
    csv += csvHeaderLine(sourceParams);
    for (let sourceKey of sourceRowKeys) {
      let sourceParams = view.params.source[sourceKey];
      let vals = [sourceKey,
                  sourceParams.ramp[0].buildFraction,
                  sourceParams.ramp[0].atYear,
                  sourceParams.ramp[1].buildFraction,
                  sourceParams.ramp[1].atYear,
                  ];
      for (let k in sourceParams) {
        if (k != 'ramp') {
          vals.push(sourceParams[k]);
        }
      }
      csv += csvLine(vals);
    }
    csv += '\n';

    // Annual spending.
    csv += 'year';
    sourceRowKeys.forEach(source => { csv += ',' + source + ' $'; });
    csv += '\n';
    for (let year in view.profiles.capacitySpend['solar']) {
      csv += (2020 + Number(year));
      sourceRowKeys.forEach(source => {
          let spend = (view.profiles.capacitySpend[source][year] + view.profiles.capacitySpend[source][year]);
          csv += ',' + d3.format('.0f')(spend);
        });
      csv += '\n';
    }
    csv += '\n';

    // Annual CO2.
    csv += 'year';
    sourceRowKeys.forEach(source => { csv += ',' + source + ' tCO2'; });
    csv += '\n';
    for (let year in view.profiles.sourceCo2['solar']) {
      csv += (2020 + Number(year));
      sourceRowKeys.forEach(source => {
          let co2 = view.profiles.sourceCo2[source][year];
          csv += ',' + d3.format('.0f')(co2);
        });
      csv += '\n';
    }
    csv += '\n';

    // Full profiles.
    let profileKeys = getKeys(view.rawProfiles.series, []);
    csv += 'index,' + csvHeaderLine(profileKeys);
    for (let i = 0; i < view.rawProfiles.series.demand.length && i < 100; i++) {
      csv += i;
      profileKeys.forEach(key => {
	  csv += ',' + d3.format('.0f')(view.rawProfiles.series[key][i]);
	});
      csv += '\n';
    }

    return csv;
  }

  _show(view: UtilityDataView) {
    let lcoe = view.profiles.sumDiscountedCost / view.profiles.sumDiscountedMwh;
    let lcoeString = d3.format('.2f')(lcoe);
    let elems = document.getElementsByClassName('utility-mode-cost');
    for (let i = 0; i < elems.length; i++) {
      elems[i].textContent = lcoeString;
    }

    elems = document.getElementsByClassName('utility-mode-co2');
    let gCo2 = view.profiles.sumCo2 * 1e3 / view.profiles.sumMwh;
    let co2String = d3.format('.0f')(gCo2);
    for (let i = 0; i < elems.length; i++) {
      elems[i].textContent = co2String;
    }
    
//     view.summary.co2 = view.profiles.sumCo2;
//     let tonnesCo2 = view.profiles.sumCo2;
//     document.getElementById('').textContent = d3.format(',.3s')(tonnesCo2);
  }

  _updateUrl() {
    let stateString = this._encodeState();
    let hashString = '#' + stateString;
    if (stateString == this._defaultStateString) {
      hashString = '';
    }
    let location = window.location;
    history.replaceState({}, '', `${location.origin + location.pathname}${hashString}`);
  }

  _decodeUrl() {
    let location = window.location;
    if (!this._decodeState(window.location.hash.slice(1))) {
      // Clear hash.
      history.replaceState({}, '', `${location.origin + location.pathname}`);
    }
  }

  _encodeState(): string {
    // Serialize slider states.
    let asciiState = '';

    let sliderList = undefined;
    let anyAssumptionsChanged = false;
    for (let s of this._assumptionSliders) {
      if (s.tick != s.getDefaultTick()) {
        anyAssumptionsChanged = true;
        break;
      }
    }
    if (anyAssumptionsChanged) {
      sliderList = this._sliderBinders;
    } else {
      sliderList = this._planSliders;
    }

    // Increment this with each incompatible state-format update
    // (slider ranges, slider order & number, etc). Can use this to
    // support reading old versions of the state string.
    asciiState += String.fromCharCode(kFormatVersion);
    asciiState += String.fromCharCode(sliderList.length);
    for (let i = 0; i < sliderList.length; i++) {
      asciiState += String.fromCharCode(sliderList[i].tick);
    }

    return btoa(asciiState);
  }

  _resetStateNoNotify() {
    for (let s of this._sliderBinders) {
      s.setTickNoNotify(s.getDefaultTick());
    }
  }

  _decodeState(base64State: string): boolean {
    this._resetStateNoNotify();
    let reader = new StateReader(atob(base64State));
    if (reader.length() < 2) {
      console.log('failed to load, length: ' + reader.length());
      this.sliderChanged();
      return false;
    }

    let version = reader.nextValue();
    if (version > kFormatVersion) {
      console.log('newer format: ' + version + '; page is old or url is corrupted.');
      this.sliderChanged();
      return false;
    }
    let resetOperatingCosts = false;
    if (version == 1) {
      // After loading, reset any operatingCost values to the default, since the scale changed after version 1.
      resetOperatingCosts = true;
    } else if (version < kFormatVersion) {
      // TODO handle old version.
      console.log('older format: ' + version + '; can\'t handle.');
      this.sliderChanged();
      return false;
    }
    let sliderLength = reader.nextValue();
    let sliderList = undefined;
    if (reader.length() != sliderLength + 2) {
      console.log('bad slider length: ' + sliderLength + ', should be ' + this._planSliders.length + ' or ' + this._sliderBinders);
      return false;
    } else if (sliderLength == this._planSliders.length) {
      sliderList = this._planSliders;
    } else if (sliderLength == this._sliderBinders.length) {
      sliderList = this._sliderBinders;
    }
    // TODO Check that reader has enough values left to read.

    // Read values.
    for (let i = 0; i < sliderList.length; i++) {
      let tick = reader.nextValue();
      sliderList[i].setTickNoNotify(tick);

      if (resetOperatingCosts && sliderList[i].id.endsWith('operating-cost-slider')) {
        sliderList[i].setTickNoNotify(sliderList[i].getDefaultTick());
      }

    }
    this.sliderChanged(undefined);
    return true;
  }
}

function createUtilityPresets(callback: (stateString: string) => void): PresetOptionGroup<config.UtilityPresetOption> {
  const presetElementConfig:
      {[K in config.UtilityPresetOption]: HTMLElement} = {
    DEFAULT: document.getElementById('preset-util-default'),
    RE: document.getElementById('preset-util-re'),
    NUCLEAR: document.getElementById('preset-util-nuclear'),
    NO_H2: document.getElementById('preset-util-no-h2'),
    FLAT: document.getElementById('preset-util-flat'),
    GAS: document.getElementById('preset-util-gas'),
  };

  // Callback that reconfigures the set of sliders for a given preset
  // allocation.
  const utilityPresetCallback = (presetKey: config.UtilityPresetOption) => {
    // Set each of the sliders to the preset allocation level
    // the outputs are updated due to the slider values changing
    // and triggering onChange callbacks.
    const presetStateString = config.PRESET_ALLOCATIONS[presetKey];
    callback(presetStateString);
  };

  return new PresetOptionGroup<config.UtilityPresetOption>(
      presetElementConfig, utilityPresetCallback);
}

function getKeys(value: Object, excludeKeys: string[]) {
  let out = [];
  for (let key in value) {
    if (excludeKeys.indexOf(key) == -1) {
      out.push(key);
    }
  }
  return out;
}

function csvHeaderLine(keys: string[]) {
  let csv = '';
  for (let i = 0; i < keys.length; i++) {
    if (csv.length) {
      csv += ',';
    }
    csv += keys[i];
  }
  csv += '\n'
  return csv;
};

function csvValueLine(keys: string[], value: Object) {
  let csv = '';
  for (let key of keys) {
    if (csv.length) {
      csv += ',';
    }
    csv += value[key];
  }
  csv += '\n';
  return csv;
}

function csvLine(vals: Object[]) {
  let csv = '';
  for (let val of vals) {
    if (csv.length) {
      csv += ',';
    }
    csv += val;
  }
  csv += '\n';
  return csv;
}
