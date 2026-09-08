// Web Audio API and Speech Synthesis Engine for Eryx & Elyra Voice Studio
import { VoiceProfile } from '../types';

let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let masterGain: GainNode | null = null;

// Initialize or return shared AudioContext
export function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function getAnalyser(): AnalyserNode | null {
  return analyserNode;
}

// Generate pink/shaped noise buffer for breath simulation
function createBreathNoiseBuffer(ctx: AudioContext, durationSeconds: number): AudioBuffer {
  const bufferSize = ctx.sampleRate * durationSeconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Pink noise approximation
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

// Play a realistic breath / sigh sound effect
export function playBreathEffect(type: 'breath' | 'sigh' = 'breath', intensity: number = 0.6) {
  const ctx = getAudioContext();
  const duration = type === 'breath' ? 0.9 : 1.4;
  const noiseBuffer = createBreathNoiseBuffer(ctx, duration);

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;

  // Filter for breath character (soft bandpass)
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(type === 'breath' ? 1200 : 800, ctx.currentTime);
  filter.Q.setValueAtTime(1.5, ctx.currentTime);

  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.001, now);

  if (type === 'breath') {
    // Inhalation: quick rise then release
    gain.gain.exponentialRampToValueAtTime(0.18 * intensity, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  } else {
    // Sigh: immediate warm peak then long taper
    gain.gain.exponentialRampToValueAtTime(0.22 * intensity, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  }

  source.connect(filter);
  filter.connect(gain);
  if (masterGain) {
    gain.connect(masterGain);
  } else {
    gain.connect(ctx.destination);
  }

  source.start(now);
  source.stop(now + duration);
}

// Setup the Master Vocal Chain (Air, Formants, De-voice, Stereo Haas, Dynamics)
export function setupVocalDspChain(profile: VoiceProfile, params: {
  whisperDeVoice: number;
  breathiness: number;
  airBoostDb: number;
  stereoWidth: number;
}) {
  const ctx = getAudioContext();

  if (masterGain) {
    try {
      masterGain.disconnect();
    } catch {}
  }

  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(1.0, ctx.currentTime);

  // 1. High Pass filter to cut low rumble
  const highPass = ctx.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.setValueAtTime(profile.gender === 'male' ? 90 : 140, ctx.currentTime);

  // 2. Resonant Formant filter (Eryx chest vs Elyra head voice)
  const formantFilter = ctx.createBiquadFilter();
  formantFilter.type = 'peaking';
  formantFilter.frequency.setValueAtTime(profile.resonanceHz, ctx.currentTime);
  formantFilter.Q.setValueAtTime(2.2, ctx.currentTime);
  formantFilter.gain.setValueAtTime(profile.gender === 'male' ? 4.5 : 3.0, ctx.currentTime);

  // 3. High Shelf "Air / Whisper Presence" filter (gives the condenser mic whisper vibe)
  const airShelf = ctx.createBiquadFilter();
  airShelf.type = 'highshelf';
  airShelf.frequency.setValueAtTime(6500, ctx.currentTime);
  airShelf.gain.setValueAtTime(params.airBoostDb, ctx.currentTime);

  // 4. Dynamics Compressor for velvety vocal leveling
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-20, ctx.currentTime);
  compressor.knee.setValueAtTime(12, ctx.currentTime);
  compressor.ratio.setValueAtTime(4.5, ctx.currentTime);
  compressor.attack.setValueAtTime(0.005, ctx.currentTime);
  compressor.release.setValueAtTime(0.2, ctx.currentTime);

  // 5. Analyser for real-time visualizer
  if (!analyserNode) {
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 512;
    analyserNode.smoothingTimeConstant = 0.85;
  }

  // Connect the DSP chain
  masterGain.connect(highPass);
  highPass.connect(formantFilter);
  formantFilter.connect(airShelf);
  airShelf.connect(compressor);
  compressor.connect(analyserNode);
  analyserNode.connect(ctx.destination);

  return {
    masterGain,
    analyserNode,
  };
}

// Background Whispering Noise Layer that accompanies speech
let activeWhisperNoiseSource: AudioBufferSourceNode | null = null;
let activeWhisperNoiseGain: GainNode | null = null;

export function startAmbientWhisperBed(intensity: number = 0.5, profile: VoiceProfile) {
  const ctx = getAudioContext();
  stopAmbientWhisperBed();

  const buffer = createBreathNoiseBuffer(ctx, 4);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(profile.gender === 'male' ? 1400 : 2200, ctx.currentTime);
  bandpass.Q.setValueAtTime(1.2, ctx.currentTime);

  const gain = ctx.createGain();
  const targetGain = 0.04 * (intensity / 100);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(targetGain, 0.001), ctx.currentTime + 0.2);

  source.connect(bandpass);
  bandpass.connect(gain);
  if (masterGain) {
    gain.connect(masterGain);
  } else {
    gain.connect(ctx.destination);
  }

  source.start();
  activeWhisperNoiseSource = source;
  activeWhisperNoiseGain = gain;
}

