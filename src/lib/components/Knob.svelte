<script lang="ts">
  import { drag } from '../actions/drag';
  import { clamp } from '../util/scale';

  /**
   * A rotary knob (absolute / bounded — like a potentiometer).
   *
   * Its value is ALWAYS normalized 0..1. It does not know about Hz, dB, etc.
   * Pass a pre-formatted `readout` string if you want a value shown under it.
   *
   * For an *endless* control that emits +/- ticks (a digital encoder), we'll add
   * a separate Encoder component — that's a genuinely different contract.
   */
  let {
    value = $bindable(0), // normalized 0..1
    defaultValue = 0, // double-click resets here
    label = '',
    readout = '', // optional formatted text, e.g. "440 Hz" — supplied by the consumer
    size = 76, // diameter in px
    disabled = false,
    onchange,
  }: {
    value?: number;
    defaultValue?: number;
    label?: string;
    readout?: string;
    size?: number;
    disabled?: boolean;
    onchange?: (value: number) => void;
  } = $props();

  // 270° sweep, classic knob: value 0 -> -135°, value 1 -> +135°.
  const SWEEP = 270;
  const START = -135;
  const angle = $derived(START + value * SWEEP); // dial rotation in degrees

  function set(next: number) {
    if (disabled) return;
    const clamped = clamp(next);
    if (clamped === value) return;
    value = clamped;
    onchange?.(value);
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const step = e.shiftKey ? 0.005 : 0.02;
    set(value + (e.deltaY < 0 ? step : -step));
  }

  function onKey(e: KeyboardEvent) {
    const step = e.shiftKey ? 0.005 : 0.02;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        set(value + step);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        set(value - step);
        break;
      case 'PageUp':
        set(value + 0.1);
        break;
      case 'PageDown':
        set(value - 0.1);
        break;
      case 'Home':
        set(0);
        break;
      case 'End':
        set(1);
        break;
      default:
        return;
    }
    e.preventDefault();
  }
</script>

<div class="knob" class:disabled style="--size: {size}px" title={label}>
  <div
    class="dial-wrap"
    role="slider"
    tabindex={disabled ? -1 : 0}
    aria-label={label}
    aria-valuenow={Math.round(value * 100)}
    aria-valuemin="0"
    aria-valuemax="100"
    use:drag={{ onDelta: (d) => set(value + d) }}
    ondblclick={() => set(defaultValue)}
    onwheel={onWheel}
    onkeydown={onKey}
  >
    <!-- the physical knob: body shading is fixed; only the indicator rotates -->
    <span class="dial">
      <span class="hand" style="transform: rotate({angle}deg)">
        <span class="indicator"></span>
      </span>
    </span>
  </div>

  {#if label}<div class="label">{label}</div>{/if}
  {#if readout}<div class="readout">{readout}</div>{/if}
</div>

<style>
  .knob {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    user-select: none;
    font-family: var(--hw-font, system-ui, sans-serif);
    color: var(--hw-ink, #303134);
  }

  .dial-wrap {
    position: relative;
    width: var(--size);
    height: var(--size);
    cursor: grab;
    border-radius: 50%;
  }
  .dial-wrap:active {
    cursor: grabbing;
  }
  .dial-wrap:focus-visible {
    outline: 2px solid var(--hw-accent, #ff7a1f);
    outline-offset: 3px;
  }
  .disabled .dial-wrap {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* black knob cap, lit from above, sitting directly on the panel */
  .dial {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background:
      radial-gradient(circle at 50% 30%, var(--knob-hi, #4c4d51), var(--knob-mid, #292a2d) 52%, var(--knob-base, #121214) 100%);
    border: 1px solid var(--knob-edge, #050506);
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.5),
      inset 0 1px 1px rgba(255, 255, 255, 0.22),
      inset 0 -4px 7px rgba(0, 0, 0, 0.55);
  }

  /* rotating layer that carries the indicator */
  .hand {
    position: absolute;
    inset: 0;
    transform-origin: 50% 50%;
  }
  .indicator {
    position: absolute;
    top: 7%;
    left: 50%;
    width: 3px;
    height: 34%;
    transform: translateX(-50%);
    border-radius: 2px;
    background: var(--knob-pointer, #f4f4f5);
    box-shadow:
      0 0 2px rgba(0, 0, 0, 0.5),
      0 0 4px color-mix(in srgb, var(--knob-pointer, #fff) 30%, transparent);
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
