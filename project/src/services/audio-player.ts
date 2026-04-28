import { Store } from './store';
import type { Track } from '../types/app.types';

export class AudioPlayer extends EventTarget {
  private static instance: AudioPlayer;

  private audio = new Audio();
  private store = Store.getInstance();

  private currentTrackId: number | null = null;
  private hasPlayableSource = false;

  private currentSourceDuration = 0;

  private demoSourceUrl: string | null = null;
  private demoSourcePromise: Promise<string> | null = null;

  private readonly demoDurationSeconds = 24;
  private _repeatEnabled = false;

  private lastTrackBlobUrl: string | null = null;

  private constructor() {
    super();
    this.audio.preload = 'metadata';
    this.audio.volume = 1;

    this.audio.addEventListener('loadedmetadata', () => this.handleDurationChange());
    this.audio.addEventListener('durationchange', () => this.handleDurationChange());
    this.audio.addEventListener('timeupdate', () => this.handleTimeUpdate());
    this.audio.addEventListener('ended', () => this.handleEnded());
    this.audio.addEventListener('play', () => this.dispatchPlaybackChange(true));
    this.audio.addEventListener('pause', () => this.dispatchPlaybackChange(false));

    window.addEventListener('beforeunload', () => {
      if (this.demoSourceUrl) {
        URL.revokeObjectURL(this.demoSourceUrl);
      }
      if (this.lastTrackBlobUrl) {
        URL.revokeObjectURL(this.lastTrackBlobUrl);
      }
    });

    void this.ensureDemoSource();
  }

  static getInstance() {
    if (!AudioPlayer.instance) AudioPlayer.instance = new AudioPlayer();
    return AudioPlayer.instance;
  }

  private getDisplayedDuration() {
    if (Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
      return Math.round(this.audio.duration);
    }
    if (this.currentSourceDuration > 0) {
      return this.currentSourceDuration;
    }
    const track = this.store.currentTrack;
    return track ? Math.round(track.duration * 60) : 0;
  }

  private isSupportedSource(source: string) {
    return (
      source.startsWith('blob:') ||
      source.startsWith('data:audio/') ||
      /^https?:\/\//.test(source)
    );
  }

  private async ensureDemoSource() {
    if (this.demoSourceUrl) return this.demoSourceUrl;

    if (!this.demoSourcePromise) {
      this.demoSourcePromise = Promise
        .resolve(this.createDemoAudioUrl(this.demoDurationSeconds))
        .then((url) => {
          this.demoSourceUrl = url;
          return url;
        });
    }

    return this.demoSourcePromise;
  }

