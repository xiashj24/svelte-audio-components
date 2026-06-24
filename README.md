# svelte-audio-components

A Svelte 5 component library for prototyping hardware audio products — knobs,
sliders, LEDs, buttons, encoders, displays, and (soon) flip switches. Built to
run in a normal browser **and** inside Cycling '74 Max (via `jweb`), and to
last and evolve over time.

## Run the demo gallery

```bash
npm install
npm run dev      # http://localhost:5173  — the live gallery, wired to Web Audio
npm run check    # type + a11y check (svelte-check)
npm run build    # production build into dist/
```

## The one rule that keeps this maintainable

**Widgets are normalized and transport-agnostic.** Every control's value is a
plain `0..1` number. A widget does not know:

- what unit it represents (Hz, dB, %) — that mapping lives in `src/lib/util/scale.ts`,
- where its value goes (speakers, a serial port, a Max outlet) — that's the
  *transport layer* (not built yet).

This separation is why the same Knob can drive a Web Audio filter today, a real
hardware board over Web Serial tomorrow, and a Max patch after that — with no
changes to the widget.

> See [`DESIGN.md`](./DESIGN.md) for the design decisions and their rationale
> (visual language, theming model, per-component contracts).

## Layout

```
src/
  lib/                     ← the reusable library (this is the product)
    components/            ← Knob, Slider, Led, Button, Encoder, Display (.svelte)
    actions/drag.ts        ← shared pointer-drag interaction (drag, Shift=fine)
    util/scale.ts          ← value <-> unit mapping (linear / logarithmic taper)
    index.ts               ← public exports
  demo/audio.ts            ← tiny Web Audio synth (DEMO ONLY — swap this out later)
  App.svelte               ← the gallery panel
```

## Component conventions

- Value prop is `value` (normalized `0..1`, or boolean for Button), and it's
  `bind:`-able: `<Knob bind:value={cutoff} />`.
- Each emits a callback prop too: `onchange`, plus `onpress`/`onrelease` on Button.
- `defaultValue` sets the double-click reset target.
- Interaction: drag (vertical), **Shift** = fine, **double-click** = reset,
  scroll wheel = nudge, arrow keys when focused.
- Theming is via CSS custom properties: `--hw-accent`, `--knob-body`,
  `--led-color`, `--hw-fg`, etc. Override them on a parent to reskin.

Two widgets are exceptions to the "value is a position" rule, on purpose:

- **Encoder** is *endless / relative*. Its primary output is `onturn(detents)`
  (signed: +clockwise / −counter-clockwise) — accumulate it into whatever your
  model needs (a wrapping index, ±semitones…). It also exposes a convenience
  `bind:value` 0..1 accumulator (`step` per detent, `wrap` to loop) if you want one.
- **Display** is output-only, like **Led** — it has no value. Feed it `lines`
  (`string` or `{ text, accent }`) or a snippet, and toggle `on` for lit vs. idle.

## Roadmap (in rough order)

1. More widgets: **Encoder** (endless / relative — emits ticks, *not* a knob) ✓
   and **Display** (text / OLED) ✓ are done; **FlipSwitch** is next.
2. **Custom-elements build** — compile these same components to `<hw-knob>` etc.
   for plain HTML and Max's `jweb` object (no framework runtime needed there).
3. **Transport layer** behind one interface, with backends:
   - `WebSerialBackend` (real browser → board),
   - `MaxBridgeBackend` (`window.max.outlet` / `bindInlet` → Max `serial` object;
     note: Web Serial is **not** available inside Max's CEF browser),
   - `MockBackend` for design exploration.
4. Optional: drive the panel from your C++ parameter model compiled to **WASM**
   (emscripten) for hardware-accurate demos before a board exists.
