/* ==========================================================================
   Shared helpers and state for every module.
   The animation libraries come from npm (see package.json).
   ========================================================================== */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import SplitType from 'split-type';

export const root = document.documentElement;

export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export const media = {
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)'),
  fine: window.matchMedia('(hover: hover) and (pointer: fine)'),
  desktop: window.matchMedia('(min-width: 1024px)'),
  mobile: window.matchMedia('(max-width: 767.98px)')
};

export const libs = {
  gsap,
  ScrollTrigger,
  Lenis,
  SplitType
};

/* Mutable state shared between modules */
export const state = {
  motion: false,          // true when GSAP is loaded and motion is allowed
  lenis: null,            // Lenis instance
  velocity: 0,            // current scroll velocity (px per frame, from Lenis)
  neural: null,           // WebGL controller (see js/webgl/neural.js)
  theme: root.dataset.theme || 'dark',
  pointer: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
};

/* Runs one feature; an error in it is logged but never stops the others */
export function safe(name, fn) {
  try {
    return fn();
  } catch (err) {
    console.error(`[portfolio] "${name}" failed:`, err);
    return undefined;
  }
}

export function cssVar(name) {
  return getComputedStyle(root).getPropertyValue(name).trim();
}

export function onThemeChange(fn) {
  document.addEventListener('themechange', fn);
}
