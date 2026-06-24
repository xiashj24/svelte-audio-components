# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **Svelte 5 component library** for prototyping hardware audio products (knobs, sliders, LEDs, buttons, encoders, displays). Plain Vite + TypeScript — **not** SvelteKit. The components in `src/lib/` are the product; `src/App.svelte` + `src/demo/audio.ts` are a demo gallery that exercises them. Targets both a normal browser and Cycling '74 Max (via `jweb`).

Two companion docs are the source of truth and worth reading before non-trivial work:
- **README.md** — usage, component conventions, roadmap.
- **DESIGN.md** — the *rationale* record: visual language (skeuomorphic Korg Minilogue), theming model, per-component contracts, and a list of things deliberately removed that must **not** be re-added. Note its own rule: when DESIGN.md and the code disagree, the code wins and the doc is stale.

## Commands

```bash
npm run dev          # demo gallery at http://localhost:5173 (wired to Web Audio)
npm run build        # production build into dist/
npm run check        # svelte-check — type + a11y. Aim for 0 errors, 0 warnings.

npm test             # all tests (both projects below)
npm run test:unit    # jsdom project only (fast)
npm run test:browser # real-Chromium project only
npm run test:watch   # watch mode

npx vitest run src/lib/util/scale.test.ts   # a single file
npx vitest run -t "ArrowUp"                  # tests matching a name
```

`npm run check` prints harmless `ERR_MODULE_NOT_FOUND` stderr from `svelte-check` walking the `Svelte-with-Test-Driven-Development` submodule's uninstalled SvelteKit configs. It exits 0 — ignore it.

## The central architectural rule

**Widgets are normalized and transport-agnostic.** Every control's `value` is a plain `0..1` number (or boolean for Button). A widget must not know:
- what unit it represents (Hz, dB, %) — unit mapping lives in `src/lib/util/scale.ts` (`fromNorm`/`toNorm` linear, `fromNormLog`/`toNormLog` for frequency/pitch),
- where its value goes (speakers, serial port, Max outlet) — that's a future transport layer.

This is what lets one Knob drive Web Audio today, a hardware board over Web Serial later, and a Max patch after that, unchanged. The taper logic in `scale.ts` is meant to eventually be owned by the real C++/WASM parameter model. **Do not push units or destinations into components.**

Other structural facts that span files:
- **`src/lib/actions/drag.ts`** is the one shared pointer-interaction (used by Knob, Slider, Encoder). It reports *normalized deltas* (fraction of range, default 200px = full 0..1), never pixels — so widgets carry no pointer-event boilerplate.
- **Theming** is entirely CSS custom properties in `src/lib/styles/theme.css`; the "material" (gradients/shadows/glow) lives in each component's scoped `<style>`. Reskin by overriding tokens on a parent, never by editing components.
- **Two widgets break the "value is a position" contract on purpose:** `Encoder` is endless/relative — its real output is `onturn(detents)` (signed), with a convenience `bind:value` accumulator; `Display` and `Led` are output-only (no value). See DESIGN.md §6.
- **`src/lib/index.ts`** is the public API surface. A custom-elements build (`<hw-knob>` etc., for plain HTML / Max `jweb`) is planned to register these same components — keep components framework-agnostic enough for that.

## Testing setup (Vitest 4, two projects)

`vite.config.ts` defines `test.projects` — both share the one config:
- **`unit`** — jsdom + `@testing-library/svelte`. Files: `*.test.ts`. For logic, props, ARIA, keyboard. Query via the accessibility tree (`getByRole('slider', { name })`); test callbacks by passing a `vi.fn()` prop. Render form: `render(Component, { props: {...} })`.
- **`browser`** — real headless Chromium (Playwright) + `vitest-browser-svelte`. Files: `*.browser.test.ts`. For things jsdom can't do: real `PointerEvent`/`setPointerCapture`/layout — i.e. the drag gesture.

Non-obvious gotchas (already solved — preserve them):
- The browser project **requires `resolve: { conditions: ['browser'] }`**. Without it Svelte loads its server build and `mount()` throws `lifecycle_function_unavailable`. (`svelteTesting()`'s resolveBrowser only helps when a `node` condition already exists — true in jsdom, false in browser mode.)
- Vitest 4 provider API: `provider: playwright()` from `@vitest/browser-playwright`. Browser test files need `/// <reference types="@vitest/browser/context" />` for `expect.element` to type-check under `svelte-check`.
- `vitest-browser-svelte`'s `render` takes props **directly** (`render(Knob, { value })`), not wrapped in `{ props }`. Use retry-able `expect.element(locator).toHaveAttribute(...)` after interactions (Svelte updates the DOM async); get a raw node from a locator with `.element()`.
- Drag tests stub `setPointerCapture`/`releasePointerCapture` — synthetically dispatched pointers aren't "active", so the real call throws.

## Note on the submodule

`Svelte-with-Test-Driven-Development/` is a git submodule of external book example code (Daniel Irvine's book, **Svelte 3 + JavaScript + SvelteKit**). It is reference material, not part of this project — don't treat its patterns/versions as current, and don't edit it.
