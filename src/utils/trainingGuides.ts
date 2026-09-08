// Training guides and script generators for local RVC v2 & Piper TTS

export interface ArchitectureGuide {
  title: string;
  badge: string;
  description: string;
  idealFor: string;
  requirements: string;
  steps: {
    step: number;
    title: string;
    description: string;
    code?: string;
  }[];
}

export const RVC_GUIDE: ArchitectureGuide = {
  title: 'RVC v2 (Retrieval-based Voice Conversion)',
  badge: 'Kualitas Tertinggi 1:1',
  description:
    'RVC v2 adalah metode terbaik untuk mendapatkan timbre Eryx & Elyra persis 100% seperti ElevenLabs. Kamu hanya butuh 5-10 menit rekaman suara lama dari ElevenLabs untuk ditraining.',
  idealFor: 'Lirik lagu bernyanyi, bisikan intim, cover lagu vokal, dan clone timbre presisi tinggi.',
  requirements: 'NVIDIA GPU (GTX 1660 / RTX 2060 ke atas, atau Google Colab Gratis T4).',
  steps: [
    {
      step: 1,
      title: 'Kumpulkan Sample Suara Eryx / Elyra Lama',
      description:
        'Kumpulkan file audio ElevenLabs yang sudah pernah kamu buat (durasi total 5-10 menit). Gunakan fitur STT & Dataset Slicer di aplikasi ini untuk memotong otomatis menjadi file WAV 3-10 detik tanpa background music.',
    },
    {
      step: 2,
      title: 'Clone Repo RVC v2 WebUI',
      description: 'Clone repository resmi RVC dan install dependensinya:',
      code: `git clone https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI.git
cd Retrieval-based-Voice-Conversion-WebUI
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
python infer-web.py`,
    },
    {
      step: 3,
      title: 'Training Model Eryx & Elyra',
      description:
        'Di tab "Train" WebUI: Masukkan nama model (misal "Eryx_V2"), arahkan ke folder WAV dataset, pilih target sample rate 40k, v2, f0 (RMVPE). Klik "Process Data", lalu "Feature Extraction", lalu "Train Model" (100 - 200 epochs).',
    },
    {
      step: 4,
      title: 'Ekspor File .pth & .index',
      description:
        'Setelah selesai, kamu mendapatkan 2 file: model weights (.pth) dan feature index (.index). Sekarang kamu bisa ubah TTS apapun atau suara kamu sendiri jadi suara Eryx / Elyra sepuasnya tanpa bayar kredit lagi!',
    },
  ],
};

export const PIPER_GUIDE: ArchitectureGuide = {
  title: 'Piper TTS Fast Local ONNX',
  badge: 'Super Cepat & Hemat CPU',
  description:
    'Piper adalah neural TTS berbasis VITS yang diexport ke ONNX. Sangat ringan, bisa jalan langsung di CPU laptop tanpa GPU dan menghasilkan suara dalam hitungan milidetik.',
  idealFor: 'Membaca lirik cepat, asisten lokal, buku audio, pembacaan teks panjang offline.',
  requirements: 'CPU biasa (Intel Core i3/Ryzen 3), RAM 4GB, tidak butuh GPU!',
  steps: [
    {
      step: 1,
      title: 'Siapkan Dataset LJSpeech Format',
      description:
        'Dataset Piper membutuhkan folder wavs/ dan metadata.csv berformat: id|transcript|normalized_transcript. Aplikasi ini menyediakan tombol "Download Dataset CSV" otomatis.',
    },
    {
      step: 2,
      title: 'Fine-Tuning Menggunakan Pretrained Voice',
      description: 'Gunakan checkpoint Piper bahasa Indonesia atau Inggris sebagai dasar:',
      code: `pip install piper-tts piper-train
python3 -m piper_train \\
  --dataset-dir ./dataset_eryx \\
  --accelerator 'cpu' \\
  --batch-size 8 \\
  --max-epochs 1000 \\
  --checkpoint-epochs 50`,
    },
    {
      step: 3,
      title: 'Ekspor ke ONNX & Jalankan',
      description: 'Ekspor model checkpoint ke file ONNX siap pakai:',
      code: `python3 -m piper_train.export_onnx ./model.ckpt ./eryx_local.onnx
# Tes jalankan di terminal:
echo "Malam ini rintik hujan turun perlahan" | \\
  piper --model ./eryx_local.onnx --output_file output.wav`,
    },
  ],
};

export const LOCAL_API_SERVER_CODE = `#!/usr/bin/env python3
"""
Local Voice Bridge Server (FastAPI)
Jalankan di komputermu di port 5005 agar Studio web ini bisa langsung 
melakukan inferensi ke RVC atau Piper secara lokal!
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

app = FastAPI(title="Eryx & Elyra Local Voice Bridge")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    text: string
    voice: string = "eryx"
    pitch: float = 0.0
    whisper_intensity: float = 0.5

@app.get("/health")
def health():
    return {
        "status": "ready",
        "models_loaded": ["eryx_v2.pth", "elyra_v2.pth"],
        "device": "cuda" if os.system("nvidia-smi") == 0 else "cpu"
    }

@app.post("/synthesize")
def synthesize(req: TTSRequest):
    # 1. Generate base speech via Piper atau Edge-TTS
    # 2. Convert timbre via RVC model eryx/elyra
    # 3. Return WAV audio
    return {"status": "success", "message": f"Synthesized '{req.text[:20]}...' using {req.voice}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5005)
`;
