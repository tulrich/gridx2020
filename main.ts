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

import * as formatters from './formatters';
import * as utility from './utility-mode/controller';
import * as appendix from './components/layout';
import * as tabs from './components/tabs';
import * as util from './util';

// The following imports need to be invoked at least once within the bundle
// to link in the required polyfills (Promise, URLSearchParams).
import {Promise, polyfill} from 'es6-promise';
import 'url-search-params-polyfill';


polyfill();
//formatters.configure();

//// From https://github.com/google/energysimulation/tree/master/gridsim/data/profiles
//const transitionDatasetUrl = 'data/profiles_neiso.csv';

// From NE-ISO, after processing by inputdata/prepare.py (see inputdata/README.txt)
const transitionDatasetUrl = 'data/iso-ne-hourly-demand-solar-wind-2013-2018.csv';

//// By default, switching tabs does not reset the scroll to the top of the new
//// newly opened tab in MDL.
//const scrollContainer = document.getElementById('scroll-container');
//util.selectElements('.mdl-tabs__tab .mdl-button').forEach(el => {
//  el.onclick = (event: Event) => {
//    scrollContainer.scrollTop = 0;
//  };
//});

// Create the controllers for the app.
const utilityController = new utility.UtilityController(transitionDatasetUrl);
//xxx const policyController = new policy.PolicyController(
//xxx    new comp.CompareController());

window.addEventListener('load', event => {
  console.debug('window.load', event);
  appendix.initAppendixLinks();
  tabs.init();
  utilityController.init();
  //xxx  policyController.fetchAndInit(policySchemaUrl, policyDatasetUrl);
});