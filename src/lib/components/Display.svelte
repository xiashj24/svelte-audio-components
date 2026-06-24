<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * A small text display (OLED / LCD style). Output-only — like Led, it reflects
   * state and has no interaction, so it has no normalized value.
   *
   * Two ways to fill it:
   *  - `lines`: an array of strings, or `{ text, accent }` to highlight a line
   *    (e.g. a status header) in the accent colour.
   *  - a default snippet (children) for fully custom markup.
   *
   * `on` switches between a bright, glowing "powered" look and a dim idle one.
   * The phosphor `color`, background (`--display-bg`), and `width` are themeable.
   */
  type DisplayLine = string | { text: string; accent?: boolean };

  let {
    lines = [],
    on = false,
    color = 'var(--display-on, #57e6a0)',
    width = '9rem',
    align = 'left',
    scanlines = true,
    label = '',
    children,
  }: {
    lines?: DisplayLine[];
    on?: boolean;
    color?: string;
    width?: number | string;
    align?: 'left' | 'center' | 'right';
    scanlines?: boolean;
    label?: string;
    children?: Snippet;
  } = $props();

  // Normalize the simple string form to the object form so the template is uniform.
  const rows = $derived(
    lines.map((l) => (typeof l === 'string' ? { text: l, accent: false } : { accent: false, ...l }))
  );
  const cssWidth = $derived(typeof width === 'number' ? `${width}px` : width);
</script>

<div class="display" style="--display-fg: {color}; --display-w: {cssWidth}; --display-align: {align}">
  <div class="screen" class:on class:scanlines>
    {#if children}
      {@render children()}
    {:else}
      {#each rows as row}
        <span class="line" class:accent={row.accent}>{row.text}</span>
      {/each}
    {/if}
  </div>
  {#if label}<div class="label">{label}</div>{/if}
</div>

<style>
  .display {
    display: inline-flex;
    flex-direction: column;
    gap: 0.35rem;
    user-select: none;
    font-family: var(--hw-font, system-ui, sans-serif);
  }

  /* the screen: a dark recessed window, glass-flush with the panel */
  .screen {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-width: var(--display-w);
    padding: 0.45rem 0.7rem;
    border-radius: 5px;
    text-align: var(--display-align);
    background: var(--display-bg, #07140f);
    border: 1px solid #000;
    box-shadow:
      inset 0 0 8px rgba(0, 0, 0, 0.9),
      0 1px 0 rgba(255, 255, 255, 0.5); /* highlight where glass meets panel */
    font-family: 'SFMono-Regular', ui-monospace, 'Menlo', monospace;
    font-size: 0.64rem;
    line-height: 1.45;
    /* idle: a dim phosphor, derived from the lit colour so any theme dims sanely */
    color: color-mix(in srgb, var(--display-fg) 46%, #02110b);
  }
  .screen.on {
    color: var(--display-fg);
    text-shadow: 0 0 5px color-mix(in srgb, var(--display-fg) 60%, transparent);
  }

  .line {
    white-space: pre; /* keep alignment of padded/columnar text */
  }
  /* a highlighted line (status/header) — always lit in the accent colour */
  .line.accent {
    color: var(--hw-accent, #ff7a1f);
    text-shadow: 0 0 5px color-mix(in srgb, var(--hw-accent, #ff7a1f) 55%, transparent);
  }

  /* faint horizontal scanlines for screen texture */
  .screen.scanlines::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.18) 0 1px, transparent 1px 3px);
    opacity: 0.5;
  }

  .label {
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: center;
    color: var(--hw-ink, #303134);
    text-shadow: 0 1px 0 var(--hw-engrave, rgba(255, 255, 255, 0.55));
  }
</style>
