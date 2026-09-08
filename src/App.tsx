import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TtsStudio } from './components/TtsStudio';
import { LyricPlayer } from './components/LyricPlayer';
import { SttAndSlicer } from './components/SttAndSlicer';
import { LocalPipelineGuide } from './components/LocalPipelineGuide';
import { VoiceId } from './types';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tts' | 'lyrics' | 'slicer' | 'pipeline'>('tts');
  const [activeVoice, setActiveVoice] = useState<VoiceId>('eryx');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load available browser speech voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeVoice={activeVoice}
        setActiveVoice={setActiveVoice}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'tts' && (
          <TtsStudio
            activeVoice={activeVoice}
            setActiveVoice={setActiveVoice}
            availableVoices={availableVoices}
          />
        )}

        {activeTab === 'lyrics' && (
          <LyricPlayer
            activeVoice={activeVoice}
            setActiveVoice={setActiveVoice}
          />
        )}

        {activeTab === 'slicer' && (
          <SttAndSlicer activeVoice={activeVoice} />
        )}

        {activeTab === 'pipeline' && (
          <LocalPipelineGuide />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-5 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              100% Offline & Local Architecture — Tanpa Kredit ElevenLabs (Zero API Cost)
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Karakter Suara: <strong>Eryx</strong> & <strong>Elyra</strong></span>
            <span>•</span>
            <span>Didukung Web Audio DSP, RVC v2 & Piper TTS ONNX</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
