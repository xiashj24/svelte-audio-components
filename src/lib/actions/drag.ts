import type { Action } from 'svelte/action';

/**
 * Options for the `drag` action.
 *
 * The action reports *normalized* deltas (a fraction of the full 0..1 range),
 * not pixels and not real units. The widget decides what to do with them.
 * That keeps the interaction logic in one place and the widgets free of
 * pointer-event boilerplate.
 */
export interface DragOptions {
  /** Called on each move. `delta` is positive when the value should increase. */
  onDelta: (delta: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  /** 'y' = vertical drag (up increases), 'x' = horizontal (right increases). */
  axis?: 'x' | 'y';
  /** How many pixels of travel equals the full 0..1 range. Default 200. */
  pixelsForFullRange?: number;
  /** Multiplier applied while Shift is held, for fine adjustment. Default 0.2. */
  fineFactor?: number;
}

/**
 * Hardware-style value dragging: grab anywhere on the control and drag.
 * - Vertical (default): up = increase, down = decrease.
 * - Hold Shift for fine adjustment.
 * - Works with mouse, touch and pen via Pointer Events.
 *
 * Usage in a component:
 *   <div use:drag={{ onDelta: (d) => set(value + d) }}>...</div>
 */
export const drag: Action<HTMLElement | SVGElement, DragOptions> = (node, options) => {
  let opts = options;
  let lastX = 0;
  let lastY = 0;
  let dragging = false;

  // Both HTMLElement and SVGElement support these APIs at runtime; this cast
  // just gives us the precise PointerEvent-typed addEventListener overloads.
  const el = node as HTMLElement;

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return; // left button / primary touch only
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    node.setPointerCapture(e.pointerId); // keep receiving moves outside the element
    opts.onStart?.();
    e.preventDefault();
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    const axis = opts.axis ?? 'y';
    const px = opts.pixelsForFullRange ?? 200;
    // Screen Y grows downward, so negate dy to make "drag up" = increase.
    const travel = axis === 'x' ? dx : -dy;
    let delta = travel / px;
    if (e.shiftKey) delta *= opts.fineFactor ?? 0.2;
    if (delta !== 0) opts.onDelta(delta);
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    try {
      node.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer may already be released */
    }
    opts.onEnd?.();
  }

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);
  // Prevent the page from scrolling/zooming while dragging on touch screens.
  el.style.touchAction = 'none';

  return {
    update(newOptions: DragOptions) {
      opts = newOptions;
    },
    destroy() {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    },
  };
};