  private createDemoAudioUrl(durationSeconds: number) {
    const sampleRate = 44100;
    const channels = 2;
    const bytesPerSample = 2;
    const totalSamples = Math.floor(durationSeconds * sampleRate);
    const dataSize = totalSamples * channels * bytesPerSample;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i++) {
        view.setUint8(offset + i, value.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bytesPerSample, true);
    view.setUint16(32, channels * bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    const tempo = 84;
    const beatLen = 60 / tempo;
    const barLen = beatLen * 4;
    const eighthLen = beatLen / 2;

    const progression = [
      { bass: 130.81, pad: [261.63, 329.63, 392.0, 493.88] },
      { bass: 146.83, pad: [293.66, 369.99, 440.0, 554.37] },
      { bass: 174.61, pad: [349.23, 440.0, 523.25, 659.25] },
      { bass: 164.81, pad: [329.63, 415.3, 493.88, 622.25] }
    ];

    const melody = [
      523.25, 587.33, 659.25, 783.99,
      659.25, 587.33, 523.25, 493.88,
      523.25, 659.25, 783.99, 659.25,
      587.33, 523.25, 493.88, 440.0
    ];

    const pseudoNoise = (n: number) => {
      const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    const envelope = (pos: number, length: number, attack = 0.08, release = 0.12) => {
      const a = Math.max(1 / sampleRate, length * attack);
      const r = Math.max(1 / sampleRate, length * release);
      if (pos < a) return pos / a;
      if (pos > length - r) return Math.max(0, (length - pos) / r);
      return 1;
    };

    let offset = 44;

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const beat = t / beatLen;
      const barIndex = Math.floor(beat / 4);
      const barPos = t % barLen;
      const beatPos = t % beatLen;
      const beatNum = Math.floor(beat) % 4;

      const chord = progression[barIndex % progression.length];
      let sample = 0;

      const padEnv = envelope(barPos, barLen, 0.12, 0.16);
      chord.pad.forEach((freq, idx) => {
        sample += Math.sin(2 * Math.PI * freq * t + idx * 0.35) * (0.07 / (idx + 1));
      });
      sample *= padEnv * 0.95;

      const bassEnv = envelope(beatPos, beatLen, 0.03, 0.18);
      sample += Math.sin(2 * Math.PI * chord.bass * t) * bassEnv * 0.28;

      const melodyIndex = Math.floor(t / eighthLen) % melody.length;
      const notePos = t % eighthLen;
      const noteEnv = envelope(notePos, eighthLen, 0.12, 0.18);
      const leadFreq = melody[melodyIndex];
      sample += Math.sin(2 * Math.PI * leadFreq * t) * noteEnv * 0.10;

      if (beatNum === 0 || beatNum === 2) {
        const kickEnv = Math.exp(-beatPos * 18);
        sample += Math.sin(2 * Math.PI * (55 + 6 * Math.exp(-beatPos * 20)) * t) * kickEnv * 0.24;
      }

      if (beatNum === 1 || beatNum === 3) {
        const snareEnv = Math.exp(-beatPos * 16);
        sample += (pseudoNoise(i) * 2 - 1) * snareEnv * 0.06;
      }

      if (Math.floor(beat * 2) % 2 === 1) {
        const hatPos = t % eighthLen;
        const hatEnv = Math.exp(-hatPos * 40);
        sample += (pseudoNoise(i + 1000) * 2 - 1) * hatEnv * 0.025;
      }

      sample += (pseudoNoise(i + 5000) * 2 - 1) * 0.005;

      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;

      for (let ch = 0; ch < channels; ch++) {
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  private isRandomCandidate(track: Track) {
    return track.id !== this.currentTrackId;
  }

  private getRandomTrack(): Track | null {
    const tracks = this.store.allTracks;
    if (!tracks.length) return null;
    if (tracks.length === 1) return tracks[0];
    const candidates = tracks.filter(t => this.isRandomCandidate(t));
    const pool = candidates.length ? candidates : tracks;
    const index = Math.floor(Math.random() * pool.length);
    return pool[index] ?? null;
  }

  private async resolveSource(track: Track) {
    const blobUrl = track.audioBlobUrl?.trim();
    if (blobUrl && this.isSupportedSource(blobUrl)) {
      this.currentSourceDuration = 0;
      return blobUrl;
    }

    const encoded = track.encoded_audio?.trim();
    if (encoded && this.isSupportedSource(encoded)) {
      this.currentSourceDuration = 0;
      return encoded;
    }

    this.currentSourceDuration = this.demoDurationSeconds;
    return await this.ensureDemoSource();
  }

  private dispatchPlaybackChange(playing: boolean) {
    this.dispatchEvent(new CustomEvent('playbackchange', { detail: { playing } }));
  }

  private handleDurationChange() {
    const duration = this.getDisplayedDuration();
    this.currentSourceDuration = duration;
    this.store.updatePlayback(!this.audio.paused, this.audio.currentTime, duration);
    this.dispatchEvent(new CustomEvent('timeupdate', { detail: { currentTime: this.audio.currentTime, duration } }));
  }

  private handleTimeUpdate() {
    const duration = this.getDisplayedDuration();
    this.store.updatePlayback(!this.audio.paused, this.audio.currentTime, duration);
    this.dispatchEvent(new CustomEvent('timeupdate', { detail: { currentTime: this.audio.currentTime, duration } }));
  }

  private handleEnded() {
    if (this._repeatEnabled) {
      this.audio.currentTime = 0;
      void this.audio.play().catch(() => {});
      return;
    }

    this.audio.pause();
    this.audio.currentTime = 0;

    const duration = this.getDisplayedDuration();
    this.store.updatePlayback(false, 0, duration);
    this.dispatchEvent(new CustomEvent('timeupdate', { detail: { currentTime: 0, duration } }));
  }

  async loadTrack(track: Track) {
    this.audio.pause();

    if (this.lastTrackBlobUrl) {
      URL.revokeObjectURL(this.lastTrackBlobUrl);
      this.lastTrackBlobUrl = null;
    }

    const source = await this.resolveSource(track);
    this.hasPlayableSource = !!source;

    this.currentTrackId = track.id;
    this.store.setCurrentTrack(track);

    if (source) {
      if (source.startsWith('blob:') && source !== this.demoSourceUrl) {
        this.lastTrackBlobUrl = source;
      }
      this.audio.src = source;
      this.audio.load();
    } else {
      this.audio.removeAttribute('src');
      this.audio.load();
    }

    const durationToShow = this.currentSourceDuration || Math.round(track.duration * 60);
    this.store.updatePlayback(false, 0, durationToShow);
    this.dispatchEvent(new CustomEvent('timeupdate', { detail: { currentTime: 0, duration: durationToShow } }));
    this.dispatchEvent(new CustomEvent('trackchange', { detail: { track } }));
  }

  play() {
    if (!this.hasPlayableSource) return;
    void this.audio.play().catch(() => {});
  }

  pause() {
    if (!this.hasPlayableSource) return;
    this.audio.pause();
  }

  togglePlay() {
    if (!this.hasPlayableSource) return;
    this.audio.paused ? this.play() : this.pause();
  }

  seekTo(time: number) {
    if (!this.hasPlayableSource || !isFinite(this.audio.duration) || this.audio.duration <= 0) return;
    this.audio.currentTime = Math.min(Math.max(time, 0), this.audio.duration);
    // timeupdate сработает автоматически
  }

  skip(seconds: number) {
    this.seekTo(this.audio.currentTime + seconds);
  }

  setVolume(volume: number) {
    const v = Math.min(1, Math.max(0, volume));
    this.audio.volume = v;
    this.dispatchEvent(new CustomEvent('volumechange', { detail: { volume: v } }));
  }

  getVolume(): number {
    return this.audio.volume;
  }

  get repeatEnabled(): boolean {
    return this._repeatEnabled;
  }

  toggleRepeat() {
    this._repeatEnabled = !this._repeatEnabled;
    this.dispatchEvent(new CustomEvent('repeatchange', { detail: { repeatEnabled: this._repeatEnabled } }));
  }

  async playRandom() {
    const randomTrack = this.getRandomTrack();
    if (randomTrack) {
      await this.loadTrack(randomTrack);
      this.play();
    }
  }
}