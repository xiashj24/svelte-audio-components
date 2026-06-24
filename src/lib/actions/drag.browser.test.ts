import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { drag } from './drag';

// These run in real headless Chromium (the "browser" project), because jsdom
// can neither construct PointerEvents nor implement setPointerCapture. We
// dispatch real PointerEvents and stub the capture calls — a synthetically
// dispatched pointer isn't a real "active" pointer, so setPointerCapture would
// otherwise throw. Everything else (the delta maths, axis, fine factor,
// lifecycle) is exercised exactly as it runs in the app.

let node: HTMLDivElement;
let handle: ReturnType<typeof drag>;

beforeEach(() => {
  node = document.createElement('div');
  node.setPointerCapture = () => {};
  node.releasePointerCapture = () => {};
  document.body.appendChild(node);
});

afterEach(() => {
  handle?.destroy?.();
  node.remove();
});

const pointer = (type: string, init: PointerEventInit) =>
  node.dispatchEvent(new PointerEvent(type, { pointerId: 1, bubbles: true, ...init }));

describe('drag action', () => {
  it('reports a normalized delta from vertical travel (up = positive)', () => {
    const onDelta = vi.fn();
    handle = drag(node, { onDelta }); // default: y axis, 200px = full 0..1
    pointer('pointerdown', { clientY: 100, button: 0 });
    pointer('pointermove', { clientY: 50 }); // up 50px -> 50/200
    expect(onDelta).toHaveBeenCalledWith(0.25);
  });

  it('treats downward travel as negative', () => {
    const onDelta = vi.fn();
    handle = drag(node, { onDelta });
    pointer('pointerdown', { clientY: 100, button: 0 });
    pointer('pointermove', { clientY: 120 }); // down 20px
    expect(onDelta).toHaveBeenCalledWith(expect.closeTo(-0.1));
  });

  it('uses the x axis when asked (right = positive)', () => {
    const onDelta = vi.fn();
    handle = drag(node, { onDelta, axis: 'x' });
    pointer('pointerdown', { clientX: 0, button: 0 });
    pointer('pointermove', { clientX: 40 }); // right 40px
    expect(onDelta).toHaveBeenCalledWith(expect.closeTo(0.2));
  });

  it('applies the fine factor while Shift is held', () => {
    const onDelta = vi.fn();
    handle = drag(node, { onDelta }); // fineFactor default 0.2
    pointer('pointerdown', { clientY: 100, button: 0 });
    pointer('pointermove', { clientY: 50, shiftKey: true }); // 0.25 * 0.2
    expect(onDelta).toHaveBeenCalledWith(expect.closeTo(0.05));
  });

  it('honours a custom pixelsForFullRange', () => {
    const onDelta = vi.fn();
    handle = drag(node, { onDelta, pixelsForFullRange: 100 });
    pointer('pointerdown', { clientY: 100, button: 0 });
    pointer('pointermove', { clientY: 50 }); // 50/100
    expect(onDelta).toHaveBeenCalledWith(0.5);
  });

  it('fires onStart/onEnd around the gesture and ignores moves after release', () => {
    const onDelta = vi.fn();
    const onStart = vi.fn();
    const onEnd = vi.fn();
    handle = drag(node, { onDelta, onStart, onEnd });

    pointer('pointerdown', { clientY: 100, button: 0 });
    expect(onStart).toHaveBeenCalledOnce();

    pointer('pointermove', { clientY: 80 });
    pointer('pointerup', { clientY: 80 });
    expect(onEnd).toHaveBeenCalledOnce();

    onDelta.mockClear();
    pointer('pointermove', { clientY: 40 }); // released -> no longer dragging
    expect(onDelta).not.toHaveBeenCalled();
  });

  it('ignores non-primary buttons', () => {
    const onDelta = vi.fn();
    const onStart = vi.fn();
    handle = drag(node, { onDelta, onStart });
    pointer('pointerdown', { clientY: 100, button: 1 }); // middle button
    pointer('pointermove', { clientY: 50 });
    expect(onStart).not.toHaveBeenCalled();
    expect(onDelta).not.toHaveBeenCalled();
  });
});
