// Public surface of the component library.
// This is what other Svelte apps will import. When we later add the
// custom-elements build (for plain HTML / Max jweb), it will register these
// same components as <hw-knob>, <hw-slider>, etc.

export { default as Knob } from './components/Knob.svelte';
export { default as Slider } from './components/Slider.svelte';
export { default as Led } from './components/Led.svelte';
export { default as Button } from './components/Button.svelte';
export { default as Encoder } from './components/Encoder.svelte';
export { default as Display } from './components/Display.svelte';

// Shared building blocks, exported so consumers (and your model/transport
// layers) can reuse them.
export { drag, type DragOptions } from './actions/drag';
export * from './util/scale';
