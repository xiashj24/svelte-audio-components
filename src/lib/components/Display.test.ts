import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Display from './Display.svelte';

// Display is output-only and intentionally has no ARIA role (it's decorative
// screen text), so we query its content with getByText and assert structural
// state (powered / scanlines / accent line) through the classes it renders.
//
// The `children` snippet form isn't exercised here — passing a Svelte 5 snippet
// from a plain .ts test needs a wrapper component; that's better suited to a
// future browser-mode test.

describe('Display', () => {
  it('renders each line of text', () => {
    render(Display, { props: { lines: ['CUTOFF', '1.2 kHz'] } });
    expect(screen.getByText('CUTOFF')).toBeVisible();
    expect(screen.getByText('1.2 kHz')).toBeVisible();
  });

  it('accepts the { text, accent } object form and highlights accent lines', () => {
    render(Display, { props: { lines: [{ text: 'REC', accent: true }, 'idle'] } });
    expect(screen.getByText('REC')).toHaveClass('accent');
    expect(screen.getByText('idle')).not.toHaveClass('accent');
  });

  it('renders an optional label', () => {
    render(Display, { props: { lines: ['x'], label: 'OSC 1' } });
    expect(screen.getByText('OSC 1')).toBeVisible();
  });

  it('is idle (not powered) by default and lights up when on', async () => {
    // rerender updates the props of the already-mounted component — the standard
    // way to test how a component reacts to a prop change.
    const { container, rerender } = render(Display, { props: { lines: ['x'] } });
    expect(container.querySelector('.screen')).not.toHaveClass('on');

    await rerender({ lines: ['x'], on: true });
    expect(container.querySelector('.screen')).toHaveClass('on');
  });

  it('shows scanlines by default and can switch them off', () => {
    const { container } = render(Display, { props: { lines: ['x'], scanlines: false } });
    expect(container.querySelector('.screen')).not.toHaveClass('scanlines');
  });
});
