export class AudioManager {
  constructor(settings) { this.settings = settings; this.enabled = false; this.context = null; this.music = null; }
  async toggle() {
    if (!this.settings.audioEnabled) return false;
    this.enabled = !this.enabled;
    if (this.enabled) {
      try {
        this.context ||= new (window.AudioContext || window.webkitAudioContext)();
        await this.context.resume();
        if (this.settings.audioUrl) {
          this.music ||= new Audio(this.settings.audioUrl);
          this.music.loop = true; this.music.volume = this.settings.volume;
          await this.music.play();
        }
      } catch { this.enabled = false; }
    } else { this.music?.pause(); }
    return this.enabled;
  }
  rustle() {
    if (!this.enabled || !this.context) return;
    const ctx = this.context, duration = .35;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.sin(i / samples.length * Math.PI);
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = 1100; filter.Q.value = .6;
    gain.gain.value = Math.min(.08, this.settings.volume * .25);
    source.connect(filter).connect(gain).connect(ctx.destination); source.start();
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  updateSettings(settings) {
    if (settings.audioUrl !== this.settings.audioUrl) { this.music?.pause(); this.music = null; this.enabled = false; }
    this.settings = settings;
    if (this.music) this.music.volume = settings.volume;
    if (!settings.audioEnabled) { this.enabled = false; this.music?.pause(); }
  }
  dispose() { this.music?.pause(); this.context?.close(); }
}
