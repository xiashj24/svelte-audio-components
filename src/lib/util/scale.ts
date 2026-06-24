/**
 * Value-scaling / "taper" helpers.
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * The widgets themselves only ever deal in a normalized 0..1 value. They know
 * nothing about Hz, dB, semitones, or whether a control is linear or logarithmic.
 * That mapping lives here (and in the demo / model layer), NOT in the widgets.
 *
 * Why: audio controls are almost never linear (a "cutoff" knob is logarithmic,
 * a "volume" fader is roughly exponential, etc.), and that taper logic should be
 * shared with — and ideally owned by — your real parameter model (the C++/WASM
 * side later). Keeping widgets normalized means the same Knob can drive a Hz
 * value today and a dB value tomorrow without changing the widget.
 */

/** Clamp `n` to the inclusive range [min, max]. */
export const clamp = (n: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, n));

/** Linear map: normalized 0..1 -> [min, max]. */
export const fromNorm = (norm: number, min: number, max: number): number =>
  min + clamp(norm) * (max - min);

/** Linear map: value in [min, max] -> normalized 0..1. */
export const toNorm = (value: number, min: number, max: number): number =>
  max === min ? 0 : clamp((value - min) / (max - min));

/**
 * Logarithmic (a.k.a. exponential) map, the right curve for frequency, pitch,
 * and most "feels musical" controls. `min` and `max` must both be > 0.
 */
export const fromNormLog = (norm: number, min: number, max: number): number =>
  min * Math.pow(max / min, clamp(norm));

/** Inverse of {@link fromNormLog}. */
export const toNormLog = (value: number, min: number, max: number): number =>
  clamp(Math.log(value / min) / Math.log(max / min));
