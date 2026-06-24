# Design decisions

Why the widgets look and behave the way they do. This is the *rationale* record —
`README.md` covers usage and how to run; `src/lib/styles/theme.css` is the source
of truth for exact token values. When a decision here and the code disagree, the
code wins and this file is stale — fix it.

---

## 1. North star: restrained skeuomorphism (Korg Minilogue)

The look-and-feel target is a **Korg Minilogue / monologue**: material realism —
brushed-aluminium panel, black top-lit knobs with a single white indicator line,
amber indicator LEDs, a glowing OLED, engraved dark labels — balanced with clean
modern typography.

**The rule is "don't overdo it."** No cartoonish bevels, no software-y affordances
a real panel wouldn't have. When in doubt, do what the physical object does and
nothing more. These widgets are used for stakeholder product demos, so *perceived
quality* is a feature, not polish.

## 2. The one architectural rule: normalized & transport-agnostic

Every control's value is a plain **normalized `0..1`** number (or a boolean for
Button). A widget does **not** know:

- what unit it represents (Hz, dB, %) — that mapping lives in `src/lib/util/scale.ts`,
- where its value goes (speakers, a serial port, a Max outlet) — that's the
  *transport layer* (not built yet).

**Why:** this is what lets the same Knob drive a Web Audio filter today, a hardware
board over Web Serial tomorrow, and a Max patch after that, with no change to the
widget. The taper logic (log/linear) is shared with — and will eventually be owned
by — the real C++/WASM parameter model. **Do not break this**: keep units and
destinations out of the components.

## 3. Theming model: tokens carry colour, components carry material

All colours are **CSS custom properties** in `theme.css` (`--panel-*`, `--knob-*`,
`--hw-accent`, `--led-*`, `--display-*`, …). The "material" — gradients, bevels,
shadows, glow — lives in each component's scoped `<style>`. Tokens only set the
colours that feed it.

**Reskin by overriding tokens on a parent element, not by editing components.**
Override any token to make a different-looking product from the same code.

Knob/Encoder shading technique: the **light source is fixed** (the body gradient
never moves); only a thin inner indicator layer rotates. This keeps the highlight
physically consistent as the control turns.

## 4. Visual language

### Panel
Brushed aluminium: a vertical light→dark gradient, a fine repeating-linear grain
overlay, and a soft top sheen. The panel is a physical object lit from above.

### Knobs and the Encoder cap
Black caps lit from above, sitting **directly on the panel** with just a drop
shadow (no recessed "well" ring). A single white pointer/indicator — nothing else.

### Engraved text vs. silk-screened ink — a deliberate distinction
The panel carries two kinds of marking, and they are rendered differently on purpose:

- **Engraved text** (`--hw-ink`, labels): dark fill **plus a raised light edge**
  below it (`text-shadow: 0 1px 0 var(--hw-engrave)`), as if cut into the metal and
  catching light on the lower lip.
- **Silk-screened ink** (`--hw-print`, the section separator rules): **flat, fully
  opaque** colour sitting *on top of* the surface. No bevel, no highlight.

**Section separators are printed ink, not a structural seam.** Two things make a
line read as a physical seam instead of printed ink, and both are bugs to avoid:

1. *Translucency.* A semi-transparent dark line lets the metal grain show through,
   so its tone shimmers along its length exactly like the inside of a cut groove.
   Printed ink is opaque and sits on top — use a solid `--hw-print` fill.
2. *Running edge-to-edge.* A full-height line butting the panel's interior edges
   reads as a structural joint. A printed rule floats — inset it (vertical margin)
   so there's clearly panel above and below.

Keep separator rules **crisp at `1px`**. `1.5px` antialiases to a grey smudge at
1× DPR, which pulls it right back toward looking like a seam.

### LEDs
A small lens in a dark bezel: dim/tinted when off, hot near-white core with a
coloured body and a soft bloom when lit. Driven by a boolean `on` or a continuous
`intensity` 0..1.

### Display (OLED-style)
A dark recessed window, glass-flush with the panel (inset shadow + a 1px highlight
where glass meets metal), monospace phosphor text, faint scanlines. **Lit vs. idle**
is one `on` flag; the dim idle colour is *derived* from the lit colour via
`color-mix`, so overriding `--display-on` is enough to retheme both states.

### Deliberately omitted — do NOT re-add
The user removed these in favour of authenticity over software affordances:

- the knob **value-arc** (knobs show only the pointer line, like a real pot),
- the knob's recessed **outer ring / "well"** (the cap sits on the panel),
- the slider's amber **value-fill** (cap position alone shows the value),
- the **wood end-cheeks** (removed; the `--wood-*` tokens are gone too),
- `ns-resize` / `ew-resize` hover cursors — use **`grab` / `grabbing`**.

Demo knob/encoder size is **54px** (the 76px default read too big next to the
fader and buttons).

## 5. Interaction model

Shared across the draggable controls (Knob, Slider, Encoder) via `actions/drag.ts`:

- **Drag** anywhere on the control — vertical, up = increase.
- **Shift** = fine adjustment.
- **Double-click** = reset to `defaultValue` (Knob/Slider).
- **Wheel** = nudge; **arrow keys** when focused.
- Cursor is `grab` / `grabbing`, never resize cursors.

`drag` reports **normalized deltas** (a fraction of the 0..1 range, default 200px =
full range), not pixels — so widgets stay free of pointer-event boilerplate and the
interaction logic lives in one place.

## 6. Component contracts (and the two exceptions)

Most widgets bind a `value` that represents an absolute *position*. Two break that
on purpose:

- **Encoder — endless / relative, *not* a knob.** It has no absolute position and
  no end-stops: the knurled cap spins forever, with detent ticks fixed on the panel
  as a reference. Its primary output is **`onturn(detents)`** (signed: +clockwise /
  −counter-clockwise) — you accumulate that into whatever your model needs (a
  wrapping index, ±semitones…). It *also* offers a convenience `bind:value` 0..1
  accumulator (`step` per detent, `wrap` to loop) so it still fits the normalized
  rule when wanted.
  - *Decision:* `value` defaults to `0` (always a number), **not** `undefined`. This
    keeps `role="slider"` accessibility clean (`aria-valuenow` always present,
    `aria-valuetext` carries the readout) at the cost of a harmless internal
    accumulator that runs even when you only read `onturn`. The purer
    `undefined`-for-relative-only alternative tripped the slider-role a11y lint.

- **Display — output-only, like Led.** No value, no interaction; it reflects state.
  Feed it `lines` (`string` or `{ text, accent }`) or a snippet, and toggle `on`.

## 7. Verifying visuals

Type/a11y + build must stay clean:

```bash
npm run check    # svelte-check — aim for 0 errors, 0 warnings
npm run build
```

Eyeball the real thing — material decisions can't be verified from code alone:

```bash
npm run dev      # http://localhost:5173
```

For an unattended check, headless-screenshot the gallery with Chrome
(`--headless=new --screenshot http://localhost:5173`).
