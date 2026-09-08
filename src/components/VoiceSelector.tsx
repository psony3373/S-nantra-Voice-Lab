import React from 'react';
import { Volume2, Sparkles, User, Heart } from 'lucide-react';
import { VoiceId } from '../types';
import { VOICE_PROFILES } from '../data/voices';
import { speakLine } from '../utils/audioDsp';

interface VoiceSelectorProps {
  activeVoice: VoiceId;
  onSelectVoice: (id: VoiceId) => void;
  availableVoices: SpeechSynthesisVoice[];
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  activeVoice,
  onSelectVoice,
  availableVoices,
}) => {
  const handlePreviewVoice = (id: VoiceId, e: React.MouseEvent) => {
    e.stopPropagation();
    const profile = VOICE_PROFILES[id];
    const samplePhrase =
      id === 'eryx'
        ? 'Halo, saya Eryx. Suara hangat, tenang, dan siap membacakan lirik dengan bisikan lembut untukmu.'
        : 'Halo, aku Elyra. Desah halus dan hembusan kata-kataku akan menemani setiap bait lirikmu.';

    speakLine(
      samplePhrase,
      profile,
      {
        pitch: profile.defaultPitch,
        rate: profile.defaultRate,
        whisperDeVoice: profile.whisperDeVoice,
        breathiness: profile.breathiness,
        airBoostDb: profile.airBoostDb,
        stereoWidth: profile.stereoWidth,
      },
      null
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Eryx Card */}
      <div
        id="voice-card-eryx"
        onClick={() => onSelectVoice('eryx')}
        className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 border text-left ${
          activeVoice === 'eryx'
            ? 'bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-950 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
            : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-900 flex items-center justify-center text-amber-200 font-bold text-lg shadow-inner">
              Ex
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">Eryx</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30">
                  Resonant Male
                </span>
              </div>
              <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                {VOICE_PROFILES.eryx.tagline}
              </p>
            </div>
          </div>

          <button
            type="button"
            title="Dengarkan Contoh Suara Eryx"
            onClick={(e) => handlePreviewVoice('eryx', e)}
            className="p-2 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          {VOICE_PROFILES.eryx.description}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400">Cocok untuk:</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
            Slow Acoustic
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
            Deep ASMR Whisper
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
            Balada Malam
          </span>
        </div>
      </div>

      {/* Elyra Card */}
      <div
        id="voice-card-elyra"
        onClick={() => onSelectVoice('elyra')}
        className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 border text-left ${
          activeVoice === 'elyra'
            ? 'bg-gradient-to-b from-rose-950/40 via-slate-900/90 to-slate-950 border-rose-500/50 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/30'
            : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-900 flex items-center justify-center text-rose-200 font-bold text-lg shadow-inner">
              El
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">Elyra</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-300 rounded-md border border-rose-500/30">
                  Breathy Female
                </span>
              </div>
              <p className="text-xs text-rose-400/90 font-medium mt-0.5">
                {VOICE_PROFILES.elyra.tagline}
              </p>
            </div>
          </div>

          <button
            type="button"
            title="Dengarkan Contoh Suara Elyra"
            onClick={(e) => handlePreviewVoice('elyra', e)}
            className="p-2 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          {VOICE_PROFILES.elyra.description}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400">Cocok untuk:</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
            Ear-to-Ear ASMR
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
            Melancholic Melodies
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
            Bedtime Story
          </span>
        </div>
      </div>
    </div>
  );
};