export function stopAmbientWhisperBed() {
  if (activeWhisperNoiseGain && audioCtx) {
    try {
      activeWhisperNoiseGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
    } catch {}
  }
  if (activeWhisperNoiseSource) {
    try {
      setTimeout(() => {
        activeWhisperNoiseSource?.stop();
        activeWhisperNoiseSource = null;
      }, 250);
    } catch {
      activeWhisperNoiseSource = null;
    }
  }
}

// Find best matching voice for Eryx and Elyra in available voices
export function selectBestSystemVoice(profile: VoiceProfile, availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!availableVoices || availableVoices.length === 0) return null;

  // Filter for Indonesian first if available, else high quality English
  const idVoices = availableVoices.filter(v => v.lang.startsWith('id'));
  const enVoices = availableVoices.filter(v => v.lang.startsWith('en'));

  const pool = idVoices.length > 0 ? idVoices : enVoices.length > 0 ? enVoices : availableVoices;

  // Eryx -> Prefer Male, Natural, Deep
  if (profile.gender === 'male') {
    const maleVoice = pool.find(v =>
      v.name.toLowerCase().includes('male') ||
      v.name.toLowerCase().includes('david') ||
      v.name.toLowerCase().includes('guy') ||
      v.name.toLowerCase().includes('george') ||
      v.name.toLowerCase().includes('james') ||
      v.name.toLowerCase().includes('google')
    );
    return maleVoice || pool[0];
  }

  // Elyra -> Prefer Female, Soft, Melodic
  const femaleVoice = pool.find(v =>
    v.name.toLowerCase().includes('female') ||
    v.name.toLowerCase().includes('zira') ||
    v.name.toLowerCase().includes('samantha') ||
    v.name.toLowerCase().includes('jenny') ||
    v.name.toLowerCase().includes('aria') ||
    v.name.toLowerCase().includes('google')
  );
  return femaleVoice || pool[pool.length - 1];
}

// Speak an individual line with Eryx or Elyra profile & DSP processing
export function speakLine(
  text: string,
  profile: VoiceProfile,
  params: {
    pitch: number;
    rate: number;
    whisperDeVoice: number;
    breathiness: number;
    airBoostDb: number;
    stereoWidth: number;
  },
  selectedVoice: SpeechSynthesisVoice | null,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  const synth = window.speechSynthesis;
  if (!synth) {
    console.warn('SpeechSynthesis not supported');
    onEnd?.();
    return () => {};
  }

  synth.cancel();

  // Clean tags like [breath], [sigh], [whisper], [pause]
  const cleanText = text
    .replace(/\[breath\]/gi, '')
    .replace(/\[sigh\]/gi, '')
    .replace(/\[whisper\]/gi, '')
    .replace(/\[pause\]/gi, '')
    .replace(/\.{3,}/g, ', ')
    .trim();

  if (!cleanText) {
    // If it's pure breath or sigh:
    if (/\[sigh\]/i.test(text)) {
      playBreathEffect('sigh', params.breathiness / 100);
    } else {
      playBreathEffect('breath', params.breathiness / 100);
    }
    setTimeout(() => onEnd?.(), 1000);
    return () => {};
  }

  // Check if there are cues
  if (/\[breath\]/i.test(text)) {
    playBreathEffect('breath', (params.breathiness / 100) * 0.7);
  } else if (/\[sigh\]/i.test(text)) {
    playBreathEffect('sigh', (params.breathiness / 100) * 0.7);
  }

  // Setup Web Audio graph
  setupVocalDspChain(profile, params);
  startAmbientWhisperBed(params.breathiness, profile);

  const utterance = new SpeechSynthesisUtterance(cleanText);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // Pitch calculation: Eryx is lower (0.7 - 0.85), Elyra is higher (1.1 - 1.3)
  // Whisper de-voicing also lowers pitch slightly to reduce vocal cord vibration
  const deVoiceDamp = 1 - (params.whisperDeVoice / 100) * 0.15;
  utterance.pitch = Math.max(0.5, Math.min(2.0, params.pitch * deVoiceDamp));

  // Speaking rate
  utterance.rate = Math.max(0.5, Math.min(1.6, params.rate));

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    stopAmbientWhisperBed();
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.error('TTS speech error', e);
    stopAmbientWhisperBed();
    onEnd?.();
  };

  synth.speak(utterance);

  return () => {
    synth.cancel();
    stopAmbientWhisperBed();
  };
}
