<script lang="ts">
  import { drag } from '../actions/drag';
  import { clamp } from '../util/scale';

  /**
   * A fader / slider. Value is normalized 0..1 (0 = bottom/left, 1 = top/right).
   * Same interaction model as the Knob: drag, Shift = fine, double-click = reset,
   * wheel = step.
   */
  let {
    value = $bindable(0),
    defaultValue = 0,
    label = '',
    readout = '',
    orientation = 'vertical',
    length = 150, // px along the travel axis
    disabled = false,
    onchange,
  }: {
    value?: number;
    defaultValue?: number;
    label?: string;
    readout?: string;
    orientation?: 'vertical' | 'horizontal';
    length?: number;
    disabled?: boolean;
    onchange?: (value: number) => void;
  } = $props();

  const vertical = $derived(orientation === 'vertical');

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

  // Thumb position as a percentage along the track.
  const pct = $derived(value * 100);
</script>

<div
  class="slider"
  class:vertical
  class:horizontal={!vertical}
  class:disabled
  style="--length: {length}px"
  title={label}
>
  {#if label}<div class="label">{label}</div>{/if}

  <div
    class="track"
    role="slider"
    tabindex={disabled ? -1 : 0}
    aria-label={label}
    aria-orientation={orientation}
    aria-valuenow={Math.round(value * 100)}
    aria-valuemin="0"
    aria-valuemax="100"
    use:drag={{ onDelta: (d) => set(value + d), axis: vertical ? 'y' : 'x' }}
    ondblclick={() => set(defaultValue)}
    onwheel={onWheel}
    onkeydown={onKey}
  >
    <div class="thumb" style={vertical ? `bottom: ${pct}%` : `left: ${pct}%`}></div>
  </div>

  {#if readout}<div class="readout">{readout}</div>{/if}
</div>

<style>
  .slider {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    user-select: none;
    font-family: var(--hw-font, system-ui, sans-serif);
    color: var(--hw-ink, #303134);
  }
  .slider.vertical {
    flex-direction: column;
  }

  /* recessed channel routed into the panel */
  .track {
    position: relative;
    background: linear-gradient(90deg, #1c1d20, var(--slot-bg, #2a2b2e), #1c1d20);
    border-radius: 7px;
    box-shadow:
      inset 0 0 4px rgba(0, 0, 0, 0.7),
      0 1px 0 rgba(255, 255, 255, 0.6);
    cursor: grab;
  }
  .track:active {
    cursor: grabbing;
  }
  .vertical .track {
    width: 14px;
    height: var(--length);
    background: linear-gradient(180deg, #1c1d20, var(--slot-bg, #2a2b2e), #1c1d20);
  }
  .horizontal .track {
    width: var(--length);
    height: 14px;
  }
  .track:focus-visible {
    outline: 2px solid var(--hw-accent, #ff7a1f);
    outline-offset: 3px;
  }
  .disabled .track {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* metal fader cap with a centre grip line */
  .thumb {
    position: absolute;
    background: linear-gradient(180deg, var(--cap-hi, #5a5c61), var(--cap-lo, #2a2b2e));
    border: 1px solid #050506;
    border-radius: 4px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      0 2px 4px rgba(0, 0, 0, 0.55);
  }
  .thumb::after {
    /* white centre indicator, matching the knob's pointer */
    content: '';
    position: absolute;
    border-radius: 1px;
    background: var(--knob-pointer, #f4f4f5);
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.55);
  }
  .vertical .thumb {
    left: -6px;
    right: -6px;
    height: 18px;
    transform: translateY(50%);
  }
  .vertical .thumb::after {
    left: 15%;
    right: 15%;
    top: 50%;
    height: 2px;
    transform: translateY(-50%);
  }
  .horizontal .thumb {
    top: -6px;
    bottom: -6px;
    width: 18px;
    transform: translateX(-50%);
  }
  .horizontal .thumb::after {
    top: 15%;
    bottom: 15%;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
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
