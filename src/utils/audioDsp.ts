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

// Active procedural nodes to allow cancellation
let activeProceduralSources: { stop: () => void }[] = [];
let activeProceduralTimeout: any = null;

export function stopProceduralWhisperVoice() {
  if (activeProceduralTimeout) {
    clearTimeout(activeProceduralTimeout);
    activeProceduralTimeout = null;
  }
  activeProceduralSources.forEach((s) => {
    try {
      s.stop();
    } catch {}
  });
  activeProceduralSources = [];
}

// Procedural Web Audio Whisper & Vocal Synthesizer (100% Offline & works without OS TTS engines)
export function playProceduralWhisperVoice(
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
  onEnd?: () => void
): () => void {
  stopProceduralWhisperVoice();
  const ctx = getAudioContext();
  setupVocalDspChain(profile, params);
  startAmbientWhisperBed(params.breathiness, profile);

  // Parse into words / syllables
  const words = text
    .replace(/[^\w\s\u00C0-\u024F]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    stopAmbientWhisperBed();
    onEnd?.();
    return () => {};
  }

  const basePitch = profile.gender === 'male' ? 105 : 215;
  const pitchFreq = basePitch * params.pitch;
  let scheduleTime = ctx.currentTime + 0.05;

  words.forEach((word, idx) => {
    const vowelMatch = word.match(/[aiueo]/i);
    const vowel = vowelMatch ? vowelMatch[0].toLowerCase() : 'a';

    // Vowel formant target frequencies (F1 and F2)
    let f1 = 600;
    let f2 = 1400;
    if (vowel === 'i') {
      f1 = 300;
      f2 = 2300;
    } else if (vowel === 'u') {
      f1 = 350;
      f2 = 900;
    } else if (vowel === 'e') {
      f1 = 500;
      f2 = 1800;
    } else if (vowel === 'o') {
      f1 = 500;
      f2 = 1000;
    } else {
      f1 = 800;
      f2 = 1300;
    }

    if (profile.gender === 'male') {
      f1 *= 0.85;
      f2 *= 0.88;
    } else {
      f1 *= 1.12;
      f2 *= 1.15;
    }

    const dur = Math.max(0.18, Math.min(0.55, word.length * 0.075 * (1 / params.rate)));

    // 1. Whispered breath noise source
    const noiseBuf = createBreathNoiseBuffer(ctx, dur + 0.15);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const noiseFilter1 = ctx.createBiquadFilter();
    noiseFilter1.type = 'bandpass';
    noiseFilter1.frequency.setValueAtTime(f1, scheduleTime);
    noiseFilter1.Q.setValueAtTime(2.8, scheduleTime);

    const noiseFilter2 = ctx.createBiquadFilter();
    noiseFilter2.type = 'bandpass';
    noiseFilter2.frequency.setValueAtTime(f2, scheduleTime);
    noiseFilter2.Q.setValueAtTime(3.5, scheduleTime);

    const noiseGain = ctx.createGain();
    const peakWhisperGain = Math.max(0.04, (params.breathiness / 100) * 0.32 + (params.whisperDeVoice / 100) * 0.22);
    noiseGain.gain.setValueAtTime(0.001, scheduleTime);
    noiseGain.gain.exponentialRampToValueAtTime(peakWhisperGain, scheduleTime + 0.04);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, scheduleTime + dur);

    noiseSource.connect(noiseFilter1);
    noiseSource.connect(noiseFilter2);
    noiseFilter1.connect(noiseGain);
    noiseFilter2.connect(noiseGain);

    // 2. Soft harmonic undertone (reduced as whisperDeVoice increases)
    const voiceAmt = Math.max(0, 1 - params.whisperDeVoice / 100);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitchFreq, scheduleTime);
    osc.frequency.exponentialRampToValueAtTime(
      pitchFreq * (1 + ((idx % 2 === 0 ? 1 : -1) * 0.03)),
      scheduleTime + dur
    );

    const oscGain = ctx.createGain();
    const oscPeak = voiceAmt * (profile.gender === 'male' ? 0.07 : 0.045);
    oscGain.gain.setValueAtTime(0.0001, scheduleTime);
    if (oscPeak > 0.001) {
      oscGain.gain.exponentialRampToValueAtTime(oscPeak, scheduleTime + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, scheduleTime + dur);
    }

    osc.connect(noiseFilter1);
    osc.connect(oscGain);

    // Route through master vocal chain
    if (masterGain) {
      noiseGain.connect(masterGain);
      oscGain.connect(masterGain);
    } else {
      noiseGain.connect(ctx.destination);
      oscGain.connect(ctx.destination);
    }

    noiseSource.start(scheduleTime);
    noiseSource.stop(scheduleTime + dur + 0.05);
    osc.start(scheduleTime);
    osc.stop(scheduleTime + dur + 0.05);

    activeProceduralSources.push({
      stop: () => {
        try {
          noiseSource.stop();
          osc.stop();
        } catch {}
      },
    });

    scheduleTime += dur + (0.06 / params.rate);
  });

  const totalDuration = Math.max(0.5, scheduleTime - ctx.currentTime);
  activeProceduralTimeout = setTimeout(() => {
    stopAmbientWhisperBed();
    onEnd?.();
  }, totalDuration * 1000);

  return () => {
    stopProceduralWhisperVoice();
    stopAmbientWhisperBed();
  };
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
  // Clean tags like [breath], [sigh], [whisper], [pause]
  const cleanText = text
    .replace(/\[breath\]/gi, '')
    .replace(/\[sigh\]/gi, '')
    .replace(/\[whisper\]/gi, '')
    .replace(/\[pause\]/gi, '')
    .replace(/\.{3,}/g, ', ')
    .trim();

  // Check if there are breath or sigh cues
  if (/\[breath\]/i.test(text)) {
    playBreathEffect('breath', (params.breathiness / 100) * 0.7);
  } else if (/\[sigh\]/i.test(text)) {
    playBreathEffect('sigh', (params.breathiness / 100) * 0.7);
  }

  if (!cleanText) {
    setTimeout(() => onEnd?.(), 800);
    return () => {};
  }

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  // Fallback immediately if SpeechSynthesis API is completely absent
  if (!synth) {
    onStart?.();
    return playProceduralWhisperVoice(cleanText, profile, params, onEnd);
  }

  // Gracefully stop any active utterance before starting a new one
  try {
    synth.cancel();
  } catch {}

  setupVocalDspChain(profile, params);
  startAmbientWhisperBed(params.breathiness, profile);

  let isCancelled = false;
  let proceduralStopper: (() => void) | null = null;

  try {
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Auto-resolve voice if not provided
    let voiceToUse = selectedVoice;
    if (!voiceToUse && synth.getVoices) {
      const allVoices = synth.getVoices();
      voiceToUse = selectBestSystemVoice(profile, allVoices);
    }

    if (voiceToUse) {
      utterance.voice = voiceToUse;
      utterance.lang = voiceToUse.lang || 'id-ID';
    } else {
      utterance.lang = 'id-ID';
    }

    // Pitch calculation: Eryx lower, Elyra higher
    const deVoiceDamp = 1 - (params.whisperDeVoice / 100) * 0.15;
    utterance.pitch = Math.max(0.5, Math.min(2.0, params.pitch * deVoiceDamp));
    utterance.rate = Math.max(0.5, Math.min(1.6, params.rate));

    utterance.onstart = () => {
      if (!isCancelled) {
        onStart?.();
      }
    };

    utterance.onend = () => {
      stopAmbientWhisperBed();
      if (!isCancelled) {
        onEnd?.();
      }
    };

    utterance.onerror = (e: any) => {
      const errCode = e?.error;
      // 'canceled' and 'interrupted' are expected when user stops or switches lines
      if (errCode === 'canceled' || errCode === 'interrupted' || isCancelled) {
        stopAmbientWhisperBed();
        onEnd?.();
        return;
      }

      // If speech synthesis encountered an environment or audio device issue,
      // seamlessly fallback to procedural Web Audio speech synthesizer:
      console.warn(`SpeechSynthesis notice (${errCode || 'unsupported'}), engaging Procedural DSP engine.`);
      stopAmbientWhisperBed();
      if (!isCancelled) {
        proceduralStopper = playProceduralWhisperVoice(cleanText, profile, params, onEnd);
      }
    };

    synth.speak(utterance);
  } catch (err) {
    console.warn('SpeechSynthesis invocation fallback:', err);
    proceduralStopper = playProceduralWhisperVoice(cleanText, profile, params, onEnd);
  }

  return () => {
    isCancelled = true;
    if (synth) {
      try {
        synth.cancel();
      } catch {}
    }
    stopAmbientWhisperBed();
    if (proceduralStopper) {
      proceduralStopper();
    }
    stopProceduralWhisperVoice();
  };
}
