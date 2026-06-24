import { describe, it, expect } from 'vitest';
import { clamp, fromNorm, toNorm, fromNormLog, toNormLog } from './scale';

// Pure functions — no DOM, no rendering. This is the simplest possible test:
// call a function, assert the return value. A good place to feel the
// red-green-refactor loop before touching components.

describe('clamp', () => {
  it('passes values inside the range through unchanged', () => {
    expect(clamp(0.5)).toBe(0.5);
  });

  it('clamps values below the minimum', () => {
    expect(clamp(-1)).toBe(0);
  });

  it('clamps values above the maximum', () => {
    expect(clamp(2)).toBe(1);
  });

  it('respects a custom range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(20, 0, 10)).toBe(10);
  });
});

describe('linear taper', () => {
  it('maps normalized 0..1 onto [min, max]', () => {
    expect(fromNorm(0, 100, 200)).toBe(100);
    expect(fromNorm(0.5, 100, 200)).toBe(150);
    expect(fromNorm(1, 100, 200)).toBe(200);
  });

  it('toNorm is the inverse of fromNorm', () => {
    const value = fromNorm(0.3, 100, 200);
    expect(toNorm(value, 100, 200)).toBeCloseTo(0.3);
  });

  it('toNorm returns 0 for a zero-width range instead of dividing by zero', () => {
    expect(toNorm(5, 5, 5)).toBe(0);
  });
});

describe('logarithmic taper (frequency / pitch curves)', () => {
  it('hits the endpoints exactly', () => {
    expect(fromNormLog(0, 20, 20000)).toBeCloseTo(20);
    expect(fromNormLog(1, 20, 20000)).toBeCloseTo(20000);
  });

  it('puts the geometric mean at the halfway point', () => {
    // For a log sweep, norm=0.5 sits at sqrt(min*max), not (min+max)/2.
    expect(fromNormLog(0.5, 20, 20000)).toBeCloseTo(Math.sqrt(20 * 20000));
  });

  it('toNormLog round-trips back to the original normalized value', () => {
    const hz = fromNormLog(0.42, 20, 20000);
    expect(toNormLog(hz, 20, 20000)).toBeCloseTo(0.42);
  });
});
