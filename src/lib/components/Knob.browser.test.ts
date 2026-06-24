/// <reference types="@vitest/browser/context" />
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Knob from './Knob.svelte';

// The jsdom Knob tests cover keyboard + ARIA. This proves the *drag* path — the
// part that can only run in a real browser — actually moves the value end to end.
// We render in Chromium, then dispatch real PointerEvents on the slider. Note
// `expect.element(...)` auto-retries, which neatly handles Svelte's async DOM
// update after the value changes.

// vitest-browser-svelte passes props as the second argument directly
// (no { props } wrapper, unlike @testing-library/svelte).

function dragVertically(el: HTMLElement, fromY: number, toY: number) {
  el.setPointerCapture = () => {};
  el.releasePointerCapture = () => {};
  const opts = { pointerId: 1, button: 0, bubbles: true };
  el.dispatchEvent(new PointerEvent('pointerdown', { ...opts, clientY: fromY }));
  el.dispatchEvent(new PointerEvent('pointermove', { ...opts, clientY: toY }));
  el.dispatchEvent(new PointerEvent('pointerup', { ...opts, clientY: toY }));
}

describe('Knob drag (real browser)', () => {
  it('increases the value when dragged up', async () => {
    const onchange = vi.fn();
    const screen = render(Knob, { value: 0.5, onchange });
    const slider = screen.getByRole('slider');

    // up 50px; default pixelsForFullRange 200 => +0.25
    dragVertically(slider.element() as HTMLElement, 100, 50);

    await expect.element(slider).toHaveAttribute('aria-valuenow', '75');
    expect(onchange).toHaveBeenCalledWith(0.75);
  });

  it('decreases the value when dragged down', async () => {
    const screen = render(Knob, { value: 0.5 });
    const slider = screen.getByRole('slider');

    // down 50px => -0.25
    dragVertically(slider.element() as HTMLElement, 50, 100);

    await expect.element(slider).toHaveAttribute('aria-valuenow', '25');
  });

  it('does not move when disabled', async () => {
    const onchange = vi.fn();
    const screen = render(Knob, { value: 0.5, disabled: true, onchange });
    const slider = screen.getByRole('slider');

    dragVertically(slider.element() as HTMLElement, 100, 50);

    await expect.element(slider).toHaveAttribute('aria-valuenow', '50');
    expect(onchange).not.toHaveBeenCalled();
  });
});
