'use client';

import { useSyncExternalStore } from 'react';

// Tiny cross-component pub/sub so the mobile sidebar drawer can be
// toggled from parts of the dashboard shell that render as siblings —
// Topbar's hamburger button and the mobile bottom tab bar's "More" item
// (both rendered inside Sidebar) all need to open/close the exact same
// drawer state without prop-drilling through every dashboard page.
let isOpen = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function openMobileNav() {
  isOpen = true;
  emit();
}

export function closeMobileNav() {
  isOpen = false;
  emit();
}

export function toggleMobileNav() {
  isOpen = !isOpen;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return isOpen;
}

function getServerSnapshot() {
  return false;
}

export function useMobileNavOpen() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
