import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Button from './Button.svelte';

// Button is driven by pointer events (pointerdown = press, pointerup = release).
// userEvent.click() fires that full pointerdown→pointerup sequence, so a click is
// one complete press-and-release. For momentary mode we drive press and release
// separately with userEvent.pointer() to observe the "true only while held" state.

describe('Button', () => {
  describe('toggle mode (default)', () => {
    it('renders a button reflecting its pressed state via aria-pressed', () => {
      render(Button, { props: { label: 'Hold' } });
      const button = screen.getByRole('button', { name: 'Hold' });
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('flips value on each click and reports it through onchange', async () => {
      const onchange = vi.fn();
      const user = userEvent.setup();
      render(Button, { props: { label: 'Hold', onchange } });
      const button = screen.getByRole('button');

      await user.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(onchange).toHaveBeenLastCalledWith(true);

      await user.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(onchange).toHaveBeenLastCalledWith(false);
    });
  });

  describe('momentary mode', () => {
    it('is true only while held', async () => {
      const onchange = vi.fn();
      const onpress = vi.fn();
      const onrelease = vi.fn();
      const user = userEvent.setup();
      render(Button, {
        props: { mode: 'momentary', label: 'Trig', onchange, onpress, onrelease },
      });
      const button = screen.getByRole('button');

      await user.pointer({ keys: '[MouseLeft>]', target: button }); // press & hold
      expect(onpress).toHaveBeenCalledOnce();
      expect(onchange).toHaveBeenLastCalledWith(true);

      await user.pointer({ keys: '[/MouseLeft]', target: button }); // release
      expect(onrelease).toHaveBeenCalledOnce();
      expect(onchange).toHaveBeenLastCalledWith(false);
    });

    it('does not expose aria-pressed (it is not a toggle)', () => {
      render(Button, { props: { mode: 'momentary', label: 'Trig' } });
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed');
    });
  });

  it('renders an integrated LED when led is enabled', () => {
    render(Button, { props: { label: 'Run', led: true, value: true } });
    // the nested Led renders role="img"; lit because value is true
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'on');
  });

  it('ignores presses and never fires callbacks when disabled', async () => {
    const onchange = vi.fn();
    const user = userEvent.setup();
    render(Button, { props: { label: 'Hold', disabled: true, onchange } });

    await user.click(screen.getByRole('button'));
    expect(onchange).not.toHaveBeenCalled();
  });
});
