import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI initialization
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Eryx & Elyra Voice Studio Server',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// AI Lyric / Whispering Enhancer
app.post('/api/enhance-lyrics', async (req, res) => {
  try {
    const { lyrics, mode = 'whisper_pacing', voice = 'Eryx' } = req.body;
    if (!lyrics) {
      return res.status(400).json({ error: 'Lirik tidak boleh kosong.' });
    }

    const ai = getAI();
    if (!ai) {
      // Fallback algorithmic breath & pause formatting if no API key is provided
      const formatted = lyrics
        .split('\n')
        .map((line: string) => {
          const trimmed = line.trim();
          if (!trimmed) return '';
          if (mode === 'whisper_pacing') {
            return `[whisper] ${trimmed} ... [breath]`;
          }
          return trimmed;
        })
        .join('\n');

      return res.json({
        enhancedText: formatted,
        note: 'Formatted using local procedural whisper DSP cues (Gemini API key optional).',
      });
    }

    const prompt = `Anda adalah ahli vokal, ASMR whispering audio engineer, dan pengarah pembacaan lirik lagu untuk karakter suara: ${voice} (Eryx = pria bersuara berat, tenang, intimate; Elyra = wanita bersuara lembut, airy, melodik).
Tugas: Modifikasi dan beri anotasi penanda napas & ritme pada lirik berikut agar sangat indah dan realistis saat dibacakan dengan teknik whispering/bisikan.
Gunakan format tag khusus:
- [whisper]: penanda bisikan
- [breath]: tarikan napas halus
- [sigh]: desah lembut
- ... : jeda pendek 0.5 detik
- [pause]: jeda 1 detik

Lirik asli:
${lyrics}

Format output: Hanya kembalikan teks lirik yang sudah di-annotasi baris demi baris tanpa pengantar atau markdown pembungkus.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const enhancedText = response.text || lyrics;
    res.json({ enhancedText });
  } catch (err: any) {
    console.error('Enhance lyrics error:', err);
    res.status(500).json({ error: err.message || 'Gagal memproses lirik.' });
  }
});

// Downloadable local scripts for RVC v2 and Piper TTS training
app.get('/api/download-script', (req, res) => {
  const type = req.query.type as string;

  if (type === 'rvc') {
    const script = `#!/usr/bin/env python3
"""
Eryx & Elyra RVC v2 Training & Local Inference Pipeline
Tanpa kredit ElevenLabs!
Langkah-langkah:
1. Rekam / download 3-10 menit sample suara Eryx atau Elyra dari ElevenLabs yang sudah kamu punya.
2. Letakkan file WAV di folder ./dataset_eryx atau ./dataset_elyra
3. Jalankan script ini untuk preprocessing dan training model RVC v2.
"""

import os
import sys

print("=== ERYX & ELYRA RVC v2 LOCAL SETUP ===")
print("1. Cloning Retrieval-based Voice Conversion...")
# os.system("git clone https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI.git")

print("""
Petunjuk Training Lokal RVC:
1. Install requirements:
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   pip install -r requirements.txt

2. Ekstraksi Fitur Suara (HuBERT):
   Letakkan audio Eryx/Elyra (24kHz atau 40kHz wav) di folder /dataset/
   Jalankan: python infer/modules/train/preprocess.py dataset 40000 2 ./logs/eryx 0
   Jalankan ekstraksi pitch: python infer/modules/train/extract_feature_print.py cuda:0 1 0 0 ./logs/eryx v2 40000

3. Training:
   python infer/modules/train/train.py -e eryx_v2 -sr 40k -f0 1 -bs 8 -te 200 -se 20 -pg ./assets/pretrained_v2/f0G40k.pth -pd ./assets/pretrained_v2/f0D40k.pth

4. Model .pth dan .index siap dipakai tanpa batas dan gratis!
""");
`;
    res.setHeader('Content-Disposition', 'attachment; filename="train_rvc_eryx_elyra.py"');
    res.setHeader('Content-Type', 'text/x-python');
    return res.send(script);
  }

  if (type === 'piper') {
    const script = `#!/usr/bin/env python3
"""
Piper TTS Fast Local ONNX Fine-Tuning for Eryx & Elyra
Sangat ringan, bisa jalan di CPU laptop biasa tanpa GPU!
"""

import os

print("""
=== PIPER TTS FINE-TUNING GUIDE FOR ERYX & ELYRA ===
1. Format Dataset (LJSpeech style):
   Folder:
   /dataset
     /wavs/
       0001.wav (22050 Hz Mono)
       0002.wav
     metadata.csv (format: id|transcript|normalized_transcript)

2. Install Piper-Whistle / Piper Training:
   git clone https://github.com/rhasspy/piper.git
   cd piper/src/python_run
   pip install -e .

3. Jalankan Fine-Tuning dengan checkpoint pretrained:
   python3 -m piper_train \\
     --dataset-dir ./dataset \\
     --accelerator 'cpu' \\
     --batch-size 16 \\
     --max-epochs 1000 \\
     --checkpoint-epochs 25

4. Export ke ONNX:
   python3 -m piper_train.export_onnx ./model.ckpt ./eryx_voice.onnx
""");
`;
    res.setHeader('Content-Disposition', 'attachment; filename="train_piper_eryx_elyra.py"');
    res.setHeader('Content-Type', 'text/x-python');
    return res.send(script);
  }

  res.status(400).send('Tipe script tidak dikenal');
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eryx & Elyra Voice Studio server running on http://localhost:${PORT}`);
  });
}

startServer();
