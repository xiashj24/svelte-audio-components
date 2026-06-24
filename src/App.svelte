<script lang="ts">
  import './lib/styles/theme.css';
  import { Knob, Slider, Button, Led, Encoder, Display } from './lib/index';
  import { fromNormLog, fromNorm } from './lib/index';
  import { SynthVoice } from './demo/audio';

  const synth = new SynthVoice();

  // Oscillator shapes the Wave encoder scrolls through. The encoder is relative
  // (it emits ticks, not a position), so we keep the selected index ourselves.
  const WAVES = [
    { name: 'Saw', type: 'sawtooth' },
    { name: 'Square', type: 'square' },
    { name: 'Triangle', type: 'triangle' },
    { name: 'Sine', type: 'sine' },
  ] as const;
  const wrapIndex = (i: number, n: number) => ((i % n) + n) % n;

  // Normalized 0..1 widget state. This is the ONLY state the widgets care about.
  let pitch = $state(0.3);
  let cutoff = $state(0.5);
  let resonance = $state(0.2);
  let level = $state(0.7);
  let playing = $state(false);
  let waveIdx = $state(0); // index into WAVES, advanced by the encoder's ticks

  // Push widget values into the audio engine whenever they change.
  $effect(() => synth.setPitch(pitch));
  $effect(() => synth.setCutoff(cutoff));
  $effect(() => synth.setResonance(resonance));
  $effect(() => synth.setLevel(level));
  $effect(() => synth.setWave(WAVES[waveIdx].type));
  $effect(() => void synth.setPlaying(playing));

  // Human-readable readouts — the mapping lives outside the widgets (see scale.ts).
  const pitchHz = $derived(Math.round(fromNormLog(pitch, 55, 880)));
  const cutoffHz = $derived(Math.round(fromNormLog(cutoff, 30, 18000)));
  const resQ = $derived(fromNorm(resonance, 0.5, 18).toFixed(1));
  const levelPct = $derived(Math.round(level * 100));
  const cutoffLabel = $derived(cutoffHz >= 1000 ? `${(cutoffHz / 1000).toFixed(2)}k` : `${cutoffHz}`);
</script>

