<script lang="ts">
  import { drag } from '../actions/drag';
  import { clamp } from '../util/scale';

  /**
   * An ENDLESS rotary encoder — relative, *not* a knob.
   *
   * Unlike Knob, this has no absolute position and no end-stops: the cap spins
   * forever and reports motion as *detents* (clicks). The honest, primary
   * output is:
   *
   *     onturn(detents)   // signed: +N clockwise, -N counter-clockwise
   *
   * Accumulate those however your model wants — a wrapping menu index, ±semitones,
   * a free-running counter. That's the genuinely different contract the Knob's
   * docs allude to.
   *
   * As a convenience (so it still fits the "everything is 0..1" rule) it also
   * carries a bindable normalized `value`, advanced by `step` per detent and
   * either clamped to 0..1 or `wrap`-ed. If you only want the ticks, ignore it.
   */
  let {
    value = $bindable(0), // optional normalized 0..1 accumulator (advances per detent)
    detents = 24, // clicks per full turn — sets the feel and the rim tick count
    step = undefined, // value change per detent; defaults to one full turn = 0..1
    wrap = false, // bound value wraps 1->0 instead of clamping at the ends
    label = '',
    readout = '', // optional formatted text under it, supplied by the consumer
    size = 56, // diameter in px
    disabled = false,
    onturn, // raw relative output: signed detent count (THE encoder contract)
    onchange, // fires when the bound `value` changes
  }: {
    value?: number;
    detents?: number;
    step?: number;
    wrap?: boolean;
    label?: string;
    readout?: string;
    size?: number;
    disabled?: boolean;
    onturn?: (detents: number) => void;
    onchange?: (value: number) => void;
  } = $props();

  const PIXELS_PER_DETENT = 14; // drag travel for one click (Shift = finer, via the drag action)

  const stepSize = $derived(step ?? 1 / detents); // one full turn sweeps 0..1 by default
  const stepAngle = $derived(360 / detents); // how far the cap rotates per click

  let spin = $state(0); // accumulated visual rotation in deg — purely cosmetic, never an end-stop
  let accum = 0; // sub-detent drag remainder, carried between pointermove events

  function turn(clicks: number) {
    if (disabled || clicks === 0) return;
    spin += clicks * stepAngle; // the cap just keeps rotating; there is no min/max angle
    onturn?.(clicks);
    // Convenience accumulator. Harmless if nobody binds `value`.
    let next = value + clicks * stepSize;
    next = wrap ? ((next % 1) + 1) % 1 : clamp(next);
    if (next !== value) {
      value = next;
      onchange?.(value);
    }
  }

  function onDelta(d: number) {
    if (disabled) return;
    // `d` is already in detent units because we set pixelsForFullRange = PIXELS_PER_DETENT.
    accum += d;
    const clicks = Math.trunc(accum);
    if (clicks !== 0) {
      accum -= clicks;
      turn(clicks);
    }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    turn(e.deltaY < 0 ? 1 : -1);
  }

  function onKey(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        turn(1);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        turn(-1);
        break;
      case 'PageUp':
        turn(4);
        break;
      case 'PageDown':
        turn(-4);
        break;
      default:
        return; // let other keys through (no Home/End — there is no "home" on an endless control)
    }
    e.preventDefault();
  }
</script>

<div class="encoder" class:disabled style="--size: {size}px; --tick: {stepAngle}deg" title={label}>
  <div
    class="enc-wrap"
    role="slider"
    tabindex={disabled ? -1 : 0}
    aria-label={label}
    aria-valuenow={Math.round(value * 100)}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuetext={readout || undefined}
    use:drag={{ onDelta, onStart: () => (accum = 0), pixelsForFullRange: PIXELS_PER_DETENT }}
    onwheel={onWheel}
    onkeydown={onKey}
  >
    <!-- engraved detent ticks, fixed on the panel so you can read the rotation against them -->
    <span class="ticks"></span>
    <!-- black cap (same family as the Knob), but with a knurled grip that spins endlessly -->
    <span class="cap">
      <span class="spin" style="transform: rotate({spin}deg)">
        <span class="knurl"></span>
        <span class="notch"></span>
      </span>
    </span>
  </div>

  {#if label}<div class="label">{label}</div>{/if}
  {#if readout}<div class="readout">{readout}</div>{/if}
</div>

<style>
  .encoder {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    user-select: none;
    font-family: var(--hw-font, system-ui, sans-serif);
    color: var(--hw-ink, #303134);
  }

  .enc-wrap {
    position: relative;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    cursor: grab;
  }
  .enc-wrap:active {
    cursor: grabbing;
  }
  .enc-wrap:focus-visible {
    outline: 2px solid var(--hw-accent, #ff7a1f);
    outline-offset: 3px;
  }
  .disabled .enc-wrap {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* detent ticks cut into the panel around the cap; fixed reference for the spin */
  .ticks {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: repeating-conic-gradient(
      from calc(var(--tick) / -2),
      rgba(0, 0, 0, 0.42) 0 1.1deg,
      transparent 1.1deg var(--tick)
    );
    -webkit-mask: radial-gradient(circle, transparent 60%, #000 64%);
    mask: radial-gradient(circle, transparent 60%, #000 64%);
  }

  /* black cap, lit from above, sitting on the panel — matches the Knob body */
  .cap {
    position: absolute;
    inset: 7%;
    border-radius: 50%;
    background: radial-gradient(
      circle at 50% 30%,
      var(--knob-hi, #4c4d51),
      var(--knob-mid, #292a2d) 52%,
      var(--knob-base, #121214) 100%
    );
    border: 1px solid var(--knob-edge, #050506);
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.5),
      inset 0 1px 1px rgba(255, 255, 255, 0.22),
      inset 0 -4px 7px rgba(0, 0, 0, 0.55);
  }

  /* layer that actually rotates — carries the knurl and the indicator notch */
  .spin {
    position: absolute;
    inset: 0;
    transform-origin: 50% 50%;
    transition: transform 60ms ease-out; /* each click rotates snappily, monotonically */
  }

  /* fine knurled grip around the cap edge — this is what reads as "endless" while turning */
  .knurl {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: repeating-conic-gradient(
      from 0deg,
      rgba(255, 255, 255, 0.13) 0 1.4deg,
      rgba(0, 0, 0, 0.3) 1.4deg 2.8deg
    );
    -webkit-mask: radial-gradient(circle, transparent 62%, #000 66%, #000 92%, transparent 97%);
    mask: radial-gradient(circle, transparent 62%, #000 66%, #000 92%, transparent 97%);
    opacity: 0.8;
  }
  /* a single light indicator dimple so the rotation is legible at a glance */
  .notch {
    position: absolute;
    top: 11%;
    left: 50%;
    width: 3px;
    height: 16%;
    transform: translateX(-50%);
    border-radius: 2px;
    background: var(--knob-pointer, #f4f4f5);
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
    opacity: 0.85;
  }

  .label {
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--hw-ink, #303134);
    text-shadow: 0 1px 0 var(--hw-engrave, rgba(255, 255, 255, 0.55));
  }
  .readout {
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
    color: var(--hw-ink-soft, #5d5f63);
  }
</style>
