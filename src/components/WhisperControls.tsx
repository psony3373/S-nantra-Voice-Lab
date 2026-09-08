import React from 'react';
import { Sliders, Wind, VolumeX, Sparkles, FastForward, Activity } from 'lucide-react';
import { WhisperPresetId, VoiceId } from '../types';
import { WHISPER_PRESETS } from '../data/voices';
import { playBreathEffect } from '../utils/audioDsp';

interface WhisperControlsProps {
  voiceId: VoiceId;
  pitch: number;
  setPitch: (v: number) => void;
  rate: number;
  setRate: (v: number) => void;
  whisperDeVoice: number;
  setWhisperDeVoice: (v: number) => void;
  breathiness: number;
  setBreathiness: (v: number) => void;
  airBoostDb: number;
  setAirBoostDb: (v: number) => void;
  stereoWidth: number;
  setStereoWidth: (v: number) => void;
  activePreset: WhisperPresetId | null;
  onApplyPreset: (presetId: WhisperPresetId) => void;
}

export const WhisperControls: React.FC<WhisperControlsProps> = ({
  voiceId,
  pitch,
  setPitch,
  rate,
  setRate,
  whisperDeVoice,
  setWhisperDeVoice,
  breathiness,
  setBreathiness,
  airBoostDb,
  setAirBoostDb,
  stereoWidth,
  setStereoWidth,
  activePreset,
  onApplyPreset,
}) => {
  const isEryx = voiceId === 'eryx';
  const accentColor = isEryx ? 'amber' : 'rose';

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white font-display">
            Kontrol DSP Bisikan & Karakter Suara
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => playBreathEffect('breath', breathiness / 100)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
          >
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tes Napas</span>
          </button>
          <button
            type="button"
            onClick={() => playBreathEffect('sigh', breathiness / 100)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Tes Desah</span>
          </button>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="mb-5">
        <span className="text-[11px] text-slate-400 font-medium block mb-2">
          Preset Cepat Gaya Bisikan:
        </span>
        <div className="flex flex-wrap gap-2">
          {WHISPER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              id={`preset-${preset.id}`}
              type="button"
              onClick={() => onApplyPreset(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePreset === preset.id
                  ? isEryx
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-sm'
                    : 'bg-rose-500/25 text-rose-200 border border-rose-500/50 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80">
        
        {/* De-voicing (Bisikan) */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
              Intensitas Bisikan (De-Voice)
            </span>
            <span className="font-mono text-slate-400">{whisperDeVoice}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={whisperDeVoice}
            onChange={(e) => setWhisperDeVoice(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Meredam getaran pita suara kasar jadi desis udara murni.
          </p>
        </div>

        {/* Breathiness (Desah Napas) */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              Injeksi Desah (Breathiness)
            </span>
            <span className="font-mono text-slate-400">{breathiness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={breathiness}
            onChange={(e) => setBreathiness(Number(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Lapisan pink noise organik yang menyelimuti vokal.
          </p>
        </div>

        {/* Air Boost (High Shelf) */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              Air Presence (6k-10kHz)
            </span>
            <span className="font-mono text-slate-400">+{airBoostDb} dB</span>
          </div>
          <input
            type="range"
            min="0"
            max="18"
            step="1"
            value={airBoostDb}
            onChange={(e) => setAirBoostDb(Number(e.target.value))}
            className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Memberi tekstur bisikan dekat mikrofon kondensor ElevenLabs.
          </p>
        </div>

        {/* Pitch */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Pitch / Nada Dasar
            </span>
            <span className="font-mono text-slate-400">{pitch.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.02"
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Rendah untuk Eryx (0.7-0.85), tinggi lembut untuk Elyra (1.1-1.3).
          </p>
        </div>

        {/* Tempo / Speaking Rate */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <FastForward className="w-3.5 h-3.5 text-emerald-400" />
              Kecepatan Baca (Tempo)
            </span>
            <span className="font-mono text-slate-400">{rate.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.3"
            step="0.02"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Tempo lambat (0.75-0.90x) menghasilkan resonansi bisikan terbaik.
          </p>
        </div>

        {/* Stereo Haas Width */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Binaural 3D Ear-to-Ear
            </span>
            <span className="font-mono text-slate-400">{stereoWidth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={stereoWidth}
            onChange={(e) => setStereoWidth(Number(e.target.value))}
            className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Efek mikro-delay spasial serasa dibisikkan langsung ke kedua telinga.
          </p>
        </div>
      </div>
    </div>
  );
};
