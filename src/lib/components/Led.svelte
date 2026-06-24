<script lang="ts">
  import { clamp } from '../util/scale';

  /**
   * A display-only indicator LED. No interaction — it reflects state.
   * Drive it either with a boolean `on`, or with a continuous `intensity` 0..1
   * (useful for level meters, dimming, or PWM-style effects from the board).
   */
  let {
    on = false,
    intensity = undefined,
    color = 'var(--led-color, #ff5a2a)',
    size = 14,
  }: {
    on?: boolean;
    intensity?: number; // overrides `on` when provided
    color?: string;
    size?: number;
  } = $props();

  // intensity wins if given; otherwise on -> 1, off -> 0.
  const level = $derived(clamp(intensity ?? (on ? 1 : 0)));
</script>

<span
  class="led"
  class:lit={level > 0.02}
  style="
    --led: {color};
    --size: {size}px;
    --level: {level};
  "
  role="img"
  aria-label={level > 0 ? 'on' : 'off'}
></span>

<style>
  /* A small lens seated in a dark bezel. When unlit it's a dim, dark dot;
     when lit it has a hot near-white core, a coloured body, and a soft bloom. */
  .led {
    position: relative;
    display: inline-block;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    /* dark bezel ring + tinted-off body */
    background:
      radial-gradient(
        circle at 50% 35%,
        color-mix(in srgb, #fff calc(75% * var(--level)), var(--led)),
        var(--led) 55%,
        color-mix(in srgb, var(--led) 55%, #000) 100%
      );
    box-shadow:
      /* outer bezel */
      0 0 0 1px rgba(0, 0, 0, 0.55),
      inset 0 0 2px rgba(0, 0, 0, 0.6),
      /* bloom — grows with level */
      0 0 calc(3px + 10px * var(--level)) color-mix(in srgb, var(--led) 80%, transparent),
      0 0 calc(1px + 4px * var(--level)) color-mix(in srgb, var(--led) 90%, transparent);
    opacity: calc(0.42 + 0.58 * var(--level));
    transition:
      opacity 90ms linear,
      box-shadow 90ms linear,
      background 90ms linear;
  }
  /* specular highlight (the shiny dome) */
  .led::after {
    content: '';
    position: absolute;
    top: 14%;
    left: 24%;
    width: 38%;
    height: 30%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.85), transparent 70%);
    opacity: calc(0.35 + 0.5 * var(--level));
  }
</style>
