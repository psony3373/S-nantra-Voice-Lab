import React, { useState, useRef, useEffect } from 'react';
import {
  Music2,
  Play,
  Square,
  Sparkles,
  RefreshCw,
  Sliders,
  Volume2,
  Download,
  FileText,
  Clock,
  Wind
} from 'lucide-react';
import { VoiceId, LyricLine } from '../types';
import { VOICE_PROFILES, SAMPLE_LYRICS } from '../data/voices';
import { speakLine, getAudioContext } from '../utils/audioDsp';
import { AudioVisualizer } from './AudioVisualizer';

interface LyricPlayerProps {
  activeVoice: VoiceId;
  setActiveVoice: (id: VoiceId) => void;
}

export const LyricPlayer: React.FC<LyricPlayerProps> = ({
  activeVoice,
  setActiveVoice,
}) => {
  const profile = VOICE_PROFILES[activeVoice];

  // Presets & lyrics
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [rawLyrics, setRawLyrics] = useState<string>(SAMPLE_LYRICS[0].text);
  const [bpm, setBpm] = useState<number>(75);
  const [interLineDelayMs, setInterLineDelayMs] = useState<number>(700);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  // Playing state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  const stopLyricRef = useRef<(() => void) | null>(null);
  const lyricContainerRef = useRef<HTMLDivElement | null>(null);

  // Convert raw lyrics to structured lines
  const lines: LyricLine[] = rawLyrics
    .split('\n')
    .map((line, idx) => {
      const clean = line
        .replace(/\[breath\]/gi, '')
        .replace(/\[sigh\]/gi, '')
        .replace(/\[whisper\]/gi, '')
        .replace(/\[pause\]/gi, '')
        .trim();

      return {
        id: `line-${idx}`,
        text: line.trim(),
        cleanText: clean,
        hasBreath: /\[breath\]/i.test(line),
        isWhisperOnly: /\[whisper\]/i.test(line),
        pauseMs: /\[sigh\]/i.test(line) || line.includes('...') ? 800 : 400,
      };
    })
    .filter((l) => l.text.length > 0);

  // Auto-scroll active line into view
  useEffect(() => {
    if (activeLineIndex >= 0 && lyricContainerRef.current) {
      const activeEl = lyricContainerRef.current.querySelector(`#teleprompter-line-${activeLineIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLineIndex]);

  // Handle Preset selection
  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    setRawLyrics(SAMPLE_LYRICS[index].text);
    handleStop();
  };

  // AI Lyric Enhancer
  const handleAiEnhance = async () => {
    setIsEnhancing(true);
    setAiNote(null);
    try {
      const res = await fetch('/api/enhance-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics: rawLyrics,
          voice: profile.name,
          mode: 'whisper_pacing',
        }),
      });
      const data = await res.json();
      if (data.enhancedText) {
        setRawLyrics(data.enhancedText);
        if (data.note) {
          setAiNote(data.note);
        }
      }
    } catch (err: any) {
      console.error('Failed to enhance lyrics:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Play continuous lyrics
  const handlePlayLyrics = (startIndex = 0) => {
    if (isPlaying) {
      handleStop();
      return;
    }

    if (lines.length === 0) return;

    setIsPlaying(true);
    let index = startIndex;

    const playStep = () => {
      if (index >= lines.length) {
        setIsPlaying(false);
        setActiveLineIndex(-1);
        return;
      }

      setActiveLineIndex(index);
      const current = lines[index];
      index++;

      // Fine-tune rate from BPM
      const dynamicRate = Math.max(0.65, Math.min(1.25, (bpm / 80) * profile.defaultRate));

      const cancel = speakLine(
        current.text,
        profile,
        {
          pitch: profile.defaultPitch,
          rate: dynamicRate,
          whisperDeVoice: profile.whisperDeVoice,
          breathiness: profile.breathiness,
          airBoostDb: profile.airBoostDb,
          stereoWidth: profile.stereoWidth,
        },
        null,
        undefined,
        () => {
          // Pause between lines according to BPM and breath tags
          const baseDelay = (60000 / bpm) * 0.7;
          const waitTime = Math.max(300, baseDelay + (current.hasBreath ? 500 : interLineDelayMs));
          setTimeout(playStep, waitTime);
        }
      );

      stopLyricRef.current = cancel;
    };

    playStep();
  };

  const handleStop = () => {
    if (stopLyricRef.current) {
      stopLyricRef.current();
      stopLyricRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveLineIndex(-1);
  };

  // Export whispered lyric audio
  const handleExportWav = () => {
    const totalLines = lines.length;
    const duration = Math.max(6, totalLines * 2.8);
    const sampleRate = 44100;
    const totalSamples = Math.floor(sampleRate * duration);
    const wavBuffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(wavBuffer);

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
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    const f0 = activeVoice === 'eryx' ? 115 : 220;
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const mod = Math.sin(2 * Math.PI * 0.25 * t);
      const tone = Math.sin(2 * Math.PI * f0 * t) * 0.25 * (0.5 + 0.5 * mod);
      const breath = (Math.random() * 2 - 1) * 0.45;
      const sample = (tone * 0.35 + breath * 0.65) * 0.7;
      const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
      view.setInt16(44 + i * 2, intSample, true);
    }

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lirik_${profile.name}_${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Voice Indicator */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Music2 className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold text-white font-display">
                Pembaca & Pemutar Lirik Musik (Lyric Teleprompter)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Sinkronisasi lirik per baris dengan karakter vokal {profile.name}. Dilengkapi jeda napas,
              tempo BPM, dan sorotan baris langsung.
            </p>
          </div>

          {/* Voice Switch for Lyric Session */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Vokalis Lirik:</span>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveVoice('eryx');
                  handleStop();
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeVoice === 'eryx'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Eryx (Deep)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveVoice('elyra');
                  handleStop();
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeVoice === 'elyra'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Elyra (Airy)
              </button>
            </div>
          </div>
        </div>

        {/* Preset Selector Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Contoh Lagu/Lirik:</span>
          {SAMPLE_LYRICS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedPresetIndex === idx
                  ? activeVoice === 'eryx'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50'
                    : 'bg-rose-500/25 text-rose-200 border border-rose-500/50'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
              }`}
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio View: Left Teleprompter + Right Lyric Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Teleprompter Karaoke Display (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          
          {/* Header of teleprompter */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/70">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                Live Lyric Teleprompter
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {activeLineIndex >= 0 ? `Baris ${activeLineIndex + 1} / ${lines.length}` : `${lines.length} Baris`}
            </span>
          </div>

          {/* Scrolling Lyric List */}
          <div
            ref={lyricContainerRef}
            className="h-80 overflow-y-auto space-y-3 py-4 px-2 scroll-smooth no-scrollbar"
          >
            {lines.map((line, idx) => {
              const isActive = activeLineIndex === idx;
              return (
                <div
                  key={line.id}
                  id={`teleprompter-line-${idx}`}
                  onClick={() => {
                    handleStop();
                    handlePlayLyrics(idx);
                  }}
                  className={`group p-3.5 rounded-xl cursor-pointer transition-all duration-300 border ${
                    isActive
                      ? activeVoice === 'eryx'
                        ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border-amber-500/60 shadow-lg shadow-amber-500/10 scale-[1.02] ring-1 ring-amber-500/40'
                        : 'bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 border-rose-500/60 shadow-lg shadow-rose-500/10 scale-[1.02] ring-1 ring-rose-500/40'
                      : 'bg-slate-900/30 hover:bg-slate-800/40 border-transparent text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p
                        className={`text-sm md:text-base font-medium transition-colors ${
                          isActive
                            ? activeVoice === 'eryx'
                              ? 'text-amber-200 font-bold'
                              : 'text-rose-200 font-bold'
                            : 'text-slate-300 group-hover:text-white'
                        }`}
                      >
                        {line.cleanText}
                      </p>
                      {/* Cues badges */}
                      <div className="flex items-center gap-2 mt-1">
                        {line.hasBreath && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 flex items-center gap-1 font-mono">
                            <Wind className="w-3 h-3" /> Tarik Napas
                          </span>
                        )}
                        {line.text.includes('...') && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                            Jeda Puitis
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-500 block">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity text-xs"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visualizer at bottom of teleprompter */}
          <div className="mt-4 pt-3 border-t border-slate-800/70">
            <AudioVisualizer isPlaying={isPlaying} voiceId={activeVoice} />
          </div>

          {/* Playback Action Buttons */}
          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2">
              <button
                id="lyric-play-btn"
                type="button"
                onClick={() => handlePlayLyrics(0)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all ${
                  isPlaying
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : activeVoice === 'eryx'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-rose-500 hover:bg-rose-400 text-white'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Lirik</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Mulai Baca Lirik ({profile.name})</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportWav}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Audio Lirik</span>
            </button>
          </div>
        </div>

        {/* Right: Lyric Editor & Rhythm Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Rhythm & BPM Pacing Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display">
                Pengaturan Irama & Tempo Lagu
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">Tempo Lagu / Metronome:</span>
                  <span className="font-mono font-bold text-amber-400">{bpm} BPM</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="120"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>Lambat (Balada)</span>
                  <span>Sedang (Lo-Fi)</span>
                  <span>Cepat (Pop)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">Jeda Napas Antar Baris:</span>
                  <span className="font-mono text-cyan-400">{interLineDelayMs} ms</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1500"
                  step="50"
                  value={interLineDelayMs}
                  onChange={(e) => setInterLineDelayMs(Number(e.target.value))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Lyric Raw Text Editor */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display">
                  Edit Lirik Kamu Sendiri
                </h3>
              </div>

              {/* AI Auto-Enhance Button */}
              <button
                type="button"
                onClick={handleAiEnhance}
                disabled={isEnhancing}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-300 border border-amber-500/40 rounded-lg transition-all"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                <span>{isEnhancing ? 'Menata Napas...' : 'AI Format Napas'}</span>
              </button>
            </div>

            {aiNote && (
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
                {aiNote}
              </div>
            )}

            <textarea
              rows={8}
              value={rawLyrics}
              onChange={(e) => setRawLyrics(e.target.value)}
              placeholder="Tempel atau ketik lirik lagu di sini..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 font-mono leading-relaxed"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Tips: Gunakan [breath], [sigh], atau ... di akhir baris</span>
              <span>{lines.length} baris terbaca</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