<main>
  <header>
    <h1>Audio Hardware Widgets</h1>
    <p>
      Every control emits a normalized <code>0..1</code> value; this demo maps those
      to Web Audio parameters. Drag knobs/faders vertically, hold <kbd>Shift</kbd> for
      fine, double-click to reset, scroll to nudge.
    </p>
  </header>

  <div class="device">
    <section class="panel">
      <div class="panel-top">
        <div class="brand">
          <span class="mark">KORG</span>
          <span class="model">monologue&nbsp;proto</span>
        </div>

        <Display
          on={playing}
          width="9.5rem"
          lines={[
            { text: playing ? '▶ RUN' : '■ IDLE', accent: true },
            `WAV ${WAVES[waveIdx].name}`,
            `CUT ${cutoffLabel}Hz`,
            `PCH ${pitchHz}Hz`,
          ]}
        />
      </div>

      <div class="sections">
        <div class="section">
          <div class="sec-label">VCO</div>
          <div class="row">
            <!-- endless encoder: each tick steps the waveform; it wraps around -->
            <Encoder
              label="Wave"
              detents={WAVES.length}
              wrap
              readout={WAVES[waveIdx].name}
              onturn={(d) => (waveIdx = wrapIndex(waveIdx + d, WAVES.length))}
              size={54}
            />
            <Knob bind:value={pitch} defaultValue={0.3} label="Pitch" readout={`${pitchHz} Hz`} size={54} />
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div class="sec-label">Filter</div>
          <div class="row">
            <Knob bind:value={cutoff} defaultValue={0.5} label="Cutoff" readout={`${cutoffHz} Hz`} size={54} />
            <Knob bind:value={resonance} defaultValue={0.2} label="Reso" readout={`Q ${resQ}`} size={54} />
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div class="sec-label">Amp</div>
          <div class="row">
            <Slider bind:value={level} defaultValue={0.7} label="Level" readout={`${levelPct}%`} length={118} />
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div class="sec-label">Transport</div>
          <div class="row transport">
            <Button bind:value={playing} mode="toggle" label={playing ? 'Stop' : 'Play'} led ledColor="var(--led-green)" />
            <Button mode="momentary" label="Tap" led ledColor="var(--led-color)" />
          </div>
        </div>
      </div>
    </section>
  </div>

  <footer>
    <p>
      The <strong>Wave</strong> control is the new endless <strong>Encoder</strong> (it emits
      ticks, not a position); the screen is the new <strong>Display</strong>. Next up: a
      <strong>FlipSwitch</strong> — then the transport layer (Web Serial / Max jweb / WASM).
    </p>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    /* studio backdrop so the silver panel reads as a physical object */
    background:
      radial-gradient(120% 90% at 50% 0%, #26262a, #161618 60%, #0e0e10);
    color: #c8c8cd;
    font-family: 'Inter', system-ui, sans-serif;
    min-height: 100vh;
  }
  main {
    max-width: 760px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem 4rem;
  }
  header h1 {
    font-size: 1.35rem;
    margin: 0 0 0.4rem;
    color: #ededf0;
  }
  header p {
    color: #8a8a90;
    font-size: 0.88rem;
    line-height: 1.55;
    max-width: 60ch;
  }
  code,
  kbd {
    background: #2a2a2e;
    color: #d4d4d8;
    padding: 0.05rem 0.35rem;
    border-radius: 4px;
    font-size: 0.85em;
  }

  /* ---- the device: a brushed-aluminium panel ---- */
  .device {
    margin-top: 1.75rem;
    border-radius: 12px;
    box-shadow:
      0 20px 45px rgba(0, 0, 0, 0.55),
      0 3px 8px rgba(0, 0, 0, 0.4);
  }

  .panel {
    position: relative;
    padding: 1.1rem 1.4rem 1.6rem;
    background: linear-gradient(180deg, var(--panel-hi), var(--panel-mid) 50%, var(--panel-lo));
    border-radius: 12px;
    overflow: hidden;
  }
  /* fine brushed-metal grain */
  .panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.05) 0 1px,
      rgba(0, 0, 0, 0.035) 1px 2px
    );
    opacity: 0.7;
    pointer-events: none;
  }
  /* soft top sheen */
  .panel::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(130% 70% at 50% -15%, rgba(255, 255, 255, 0.4), transparent 55%);
    pointer-events: none;
  }
  .panel > * {
    position: relative;
    z-index: 1;
  }

  .panel-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }
  .brand {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .mark {
    font-weight: 800;
    font-size: 1.85rem;
    letter-spacing: 0.06em;
    line-height: 1;
    color: #1b1c1e;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  .model {
    font-size: 0.6rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--hw-ink-soft);
  }

  /* ---- control sections separated by engraved grooves ---- */
  .sections {
    display: flex;
    align-items: stretch;
    gap: 0.25rem;
    flex-wrap: wrap;
  }
  .section {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 0 0.9rem;
  }
  .sec-label {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--hw-ink-soft);
    text-shadow: 0 1px 0 var(--hw-engrave);
  }
  .row {
    display: flex;
    align-items: flex-end;
    gap: 1.3rem;
    flex: 1;
  }
  .transport {
    flex-direction: column;
    align-items: stretch;
    gap: 0.55rem;
  }
  /* A silk-screened ink rule printed on the panel. The two things that keep
     it from reading as a structural seam: it's fully opaque (ink sits on top
     of the metal grain, it doesn't let the grain show through like a groove),
     and it's inset top/bottom so it floats rather than running edge-to-edge. */
  .divider {
    width: 1px;
    align-self: stretch;
    margin: 1.1rem 0;
    background: var(--hw-print);
  }

  footer {
    margin-top: 2rem;
    color: #75757b;
    font-size: 0.82rem;
  }
  footer strong {
    color: #a6a6ac;
  }
</style>
