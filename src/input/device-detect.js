/** True when the device's main pointer is a finger (phones, tablets). */
export function isTouchDevice() {
  const coarse =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  return coarse || 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
}

/** Portrait orientation (taller than wide). */
export function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

export function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
