"use client";

import { useSyncExternalStore } from "react";

// What the custom cursor should show: hovering a project card, hovering the
// mail button, and whether the email was just copied. It lives outside React
// state on purpose: keeping it in the home page re-rendered the whole page
// (tech stack, footer, every card) on each hover. Now only the components
// that show it re-render.
const SERVER_STATE = Object.freeze({ project: false, mail: false, mailCopied: false });
let state = SERVER_STATE;
const listeners = new Set();

export function setCursorState(patch) {
  let changed = false;
  for (const key in patch) {
    if (state[key] !== patch[key]) changed = true;
  }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCursorState() {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}
