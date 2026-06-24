<script lang="ts">
  import Led from './Led.svelte';

  /**
   * A panel button. Two behaviours, matching real hardware:
   *  - mode="momentary": `value` is true only while held (a trigger / gate).
   *  - mode="toggle":    each press flips `value` (latching switch).
   *
   * Set `led` to show an integrated indicator that lights with `value`
   * (or pass `lit` to drive the LED independently of the pressed state).
   */
  let {
    value = $bindable(false),
    mode = 'toggle',
    label = '',
    led = false,
    ledColor = 'var(--led-color, #ff5a2a)',
    lit = undefined, // optional explicit LED state; defaults to `value`
    disabled = false,
    onchange,
    onpress,
    onrelease,
  }: {
    value?: boolean;
    mode?: 'momentary' | 'toggle';
    label?: string;
    led?: boolean;
    ledColor?: string;
    lit?: boolean;
    disabled?: boolean;
    onchange?: (value: boolean) => void;
    onpress?: () => void;
    onrelease?: () => void;
  } = $props();

  const ledOn = $derived(lit ?? value);

  function press() {
    if (disabled) return;
    onpress?.();
    if (mode === 'toggle') {
      value = !value;
      onchange?.(value);
    } else {
      value = true;
      onchange?.(value);
    }
  }

  function release() {
    if (disabled) return;
    onrelease?.();
    if (mode === 'momentary') {
      value = false;
      onchange?.(value);
    }
  }
</script>

<button
  type="button"
  class="hw-button"
  class:active={value}
  {disabled}
  aria-pressed={mode === 'toggle' ? value : undefined}
  onpointerdown={press}
  onpointerup={release}
  onpointerleave={release}
>
  {#if led}<Led on={ledOn} color={ledColor} size={9} />{/if}
  <span class="label">{label}</span>
</button>

<style>
  .hw-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.85rem;
    min-width: 3.2rem;
    justify-content: center;
    font-family: var(--hw-font, system-ui, sans-serif);
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #e9e9ec;
    /* physical cap: lit from above, dark edge */
    background: linear-gradient(180deg, var(--btn-hi, #3c3d41), var(--btn-mid, #25262a) 55%, var(--btn-lo, #16171a));
    border: 1px solid #050506;
    border-radius: 7px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.16),
      inset 0 -2px 4px rgba(0, 0, 0, 0.5),
      0 3px 4px rgba(0, 0, 0, 0.4),
      0 1px 0 rgba(255, 255, 255, 0.4); /* highlight where cap meets panel */
    cursor: pointer;
    user-select: none;
    transition:
      transform 50ms ease,
      box-shadow 50ms ease,
      background 90ms ease;
  }
  .hw-button.active {
    background: linear-gradient(180deg, #45464b, #2c2d31 55%, #1a1b1e);
  }
  /* pressed: cap sinks into the panel */
  .hw-button:active {
    transform: translateY(2px);
    box-shadow:
      inset 0 2px 5px rgba(0, 0, 0, 0.6),
      0 1px 1px rgba(0, 0, 0, 0.3);
  }
  .hw-button:focus-visible {
    outline: 2px solid var(--hw-accent, #ff7a1f);
    outline-offset: 2px;
  }
  .hw-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .label {
    line-height: 1;
  }
</style>
