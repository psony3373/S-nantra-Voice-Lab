import React from 'react';
import { Sparkles, Mic, Music2, Cpu, Scissors, Volume2 } from 'lucide-react';
import { VoiceId } from '../types';
import { VOICE_PROFILES } from '../data/voices';

interface HeaderProps {
  activeTab: 'tts' | 'lyrics' | 'slicer' | 'pipeline';
  setActiveTab: (tab: 'tts' | 'lyrics' | 'slicer' | 'pipeline') => void;
  activeVoice: VoiceId;
  setActiveVoice: (voice: VoiceId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeVoice,
  setActiveVoice,
}) => {
  const currentVoiceProfile = VOICE_PROFILES[activeVoice];

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 p-0.5 shadow-lg shadow-amber-500/10 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-display">
                  Eryx & Elyra Voice Studio
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Zero Credits Needed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Local TTS, ASMR Whispering DSP & Lyric Reader (RVC / Piper Pipeline)
              </p>
            </div>
          </div>

          {/* Voice Switcher Pill */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              id="header-switch-eryx"
              type="button"
              onClick={() => setActiveVoice('eryx')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeVoice === 'eryx'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Eryx (Deep Male)</span>
            </button>
            <button
              id="header-switch-elyra"
              type="button"
              onClick={() => setActiveVoice('elyra')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeVoice === 'elyra'
                  ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Elyra (Soft Female)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-800/40 overflow-x-auto no-scrollbar">
          <button
            id="nav-tab-tts"
            type="button"
            onClick={() => setActiveTab('tts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'tts'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Studio TTS & Bisikan</span>
          </button>

          <button
            id="nav-tab-lyrics"
            type="button"
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'lyrics'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Music2 className="w-4 h-4 text-rose-400" />
            <span>Baca Lirik (Karaoke Player)</span>
          </button>

          <button
            id="nav-tab-slicer"
            type="button"
            onClick={() => setActiveTab('slicer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'slicer'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Scissors className="w-4 h-4 text-cyan-400" />
            <span>STT & Dataset Slicer</span>
          </button>

          <button
            id="nav-tab-pipeline"
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'pipeline'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Pipeline RVC & Piper (Offline)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
