import React, { useState, useRef } from 'react';
import { Play, Square, Download, Sparkles, Wind, Copy, Check, RotateCcw, Volume2 } from 'lucide-react';
import { VoiceId, WhisperPresetId } from '../types';
import { VOICE_PROFILES } from '../data/voices';
import { speakLine, getAudioContext } from '../utils/audioDsp';
import { AudioVisualizer } from './AudioVisualizer';
import { VoiceSelector } from './VoiceSelector';
import { WhisperControls } from './WhisperControls';

interface TtsStudioProps {
  activeVoice: VoiceId;
  setActiveVoice: (id: VoiceId) => void;
  availableVoices: SpeechSynthesisVoice[];
}

export const TtsStudio: React.FC<TtsStudioProps> = ({
  activeVoice,
  setActiveVoice,
  availableVoices,
}) => {
  const profile = VOICE_PROFILES[activeVoice];

  // DSP States
  const [pitch, setPitch] = useState<number>(profile.defaultPitch);
  const [rate, setRate] = useState<number>(profile.defaultRate);
  const [whisperDeVoice, setWhisperDeVoice] = useState<number>(profile.whisperDeVoice);
  const [breathiness, setBreathiness] = useState<number>(profile.breathiness);
  const [airBoostDb, setAirBoostDb] = useState<number>(profile.airBoostDb);
  const [stereoWidth, setStereoWidth] = useState<number>(profile.stereoWidth);
  const [activePreset, setActivePreset] = useState<WhisperPresetId | null>('pure_whisper');

  // Text state
  const [text, setText] = useState<string>(
    activeVoice === 'eryx'
      ? `Selamat malam ... [breath]
Semoga lelahmu perlahan terurai di sini [sigh]
Dengarkan bisikanku, tenangkan pikiranmu ...
Malam ini kamu aman, tidurlah dengan tenang. [breath]`
      : `Hembusan angin malam menyapa lembut ... [breath]
Setiap bait kata ini terangkai hanya untukmu [sigh]
Pejamkan matamu perlahan ...
Biarkan alunan bisikan ini menemanimu bermimpi indah. [breath]`
  );

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const stopCallbackRef = useRef<(() => void) | null>(null);

  // Sync profile defaults on voice change
  const handleSelectVoice = (id: VoiceId) => {
    setActiveVoice(id);
    const newProfile = VOICE_PROFILES[id];
    setPitch(newProfile.defaultPitch);
    setRate(newProfile.defaultRate);
    setWhisperDeVoice(newProfile.whisperDeVoice);
    setBreathiness(newProfile.breathiness);
    setAirBoostDb(newProfile.airBoostDb);
    setStereoWidth(newProfile.stereoWidth);
  };

  const handleApplyPreset = (presetId: WhisperPresetId) => {
    setActivePreset(presetId);
    if (presetId === 'pure_whisper') {
      setWhisperDeVoice(92);
      setBreathiness(85);
      setAirBoostDb(14);
      setRate(0.82);
      setStereoWidth(70);
    } else if (presetId === 'soft_intimate') {
      setWhisperDeVoice(50);
      setBreathiness(55);
      setAirBoostDb(8);
      setRate(0.9);
      setStereoWidth(45);
    } else if (presetId === 'lyric_breathy') {
      setWhisperDeVoice(40);
      setBreathiness(60);
      setAirBoostDb(10);
      setRate(0.86);
      setStereoWidth(50);
    } else if (presetId === 'bedtime_story') {
      setWhisperDeVoice(75);
      setBreathiness(80);
      setAirBoostDb(6);
      setRate(0.76);
      setStereoWidth(60);
    } else if (presetId === 'cinematic_warm') {
      setWhisperDeVoice(25);
      setBreathiness(35);
      setAirBoostDb(6);
      setRate(0.94);
      setStereoWidth(30);
    }
  };

  // Insert breath / sigh cue into text
  const handleInsertTag = (tag: string) => {
    setText((prev) => prev + ` ${tag} `);
  };

  // Play full text line-by-line with pauses
  const handlePlay = () => {
    if (isPlaying) {
      handleStop();
      return;
    }

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setIsPlaying(true);
    let index = 0;

    const playNext = () => {
      if (index >= lines.length) {
        setIsPlaying(false);
        setCurrentLineIndex(-1);
        return;
      }

      setCurrentLineIndex(index);
      const line = lines[index];
      index++;

      const cancel = speakLine(
        line,
        profile,
        {
          pitch,
          rate,
          whisperDeVoice,
          breathiness,
          airBoostDb,
          stereoWidth,
        },
        null,
        undefined,
        () => {
          // Pause between lines for breath
          const pauseTime = line.includes('...') || line.includes('[sigh]') ? 600 : 350;
          setTimeout(playNext, pauseTime);
        }
      );

      stopCallbackRef.current = cancel;
    };

    playNext();
  };

  const handleStop = () => {
    if (stopCallbackRef.current) {
      stopCallbackRef.current();
      stopCallbackRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentLineIndex(-1);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Audio WAV Exporter
  const handleExportWav = () => {
    const ctx = getAudioContext();
    // Synthesize procedural breathy audio sample for export
    const sampleRate = 44100;
    const duration = Math.max(3, Math.min(15, text.length * 0.08));
    const totalSamples = Math.floor(sampleRate * duration);
    const wavBuffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(wavBuffer);

    // RIFF header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    // Fill with soft whispered noise & formant tone
    const f0 = activeVoice === 'eryx' ? 120 : 230;
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const env = Math.sin((Math.PI * i) / totalSamples);
      const voiceTone = Math.sin(2 * Math.PI * f0 * t) * 0.2;
      const airNoise = (Math.random() * 2 - 1) * 0.45;
      const sample = (voiceTone * 0.3 + airNoise * 0.7) * env;
      const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
      view.setInt16(44 + i * 2, intSample, true);
    }

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeVoice}_whisper_${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  return (
    <div className="space-y-6">
      {/* Voice Selection */}
      <VoiceSelector
        activeVoice={activeVoice}
        onSelectVoice={handleSelectVoice}
        availableVoices={availableVoices}
      />

      {/* Whisper DSP Controls */}
      <WhisperControls
        voiceId={activeVoice}
        pitch={pitch}
        setPitch={setPitch}
        rate={rate}
        setRate={setRate}
        whisperDeVoice={whisperDeVoice}
        setWhisperDeVoice={setWhisperDeVoice}
        breathiness={breathiness}
        setBreathiness={setBreathiness}
        airBoostDb={airBoostDb}
        setAirBoostDb={setAirBoostDb}
        stereoWidth={stereoWidth}
        setStereoWidth={setStereoWidth}
        activePreset={activePreset}
        onApplyPreset={handleApplyPreset}
      />

      {/* Main TTS Input & Studio Card */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Editor Teks Bisikan & Pembacaan ({profile.name})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Ketik teks bebas atau tambahkan tag napas untuk intonasi alami.
            </p>
          </div>

          {/* Quick Tag Insert Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 mr-1">Insert Cue:</span>
            <button
              type="button"
              onClick={() => handleInsertTag('[breath]')}
              className="px-2.5 py-1 text-[11px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/50 rounded-lg hover:bg-cyan-900/40 transition-colors"
            >
              + [breath]
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag('[sigh]')}
              className="px-2.5 py-1 text-[11px] font-mono bg-pink-950/40 text-pink-300 border border-pink-800/50 rounded-lg hover:bg-pink-900/40 transition-colors"
            >
              + [sigh]
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag('...')}
              className="px-2.5 py-1 text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
            >
              + ... (jeda)
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag('[whisper]')}
              className="px-2.5 py-1 text-[11px] font-mono bg-amber-950/40 text-amber-300 border border-amber-800/50 rounded-lg hover:bg-amber-900/40 transition-colors"
            >
              + [whisper]
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            id="tts-input-textarea"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis kalimat atau lirik yang ingin dibisikkan oleh Eryx atau Elyra..."
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all font-sans leading-relaxed resize-y"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Salin Teks"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Real-time Audio Visualizer */}
        <AudioVisualizer isPlaying={isPlaying} voiceId={activeVoice} />

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              id="tts-play-btn"
              type="button"
              onClick={handlePlay}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                  : activeVoice === 'eryx'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-amber-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white font-bold shadow-rose-500/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Hentikan Suara</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Putar Bisikan {profile.name}</span>
                </>
              )}
            </button>

            {isPlaying && (
              <button
                type="button"
                onClick={handleStop}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="tts-download-wav"
              type="button"
              onClick={handleExportWav}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Audio WAV (Gratis)</span>
            </button>
          </div>
        </div>

        {/* Live Line-by-line highlight preview */}
        {lines.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium block mb-2">
              Preview Baris Pembacaan:
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    speakLine(
                      line,
                      profile,
                      { pitch, rate, whisperDeVoice, breathiness, airBoostDb, stereoWidth },
                      null,
                      () => {
                        setIsPlaying(true);
                        setCurrentLineIndex(idx);
                      },
                      () => {
                        setIsPlaying(false);
                        setCurrentLineIndex(-1);
                      }
                    );
                  }}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    currentLineIndex === idx
                      ? activeVoice === 'eryx'
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 ring-1 ring-amber-500/20'
                        : 'bg-rose-500/20 text-rose-200 border border-rose-500/40 ring-1 ring-rose-500/20'
                      : 'bg-slate-950/40 text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <span className="flex-1 font-sans">{line}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-slate-500">Klik untuk baca</span>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
