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

import * as comparisonpane from './comparison-pane';


export function init() {
//   const scrollingContainer = document.querySelector('#container');
//   const scrollToTop = () => {
//     scrollingContainer.scrollTop = 0;
//   };
//   const tabButtons = document.querySelectorAll('a.mdl-tabs__tab');
//   for (let i = 0, button; button = tabButtons[i]; i++) {
//     if (button.getAttribute('href') == '#tab3') {
//       button.addEventListener('click', () => {
//         comparisonpane.update();
//         scrollToTop();
//       }, false);
//     } else {
//       button.addEventListener('click', scrollToTop, false);
//     }
//   }
  // TODO(corrieann): Support linking directly to a tab.

  initTabs_();
}

// Tab implementation made from pieces of
// material-design-lite/src/tabs.js. Basically to support nested tab
// panels.

const MY_MDL_JS_TABS_CLASS = 'my-mdl-js-tabs';
const TAB_CLASS = 'mdl-tabs__tab';
const PANEL_CLASS = 'my-mdl-tabs__panel';
const TABS_BAR = 'mdl-tabs__tab-bar';
const ACTIVE_CLASS = 'is-active';
const UPGRADED_CLASS = 'is-upgraded';
const MDL_JS_RIPPLE_EFFECT = 'mdl-js-ripple-effect';
const MDL_RIPPLE_CONTAINER = 'mdl-tabs__ripple-container';
const MDL_RIPPLE = 'mdl-ripple';
const MDL_JS_RIPPLE_EFFECT_IGNORE_EVENTS = 'mdl-js-ripple-effect--ignore-events';

function initTabs_() {
  let allContainers = document.querySelectorAll('.' + MY_MDL_JS_TABS_CLASS);
  //xxx let allContainers = document.getElementsByClassName(MY_MDL_JS_TABS_CLASS);
  for (let i = 0, c; c = allContainers[i]; i++) {
    if (c.classList.contains(MDL_JS_RIPPLE_EFFECT)) {
      c.classList.add(MDL_JS_RIPPLE_EFFECT_IGNORE_EVENTS);
    }

    // Select element tabs, document panels
    let tabs = c.querySelectorAll('.' + TAB_CLASS);

    // Init each tab element.
    for (let j = 0; j < tabs.length; j++) {
      initTab_(tabs[j], c);
    }

    let panels = c.querySelectorAll('.' + PANEL_CLASS);
    for (let j = 0; j < panels.length; j++) {
      panels[j].classList.add(UPGRADED_CLASS);
    }

    c.classList.add(UPGRADED_CLASS);
  }
}

// Reset tab and panel state, dropping active classes.
function resetTabAndPanelState_(tab: HTMLElement) {
  var p = tab.closest('.' + TABS_BAR);
  if (p) {
    var sibs = p.querySelectorAll('.' + TAB_CLASS);
    // Remove is-active from tabs and the panels they point to.
    for (var k = 0; k < sibs.length; k++) {
      sibs[k].classList.remove(ACTIVE_CLASS);
      if (sibs[k].getAttribute('href').charAt(0) === '#') {
	var href = sibs[k]['href'].split('#')[1];
	var panel = document.querySelector('#' + href);
	panel.classList.remove(ACTIVE_CLASS);
      }
    }
  }
}

function initTab_(tab: HTMLElement, ctx: HTMLElement) {
  if (tab) {
    if (ctx.classList.contains(MDL_JS_RIPPLE_EFFECT)) {
      var rippleContainer = document.createElement('span');
      rippleContainer.classList.add(MDL_RIPPLE_CONTAINER);
      rippleContainer.classList.add(MDL_JS_RIPPLE_EFFECT);
      var ripple = document.createElement('span');
      ripple.classList.add(MDL_RIPPLE);
      rippleContainer.appendChild(ripple);
      tab.appendChild(rippleContainer);
    }

    tab.addEventListener('click', function(e) {
        if (tab.getAttribute('href').charAt(0) === '#') {
          e.preventDefault();
          var href = tab['href'].split('#')[1];
          var panel = ctx.querySelector('#' + href);
          resetTabAndPanelState_(tab);
          tab.classList.add(ACTIVE_CLASS);
          panel.classList.add(ACTIVE_CLASS);
        }
      });
    tab.classList.add(UPGRADED_CLASS);
  }
}
