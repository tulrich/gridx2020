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

/// <reference path="typings/index.d.ts" />
/// <reference path="dataset.d.ts" />
/// <reference path="es6.d.ts" />


// Declare that we expect ES6 Object features to be available.
declare const Object: ObjectConstructorES6;


export const shallowCopy = (source: Object, dest: Object) => {
    return Object.assign(dest, source);
};

export const deltas = (baseline: ScenarioOutcome, current: ScenarioOutcome) => {
    function delta(ref, value) {
        return (value - ref) / ref;
    }

    return {
        co2: delta(baseline.co2, current.co2),
        cost: delta(baseline.cost, current.cost),
    };
};

// TODO: need to "show the work" on this formulation somewhere.
const MONTHLY_COST_PER_HOUSEHOLD_DIVISOR = 2.083e9;
export const asMonthlyPerHouseholdCost = (totalCost: number) => {
    return totalCost / MONTHLY_COST_PER_HOUSEHOLD_DIVISOR;
};

/**
 * Gets the sum of the series of numeric values.
 *
 * @param series An array of numbers.
 * @return The sum of the array.
 */
export function sum(series: number[]) {
  let total = 0;
  series.forEach(x => total += x);
  return total;
}

/**
 * Gets the maximum value within the series of numerica values.
 *
 * @param series An array of numbers.
 * @return The maxiumum value within the series or -Infinity for zero-length
 *     series.
 */
export function max(series: number[]) {
  let maxSoFar = -Infinity;
  series.forEach(x => maxSoFar = Math.max(maxSoFar, x));
  return maxSoFar;
}

/**
 * Selects elements in the DOM matching the given query selector.
 *
 * @param querySelector A DOM query selector string.
 * @return The array of elements that matched the query selector.
 */
export function selectElements(querySelector: string): HTMLElement[] {
    let nodeList = document.querySelectorAll(querySelector);
    return Array.prototype.slice.call(nodeList);
}