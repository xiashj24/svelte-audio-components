import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Led from './Led.svelte';

// Led is output-only — no interaction to drive. We assert what it communicates:
// its accessible on/off label, and the --level CSS variable that the styling
// reads (so brightness is observable without inspecting rendered pixels). We read
// the inline custom property directly — jsdom's getComputedStyle is unreliable
// for CSS variables.

const led = () => screen.getByRole('img');
const level = () => led().style.getPropertyValue('--level');

describe('Led', () => {
  it('is labelled "off" when not lit', () => {
    render(Led, { props: { on: false } });
    expect(led()).toHaveAttribute('aria-label', 'off');
    expect(level()).toBe('0');
  });

  it('is labelled "on" and fully bright when on', () => {
    render(Led, { props: { on: true } });
    expect(led()).toHaveAttribute('aria-label', 'on');
    expect(level()).toBe('1');
  });

  it('uses intensity as a continuous brightness when provided', () => {
    render(Led, { props: { intensity: 0.5 } });
    expect(led()).toHaveAttribute('aria-label', 'on');
    expect(level()).toBe('0.5');
  });

  it('lets intensity override the on flag', () => {
    render(Led, { props: { on: true, intensity: 0 } });
    expect(led()).toHaveAttribute('aria-label', 'off');
    expect(level()).toBe('0');
  });

  it('clamps out-of-range intensity into 0..1', () => {
    render(Led, { props: { intensity: 5 } });
    expect(level()).toBe('1');
  });
});
