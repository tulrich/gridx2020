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

/// <reference path="../typings/index.d.ts"/>


/**
 * Initializes links to appendix pages.
 */
export function initAppendixLinks() {
  // Configure appendix link behavior to trigger the modal content switch
  // via MDL tabs when clicked.
  let modelSection = document.getElementById('utility-mode');
  let aboutSection = document.getElementById('about-appendix');

  let list = document.getElementsByClassName('model-link');
  for (let i = 0; i < list.length; i++) {
    list[i]['onclick'] = (event: Event) => {
      event.preventDefault();
      aboutSection.classList.add('hidden');
      modelSection.classList.remove('hidden');
    };
  }
  list = document.getElementsByClassName('about-link');
  for (let i = 0; i < list.length; i++) {
    list[i]['onclick'] = (event: Event) => {
      event.preventDefault();
      modelSection.classList.add('hidden');
      aboutSection.classList.remove('hidden');
    };
  }

//   document.getElementById('title-about-appendix').onclick = (event: Event) => {
//     event.preventDefault();
//     modelSection.classList.add('hidden');
//     aboutSection.classList.remove('hidden');
//   };
}