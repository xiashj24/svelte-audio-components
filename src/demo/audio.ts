import { clamp, fromNorm, fromNormLog } from '../lib/index';

/**
 * A minimal subtractive-synth voice built on the Web Audio API, used ONLY by
 * the demo gallery to prove that the widgets emit sensible values.
 *
 * This is deliberately separate from the widgets. The widgets emit normalized
 * 0..1 values; THIS file decides those mean cutoff in Hz, level, etc. When you
 * later swap in a real model (WASM) or talk to hardware (Web Serial / Max),
 * you replace this file — not the widgets.
 *
 * Signal path:  Oscillator -> Lowpass filter -> Amp -> speakers
 */
export class SynthVoice {
  private ctx?: AudioContext;
  private osc?: OscillatorNode;
  private filter?: BiquadFilterNode;
  private amp?: GainNode;

  // Normalized control state, kept even before the audio engine starts.
  // `wave` is the oscillator shape (driven by the endless Wave encoder).
  private s = {
    pitch: 0.3,
    cutoff: 0.5,
    resonance: 0.2,
    level: 0.7,
    playing: false,
    wave: 'sawtooth' as OscillatorType,
  };

  /** Lazily build the audio graph on first play (browsers require a user gesture). */
  private ensure() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.type = this.s.wave;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const amp = ctx.createGain();
    amp.gain.value = 0;
    osc.connect(filter).connect(amp).connect(ctx.destination);
    osc.start();
    this.ctx = ctx;
    this.osc = osc;
    this.filter = filter;
    this.amp = amp;
    this.applyAll();
  }

  private applyAll() {
    this.applyPitch();
    this.applyCutoff();
    this.applyResonance();
    this.applyAmp();
  }

  private ramp(param: AudioParam | undefined, target: number) {
    if (!param || !this.ctx) return;
    // Short smoothing ramp avoids zipper noise / clicks.
    param.setTargetAtTime(target, this.ctx.currentTime, 0.02);
  }

  private applyPitch() {
    this.ramp(this.osc?.frequency, fromNormLog(this.s.pitch, 55, 880)); // A1..A5
  }
  private applyCutoff() {
    this.ramp(this.filter?.frequency, fromNormLog(this.s.cutoff, 30, 18000));
  }
  private applyResonance() {
    this.ramp(this.filter?.Q, fromNorm(this.s.resonance, 0.5, 18));
  }
  private applyAmp() {
    const target = this.s.playing ? fromNorm(this.s.level, 0, 0.8) : 0;
    this.ramp(this.amp?.gain, target);
  }

  // --- public, normalized setters (called from the gallery) ---
  setPitch(n: number) {
    this.s.pitch = clamp(n);
    this.applyPitch();
  }
  setCutoff(n: number) {
    this.s.cutoff = clamp(n);
    this.applyCutoff();
  }
  setResonance(n: number) {
    this.s.resonance = clamp(n);
    this.applyResonance();
  }
  setLevel(n: number) {
    this.s.level = clamp(n);
    this.applyAmp();
  }
  setWave(type: OscillatorType) {
    this.s.wave = type;
    if (this.osc) this.osc.type = type;
  }

  async setPlaying(on: boolean) {
    this.s.playing = on;
    if (on) {
      this.ensure();
      if (this.ctx!.state === 'suspended') await this.ctx!.resume();
    }
    this.applyAmp();
  }
}
