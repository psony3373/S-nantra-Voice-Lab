import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Scissors,
  Download,
  Upload,
  Play,
  Square,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { VoiceId, DatasetSlice } from '../types';

interface SttAndSlicerProps {
  activeVoice: VoiceId;
}

export const SttAndSlicer: React.FC<SttAndSlicerProps> = ({ activeVoice }) => {
  // Speech-to-text state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [sttLanguage, setSttLanguage] = useState<'id-ID' | 'en-US'>('id-ID');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);

  // Audio recording / dataset slicing state
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Slices table
  const [slices, setSlices] = useState<DatasetSlice[]>([
    {
      id: 'slice-0001',
      startTime: 0,
      endTime: 4.2,
      duration: 4.2,
      transcript: 'Malam ini rintik hujan turun dengan tenang di balik jendela.',
      voiceTarget: 'eryx',
    },
    {
      id: 'slice-0002',
      startTime: 4.5,
      endTime: 8.8,
      duration: 4.3,
      transcript: 'Setiap hembusan napas membawa kedamaian yang terpendam.',
      voiceTarget: 'eryx',
    },
    {
      id: 'slice-0003',
      startTime: 9.0,
      endTime: 13.5,
      duration: 4.5,
      transcript: 'Pejamkan matamu dan dengarkan melodi lembut ini.',
      voiceTarget: 'elyra',
    },
  ]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = sttLanguage;

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const final = event.results[i][0].transcript.trim();
            if (final) {
              setTranscriptHistory((prev) => [final, ...prev]);
              setLiveTranscript('');
            }
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setLiveTranscript(interim);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [sttLanguage]);

  // Toggle STT listening
  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      alert('Browser ini belum mendukung Web Speech Recognition. Gunakan Chrome atau Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setLiveTranscript('');
      try {
        recognitionRef.current.lang = sttLanguage;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Could not start recognition', err);
      }
    }
  };

  // Toggle audio recording from mic
  const handleToggleRecordAudio = async () => {
    if (isRecordingAudio) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      clearInterval(timerRef.current);
      setIsRecordingAudio(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setRecordedAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);

          // Stop all audio tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start(250);
        mediaRecorderRef.current = recorder;
        setIsRecordingAudio(true);
        setRecordingDuration(0);

        timerRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Error accessing microphone', err);
        alert('Tidak dapat mengakses mikrofon. Pastikan izin mikrofon telah diberikan.');
      }
    }
  };

  // Convert uploaded audio file into slices
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setRecordedAudioUrl(url);

    // Create 3 automatic slices for demonstration
    const newSlices: DatasetSlice[] = [
      {
        id: `slice-${String(slices.length + 1).padStart(4, '0')}`,
        startTime: 0,
        endTime: 5.0,
        duration: 5.0,
        transcript: `${file.name.replace(/\.[^/.]+$/, '')} - bagian 1 (${activeVoice})`,
        voiceTarget: activeVoice,
      },
      {
        id: `slice-${String(slices.length + 2).padStart(4, '0')}`,
        startTime: 5.0,
        endTime: 10.0,
        duration: 5.0,
        transcript: `${file.name.replace(/\.[^/.]+$/, '')} - bagian 2 (${activeVoice})`,
        voiceTarget: activeVoice,
      },
    ];

    setSlices((prev) => [...prev, ...newSlices]);
  };

  // Add a slice manually from STT transcript
  const handleAddSliceFromTranscript = (text: string) => {
    const newSlice: DatasetSlice = {
      id: `slice-${String(slices.length + 1).padStart(4, '0')}`,
      startTime: 0,
      endTime: 4.0,
      duration: 4.0,
      transcript: text,
      voiceTarget: activeVoice,
    };
    setSlices((prev) => [...prev, newSlice]);
  };

  // Export metadata.csv for Piper or RVC
  const handleExportCsv = () => {
    // LJSpeech format: id|transcript|normalized_transcript
    const header = 'id|transcript|normalized_transcript\n';
    const rows = slices
      .map((s) => `${s.id}|${s.transcript}|${s.transcript}`)
      .join('\n');
    const csvContent = header + rows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metadata_${activeVoice}_dataset.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteSlice = (id: string) => {
    setSlices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateSliceTranscript = (id: string, newText: string) => {
    setSlices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, transcript: newText } : s))
    );
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white font-display">
                Speech-to-Text (STT) & Dataset Audio Slicer
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Alat pemotong audio sample ElevenLabs lama dan transkripsi suara otomatis untuk membuat dataset
              training Piper TTS atau RVC v2. Tanpa perlu mengetik ulang transkrip satu per satu!
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-cyan-600/20 transition-all self-start md:self-center"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor metadata.csv ({slices.length} File)</span>
          </button>
        </div>
      </div>

      {/* Two Columns: STT Real-time + Audio Slicer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live STT Voice Transcriber (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white font-display">
                  Live STT (Transkripsi Suara)
                </h3>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSttLanguage('id-ID')}
                  className={`px-2 py-1 rounded-md font-medium ${
                    sttLanguage === 'id-ID'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ID (Indonesia)
                </button>
                <button
                  type="button"
                  onClick={() => setSttLanguage('en-US')}
                  className={`px-2 py-1 rounded-md font-medium ${
                    sttLanguage === 'en-US'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  EN (English)
                </button>
              </div>
            </div>

            {/* Microphone Toggle Button */}
            <button
              id="stt-toggle-btn"
              type="button"
              onClick={handleToggleListening}
              className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold transition-all shadow-md ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Sedang Mendengarkan Suara (Klik untuk Stop)</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <span>Mulai Rekam Transkripsi Mic</span>
                </>
              )}
            </button>

            {/* Live interim display */}
            {liveTranscript && (
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 animate-pulse">
                "{liveTranscript}..."
              </div>
            )}

            {/* Transcript history */}
            <div>
              <span className="text-[11px] text-slate-400 font-medium block mb-2">
                Riwayat Ucapan Terdeteksi:
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {transcriptHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    Belum ada suara terdeteksi. Klik tombol rekam lalu bicaralah.
                  </p>
                ) : (
                  transcriptHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-slate-200 flex-1">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleAddSliceFromTranscript(item)}
                        title="Tambahkan ke Dataset"
                        className="px-2 py-1 text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded-md transition-colors whitespace-nowrap"
                      >
                        + Masuk Dataset
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Audio Slicer & Dataset Table (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white font-display">
                  Dataset Audio Slices ({activeVoice.toUpperCase()})
                </h3>
                <p className="text-xs text-slate-400">
                  Potongan audio 3-10 detik yang bersih dari musik untuk melatih model lokal.
                </p>
              </div>

              {/* Upload ElevenLabs file button */}
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload Audio ElevenLabs</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Audio Recorder from Mic */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleRecordAudio}
                  className={`p-2 rounded-xl transition-all ${
                    isRecordingAudio
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isRecordingAudio ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                </button>
                <div>
                  <span className="text-xs font-semibold text-white block">
                    {isRecordingAudio ? 'Sedang Merekam Suara...' : 'Rekam Sampel Suara Langsung'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isRecordingAudio
                      ? `Durasi: ${recordingDuration} detik`
                      : 'Bisa membaca naskah atau bisikan untuk sampel.'}
                  </span>
                </div>
              </div>

              {recordedAudioUrl && (
                <audio controls src={recordedAudioUrl} className="h-8 max-w-[200px]" />
              )}
            </div>

            {/* Slices Table */}
            <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">ID File</th>
                      <th className="py-2.5 px-3 font-semibold">Target</th>
                      <th className="py-2.5 px-3 font-semibold">Durasi</th>
                      <th className="py-2.5 px-3 font-semibold">Teks Transkrip</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {slices.map((slice) => (
                      <tr key={slice.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-cyan-400 font-medium">
                          {slice.id}.wav
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              slice.voiceTarget === 'eryx'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {slice.voiceTarget}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {slice.duration}s
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={slice.transcript}
                            onChange={(e) =>
                              handleUpdateSliceTranscript(slice.id, e.target.value)
                            }
                            className="w-full bg-slate-900/80 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSlice(slice.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                            title="Hapus Slice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Format kompatibel dengan RVC v2 Dataset & Piper LJSpeech
              </span>
              <span>Total {slices.length} Sampel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
