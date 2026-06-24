import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Encoder from './Encoder.svelte';

// The Encoder is endless/relative, so its PRIMARY contract is onturn(detents) —
// a signed click count — not an absolute value. These tests lead with onturn and
// treat the convenience `value` accumulator as secondary. With the default 24
// detents, one detent advances value by 1/24 ≈ 0.0417 (aria-valuenow 4).

describe('Encoder', () => {
  it('renders as a labelled slider', () => {
    render(Encoder, { props: { label: 'Program' } });
    expect(screen.getByRole('slider', { name: 'Program' })).toBeVisible();
  });

  it('exposes the readout as aria-valuetext', () => {
    render(Encoder, { props: { readout: 'PRG 12' } });
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'PRG 12');
  });

  it('emits +1 detent on ArrowUp and advances the value', async () => {
    const onturn = vi.fn();
    const onchange = vi.fn();
    const user = userEvent.setup();
    render(Encoder, { props: { value: 0, onturn, onchange } });

    const enc = screen.getByRole('slider');
    enc.focus();
    await user.keyboard('{ArrowUp}');

    expect(onturn).toHaveBeenCalledWith(1);
    expect(onchange).toHaveBeenCalledWith(expect.closeTo(1 / 24));
    expect(enc).toHaveAttribute('aria-valuenow', '4');
  });

  it('emits -1 detent on ArrowDown', async () => {
    const onturn = vi.fn();
    const user = userEvent.setup();
    render(Encoder, { props: { value: 0.5, onturn } });

    const enc = screen.getByRole('slider');
    enc.focus();
    await user.keyboard('{ArrowDown}');

    expect(onturn).toHaveBeenCalledWith(-1);
  });

  it('jumps 4 detents on PageUp', async () => {
    const onturn = vi.fn();
    const user = userEvent.setup();
    render(Encoder, { props: { onturn } });

    const enc = screen.getByRole('slider');
    enc.focus();
    await user.keyboard('{PageUp}');

    expect(onturn).toHaveBeenCalledWith(4);
  });

  it('keeps emitting detents past the value ceiling without changing a clamped value', async () => {
    // The whole point of an endless control: it still reports ticks at the top,
    // even though the convenience value can't go above 1.
    const onturn = vi.fn();
    const onchange = vi.fn();
    const user = userEvent.setup();
    render(Encoder, { props: { value: 1, onturn, onchange } });

    const enc = screen.getByRole('slider');
    enc.focus();
    await user.keyboard('{ArrowUp}');

    expect(onturn).toHaveBeenCalledWith(1); // tick still reported
    expect(onchange).not.toHaveBeenCalled(); // but value was already maxed
    expect(enc).toHaveAttribute('aria-valuenow', '100');
  });

  it('wraps the value past the ends when wrap is enabled', async () => {
    const user = userEvent.setup();
    render(Encoder, { props: { value: 0, wrap: true } });

    const enc = screen.getByRole('slider');
    enc.focus();
    await user.keyboard('{ArrowDown}'); // 0 - 1/24 wraps round to ~0.958

    expect(enc).toHaveAttribute('aria-valuenow', '96');
  });

  it('does nothing when disabled', async () => {
    const onturn = vi.fn();
    const user = userEvent.setup();
    render(Encoder, { props: { disabled: true, onturn } });

    const enc = screen.getByRole('slider');
    enc.focus();
    await user.keyboard('{ArrowUp}');

    expect(onturn).not.toHaveBeenCalled();
  });
});
