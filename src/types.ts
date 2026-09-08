export type VoiceId = 'eryx' | 'elyra';

export interface VoiceProfile {
  id: VoiceId;
  name: string;
  tagline: string;
  gender: 'male' | 'female';
  defaultPitch: number;       // 0.5 - 1.5
  defaultFormant: number;     // 0.6 - 1.4
  defaultRate: number;        // 0.6 - 1.4
  breathiness: number;        // 0 - 100%
  whisperDeVoice: number;     // 0 - 100%
  airBoostDb: number;         // 0 - 18 dB
  stereoWidth: number;        // 0 - 100%
  resonanceHz: number;        // Formant center (Hz)
  description: string;
  recommendedUse: string;
  avatarGradient: string;
}

export type WhisperPresetId =
  | 'pure_whisper'
  | 'soft_intimate'
  | 'bedtime_story'
  | 'lyric_breathy'
  | 'cinematic_warm';

export interface WhisperPreset {
  id: WhisperPresetId;
  name: string;
  description: string;
  whisperDeVoice: number;
  breathiness: number;
  airBoostDb: number;
  rate: number;
  stereoWidth: number;
}

export interface LyricLine {
  id: string;
  text: string;
  cleanText: string;
  hasBreath: boolean;
  isWhisperOnly: boolean;
  pauseMs: number;
  pitchOffset?: number;
}

export interface DatasetSlice {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  transcript: string;
  audioBlob?: Blob;
  audioUrl?: string;
  voiceTarget: VoiceId;
}

export interface LocalBridgeConfig {
  endpoint: string;
  activeEngine: 'browser_dsp' | 'rvc_local' | 'piper_local';
  isConnected: boolean;
  latencyMs: number;
  selectedPthModel?: string;
  selectedOnnxModel?: string;
}
