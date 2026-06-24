import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Slider from './Slider.svelte';

// Slider shares Knob's normalized-value + keyboard model, so these mirror the
// Knob tests. The extra thing worth pinning down is `orientation`, which it
// exposes through aria-orientation. Pointer dragging needs real layout, so it's
// left for browser mode.

describe('Slider', () => {
  it('renders a vertical slider by default, showing the current value', () => {
    render(Slider, { props: { value: 0.5, label: 'Level' } });

    const slider = screen.getByRole('slider', { name: 'Level' });
    expect(slider).toBeVisible();
    expect(slider).toHaveAttribute('aria-valuenow', '50');
    expect(slider).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('reports a horizontal orientation when asked', () => {
    render(Slider, { props: { value: 0, orientation: 'horizontal' } });
    expect(screen.getByRole('slider')).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('shows the formatted readout when provided', () => {
    render(Slider, { props: { value: 0.5, readout: '-6 dB' } });
    expect(screen.getByText('-6 dB')).toBeVisible();
  });

  it('raises the value and fires onchange on ArrowUp', async () => {
    const onchange = vi.fn();
    const user = userEvent.setup();
    render(Slider, { props: { value: 0.5, onchange } });

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowUp}'); // default step 0.02

    expect(slider).toHaveAttribute('aria-valuenow', '52');
    expect(onchange).toHaveBeenCalledWith(expect.closeTo(0.52));
  });

  it('lowers the value on ArrowDown', async () => {
    const user = userEvent.setup();
    render(Slider, { props: { value: 0.5 } });

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowDown}');

    expect(slider).toHaveAttribute('aria-valuenow', '48');
  });

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup();
    render(Slider, { props: { value: 0.5 } });

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
    render(Slider, { props: { value: 0.5, disabled: true, onchange } });

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowUp}');

    expect(onchange).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });
});
