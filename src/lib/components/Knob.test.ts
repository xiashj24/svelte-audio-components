import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Knob from './Knob.svelte';

// Note how every query goes through the accessibility tree (getByRole('slider'),
// `name`), never a CSS class. That's only possible because Knob already exposes
// role="slider" + aria-label + aria-valuenow — keep doing that and the widgets
// stay testable for free.

describe('Knob', () => {
  it('renders as a labelled slider showing the current value', () => {
    render(Knob, { props: { value: 0.5, label: 'Cutoff' } });

    const slider = screen.getByRole('slider', { name: 'Cutoff' });
    expect(slider).toBeVisible();
    // value 0.5 -> aria-valuenow 50 (Math.round(value * 100))
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows the formatted readout when provided', () => {
    render(Knob, { props: { value: 0.5, readout: '440 Hz' } });
    expect(screen.getByText('440 Hz')).toBeVisible();
  });

  it('raises the value and fires onchange on ArrowUp', async () => {
    const onchange = vi.fn();
    const user = userEvent.setup();
    render(Knob, { props: { value: 0.5, onchange } });

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowUp}'); // default step is 0.02

    expect(slider).toHaveAttribute('aria-valuenow', '52');
    // float arithmetic — assert "close to" rather than exact equality
    expect(onchange).toHaveBeenCalledWith(expect.closeTo(0.52));
  });

  it('jumps to 0 on Home and to max on End', async () => {
    const user = userEvent.setup();
    render(Knob, { props: { value: 0.5 } });

    const slider = screen.getByRole('slider');
    slider.focus();

    await user.keyboard('{Home}');
    expect(slider).toHaveAttribute('aria-valuenow', '0');

    await user.keyboard('{End}');
    expect(slider).toHaveAttribute('aria-valuenow', '100');
  });

  it('ignores input and never fires onchange when disabled', async () => {
    const onchange = vi.fn();
    const user = userEvent.setup();
    render(Knob, { props: { value: 0.5, disabled: true, onchange } });

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowUp}');

    expect(onchange).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });
});
