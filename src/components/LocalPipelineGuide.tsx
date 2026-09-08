import React, { useState } from 'react';
import {
  Cpu,
  Download,
  Terminal,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Server,
  Sparkles,
  Layers,
  HelpCircle,
  Radio
} from 'lucide-react';
import { RVC_GUIDE, PIPER_GUIDE, LOCAL_API_SERVER_CODE } from '../utils/trainingGuides';

export const LocalPipelineGuide: React.FC = () => {
  const [selectedGuide, setSelectedGuide] = useState<'rvc' | 'piper'>('rvc');
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);

  // Local server test state
  const [localEndpoint, setLocalEndpoint] = useState<string>('http://127.0.0.1:5005');
  const [pingStatus, setPingStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [pingMessage, setPingMessage] = useState<string>('');

  const currentGuide = selectedGuide === 'rvc' ? RVC_GUIDE : PIPER_GUIDE;

  const handleCopyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeKey(key);
    setTimeout(() => setCopiedCodeKey(null), 2000);
  };

  const handleTestLocalPing = async () => {
    setPingStatus('checking');
    try {
      const res = await fetch(`${localEndpoint}/health`, { method: 'GET', mode: 'cors' });
      const data = await res.json();
      setPingStatus('connected');
      setPingMessage(`Terhubung! Status: ${data.status || 'OK'}, Model siap inferensi.`);
    } catch (err: any) {
      setPingStatus('error');
      setPingMessage(
        `Belum terhubung ke ${localEndpoint}. Jalankan script 'local_voice_server.py' di komputermu.`
      );
    }
  };

  const handleDownloadPythonScript = (type: 'rvc' | 'piper') => {
    window.open(`/api/download-script?type=${type}`, '_blank');
  };

  const handleDownloadLocalServer = () => {
    const blob = new Blob([LOCAL_API_SERVER_CODE], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'local_voice_server.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Verdict */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-slate-950 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Solusi Nyata & 100% Gratis
              </span>
              <span className="text-xs text-slate-400">| Zero ElevenLabs Credits</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white font-display">
              Bisa Banget! Ini Blueprint & Arsitektur Lokal Eryx & Elyra
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Kamu tidak perlu membayar kredit ElevenLabs lagi. Dengan melatih model lokal menggunakan{' '}
              <strong className="text-amber-300">RVC v2</strong> (Retrieval-based Voice Conversion) atau{' '}
              <strong className="text-cyan-300">Piper TTS ONNX</strong>, suara Eryx dan Elyra dapat di-generate tanpa batas
              di laptop atau PC kamu, baik untuk bisikan ASMR maupun membaca lirik lagu!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadLocalServer}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Download Local Server API</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guide Type Tabs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSelectedGuide('rvc')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            selectedGuide === 'rvc'
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-md'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Panduan RVC v2 (Kualitas Suara 100% Sama)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedGuide('piper')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            selectedGuide === 'piper'
              ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-md'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Panduan Piper TTS (Ringan & Hemat CPU)</span>
        </button>
      </div>

      {/* Main Guide Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Step-by-Step Instructions (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-display">
                    {currentGuide.title}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                    {currentGuide.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{currentGuide.description}</p>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadPythonScript(selectedGuide)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 whitespace-nowrap transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Script Python</span>
              </button>
            </div>

            {/* Spec Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Paling Ideal Untuk:</span>
                <span className="text-slate-300 font-semibold">{currentGuide.idealFor}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Kebutuhan Hardware:</span>
                <span className="text-slate-300 font-semibold">{currentGuide.requirements}</span>
              </div>
            </div>

            {/* Step list */}
            <div className="space-y-4 pt-2">
              {currentGuide.steps.map((step) => (
                <div
                  key={step.step}
                  className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 font-mono text-xs font-bold flex items-center justify-center border border-slate-700">
                      {step.step}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    {step.description}
                  </p>

                  {step.code && (
                    <div className="relative ml-8 mt-2">
                      <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                        {step.code}
                      </pre>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(step.code!, `step-${step.step}`)}
                        className="absolute top-2 right-2 p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Salin Kode"
                      >
                        {copiedCodeKey === `step-${step.step}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Local Bridge API Connection & FAQ (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Local Bridge Tester */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display">
                Koneksi Local Bridge API
              </h3>
            </div>

            <p className="text-xs text-slate-400">
              Jalankan script Python FastAPI lokal di PC kamu untuk menghubungkan UI ini dengan model
              RVC/Piper di localhost.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-medium block">
                Local API Endpoint:
              </label>
              <input
                type="text"
                value={localEndpoint}
                onChange={(e) => setLocalEndpoint(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="button"
                onClick={handleTestLocalPing}
                disabled={pingStatus === 'checking'}
                className="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Radio className={`w-3.5 h-3.5 ${pingStatus === 'checking' ? 'animate-pulse' : ''}`} />
                <span>{pingStatus === 'checking' ? 'Mengecek...' : 'Tes Ping Local Bridge'}</span>
              </button>

              {pingMessage && (
                <div
                  className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                    pingStatus === 'connected'
                      ? 'bg-emerald-950/50 border border-emerald-800/50 text-emerald-300'
                      : 'bg-amber-950/40 border border-amber-800/40 text-amber-300'
                  }`}
                >
                  {pingMessage}
                </div>
              )}
            </div>
          </div>

          {/* Quick FAQ */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display">
                FAQ Pemula
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div>
                <strong className="text-white block font-medium">
                  Berapa banyak audio yang dibutuhkan?
                </strong>
                <span className="text-slate-400 text-[11px]">
                  Cukup 5-10 menit rekaman suara Eryx atau Elyra tanpa musik.
                </span>
              </div>

              <div>
                <strong className="text-white block font-medium">
                  Apakah bisa bisikan (whispering)?
                </strong>
                <span className="text-slate-400 text-[11px]">
                  Bisa! Filter DSP de-voicing di studio ini mengubah vokal dasar menjadi aliran udara murni,
                  lalu RVC mengubah timbrenya menjadi Eryx atau Elyra.
                </span>
              </div>

              <div>
                <strong className="text-white block font-medium">
                  Apakah bayar kredit lagi?
                </strong>
                <span className="text-slate-400 text-[11px]">
                  0 rupiah! Model berjalan 100% di komputermu sendiri selamanya.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
