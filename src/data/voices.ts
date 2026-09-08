import { VoiceProfile, WhisperPreset } from '../types';

export const VOICE_PROFILES: Record<'eryx' | 'elyra', VoiceProfile> = {
  eryx: {
    id: 'eryx',
    name: 'Eryx',
    tagline: 'Deep, Resonant & Intimate Masculine Timbre',
    gender: 'male',
    defaultPitch: 0.78,
    defaultFormant: 0.82,
    defaultRate: 0.88,
    breathiness: 55,
    whisperDeVoice: 65,
    airBoostDb: 9,
    stereoWidth: 40,
    resonanceHz: 280,
    description:
      'Karakter suara pria berbobot hangat, dalam (deep chest resonance), tenang, dan sangat intim saat di-whisper. Sangat cocok untuk pembacaan lirik lagu indie, balada malam, atau ASMR bedtime.',
    recommendedUse: 'Lirik lagu slow acoustic, deep whispering, podcast naratif, monolog puitis.',
    avatarGradient: 'from-amber-600 via-amber-800 to-slate-900',
  },
  elyra: {
    id: 'elyra',
    name: 'Elyra',
    tagline: 'Soft, Crystalline & Ethereal Breathy Feminine Timbre',
    gender: 'female',
    defaultPitch: 1.18,
    defaultFormant: 1.15,
    defaultRate: 0.92,
    breathiness: 70,
    whisperDeVoice: 75,
    airBoostDb: 12,
    stereoWidth: 60,
    resonanceHz: 620,
    description:
      'Karakter suara wanita lembut, airy (berdesah halus), kristalin, dengan resonansi kepala yang jernih. Sangat cocok untuk whispering ear-to-ear, lirik lagu melankolis, dan ASMR relaksasi.',
    recommendedUse: 'Lirik lagu melodi lembut, bisikan telinga ke telinga (ear-to-ear), narasi tenang meditasi.',
    avatarGradient: 'from-rose-500 via-pink-700 to-slate-900',
  },
};

export const WHISPER_PRESETS: WhisperPreset[] = [
  {
    id: 'pure_whisper',
    name: 'Bisikan Murni (Pure ASMR)',
    description: 'De-voicing penuh tanpa getaran pita suara kasar. Udara murni dan desah bibir dekat mikrofon.',
    whisperDeVoice: 92,
    breathiness: 85,
    airBoostDb: 14,
    rate: 0.82,
    stereoWidth: 70,
  },
  {
    id: 'soft_intimate',
    name: 'Suara Pelan Intim (Soft-Spoken)',
    description: 'Kombinasi 40% nada vokal lembut + 60% hembusan napas. Paling natural untuk bercerita santai.',
    whisperDeVoice: 50,
    breathiness: 55,
    airBoostDb: 8,
    rate: 0.9,
    stereoWidth: 45,
  },
  {
    id: 'lyric_breathy',
    name: 'Pembacaan Lirik Puitis (Lyric Flow)',
    description: 'Artikulasi kata jelas dengan aksen napas di tiap ujung baris bait lagu.',
    whisperDeVoice: 40,
    breathiness: 60,
    airBoostDb: 10,
    rate: 0.86,
    stereoWidth: 50,
  },
  {
    id: 'bedtime_story',
    name: 'Pengantar Tidur Santai (Bedtime Relax)',
    description: 'Tempo sangat lambat, nada hangat, desis lembut yang menenangkan gelombang otak.',
    whisperDeVoice: 75,
    breathiness: 80,
    airBoostDb: 6,
    rate: 0.76,
    stereoWidth: 60,
  },
  {
    id: 'cinematic_warm',
    name: 'Narasi Hangat Sinematik (Cinematic)',
    description: 'Menonjolkan resonansi ruangan dan ketenangan vokal tanpa desis berlebihan.',
    whisperDeVoice: 25,
    breathiness: 35,
    airBoostDb: 6,
    rate: 0.94,
    stereoWidth: 30,
  },
];

export const SAMPLE_LYRICS = [
  {
    title: 'Hujan di Balik Jendela (Indie Ballad)',
    genre: 'Indonesian Acoustic Whispers',
    text: `Di ujung senja yang luruh perlahan [breath]
rintik hujan menyapa kaca jendela ...
Hening ini terasa begitu akrab
seperti bisikanmu yang pernah singgah [sigh]

Bila nanti malam kian larut ...
biarkan rinduku mengalir tenang [breath]
bersama dingin yang memeluk sepi.`,
  },
  {
    title: 'Midnight Reverie (Chill ASMR Poetic)',
    genre: 'English Lofi Breathy Lyrics',
    text: `Close your eyes and let the world drift away [breath]
neon lights fading into the midnight haze ...
Listen to the quiet rhythm of your heart [sigh]
Every whisper carries a quiet promise ...
You are safe here tonight [breath]
Just breathe with me.`,
  },
  {
    title: 'Gemerlap Bintang di Ufuk Malam (Pengantar Tidur)',
    genre: 'Bedtime Lullaby Whispers',
    text: `Tidurlah, jiwa yang lelah hari ini [breath]
bintang-bintang telah berjaga di langit gelap ...
Lepaskan semua resah yang memberatkan pundakmu [sigh]
Dengarkan hembusan angin malam yang damai ...
Besok mentari baru akan menyambutmu hangat. [breath]`,
  },
];
