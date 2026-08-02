import { decryptSync } from './encryption';
import { getApiUrl } from '../config';

export type VoiceLanguageSetting =
  | 'auto'
  | 'english'
  | 'hindi'
  | 'spanish'
  | 'french'
  | 'arabic'
  | 'portuguese'
  | 'german'
  | 'mandarin'
  | 'japanese'
  | 'russian'
  | 'bengali'
  | 'tamil'
  | 'telugu'
  | 'marathi'
  | 'urdu'
  | 'italian'
  | 'korean'
  | 'turkish';

export type VoiceSpeedSetting = 'slow' | 'normal' | 'fast';

export interface LanguageInfo {
  code: VoiceLanguageSetting;
  name: string;
  nativeName: string;
  flag: string;
  locale: string;
}

export function getVoiceRateSetting(): VoiceSpeedSetting {
  if (typeof window === 'undefined') return 'normal';
  const saved = localStorage.getItem('daily_companion_voice_speed');
  if (saved === 'slow' || saved === 'normal' || saved === 'fast') {
    return saved as VoiceSpeedSetting;
  }
  return 'normal';
}

export function setVoiceRateSetting(setting: VoiceSpeedSetting): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('daily_companion_voice_speed', setting);
  }
}

export function getSpeedMultiplier(): number {
  const setting = getVoiceRateSetting();
  if (setting === 'slow') return 0.85;
  if (setting === 'fast') return 1.22;
  return 1.0;
}

/**
 * Detect emotional tone of text to modulate voice softness or optimism
 */
export function detectEmotionalTone(text: string): 'softer' | 'upbeat' | 'normal' {
  const lower = text.toLowerCase();
  const sensitiveRegex = /(sad|anxious|lonely|pain|grief|sorry|loss|depressed|hard time|crying|overwhelmed|hurt|panic|afraid|scared|heavy|struggling|bad day|upset)/i;
  const upbeatRegex = /(congrat|yay|celebrate|proud|fantastic|awesome|streak|milestone|hooray|amazing|superb|brilliant|bravo|woohoo|happy for you|victory|win|wonderful news)/i;

  if (sensitiveRegex.test(lower)) return 'softer';
  if (upbeatRegex.test(lower)) return 'upbeat';
  return 'normal';
}

export const SUPPORTED_VOICE_LANGUAGES: LanguageInfo[] = [
  { code: 'auto', name: 'Auto (Match Language)', nativeName: 'Automatic', flag: '🌐', locale: 'auto' },
  { code: 'english', name: 'English', nativeName: 'English', flag: '🇺🇸', locale: 'en-US' },
  { code: 'hindi', name: 'Hindi / Hinglish', nativeName: 'हिन्दी / Hinglish', flag: '🇮🇳', locale: 'hi-IN' },
  { code: 'spanish', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', locale: 'es-ES' },
  { code: 'french', name: 'French', nativeName: 'Français', flag: '🇫🇷', locale: 'fr-FR' },
  { code: 'arabic', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', locale: 'ar-SA' },
  { code: 'portuguese', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', locale: 'pt-BR' },
  { code: 'german', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', locale: 'de-DE' },
  { code: 'mandarin', name: 'Mandarin Chinese', nativeName: '中文', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'japanese', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'russian', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', locale: 'ru-RU' },
  { code: 'bengali', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', locale: 'bn-IN' },
  { code: 'tamil', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', locale: 'ta-IN' },
  { code: 'telugu', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', locale: 'te-IN' },
  { code: 'marathi', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', locale: 'mr-IN' },
  { code: 'urdu', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', locale: 'ur-PK' },
  { code: 'italian', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', locale: 'it-IT' },
  { code: 'korean', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', locale: 'ko-KR' },
  { code: 'turkish', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', locale: 'tr-TR' },
];

let isSpeakingActiveState = false;
let currentUtteranceId = 0;
let currentAudioElement: HTMLAudioElement | null = null;
let currentAudioObjectUrl: string | null = null;
let globalAudioContext: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;

export function getAudioContext(): AudioContext | null {
  if (!globalAudioContext && typeof window !== 'undefined') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      globalAudioContext = new AudioCtx();
    }
  }
  return globalAudioContext;
}

/**
  * Unlocks AudioContext and SpeechSynthesis on user gestures so subsequent async
  * network-driven speech responses bypass browser autoplay restrictions seamlessly.
  */
export function unlockAudio(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  } catch (e) {}
}

export function isSpeechActive(): boolean {
  const isAudioPlaying = !!currentAudioElement && !currentAudioElement.paused;
  const isSourceNodePlaying = !!currentSourceNode;
  const isSynthesisSpeaking =
    typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
  return isSpeakingActiveState || isAudioPlaying || isSourceNodePlaying || isSynthesisSpeaking;
}

export function getVoiceLanguageSetting(): VoiceLanguageSetting {
  if (typeof window === 'undefined') return 'auto';
  const saved = localStorage.getItem('daily_companion_voice_lang');
  if (saved && SUPPORTED_VOICE_LANGUAGES.some((l) => l.code === saved)) {
    return saved as VoiceLanguageSetting;
  }
  return 'auto';
}

export function setVoiceLanguageSetting(setting: VoiceLanguageSetting): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('daily_companion_voice_lang', setting);
  }
}

export function stopSpeech(): void {
  currentUtteranceId++;
  isSpeakingActiveState = false;

  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch (e) {}
    currentSourceNode = null;
  }

  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch (e) {}
    currentAudioElement = null;
  }

  if (currentAudioObjectUrl) {
    try {
      URL.revokeObjectURL(currentAudioObjectUrl);
    } catch (e) {}
    currentAudioObjectUrl = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

/**
 * Clean markdown formatting, emojis, and control markup so text-to-speech speaks cleanly, naturally, and without distortions
 */
function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/\[NEW_MEMORY:[^\]]+\]/gi, '')
    // Remove emojis so TTS engine doesn't stutter, stumble, or mispronounce text
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#+\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Automatically detect language from text script or vocabulary
 */
export function detectTextLanguage(text: string): string {
  if (!text) return 'en-US';

  // Script-based detection
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'; // Devanagari (Hindi)
  if (/[\u0600-\u06FF]/.test(text)) return 'ar-SA'; // Arabic
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh-CN'; // Chinese
  if (/[\u3040-\u30FF]/.test(text)) return 'ja-JP'; // Japanese
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko-KR'; // Korean
  if (/[\u0400-\u04FF]/.test(text)) return 'ru-RU'; // Russian
  if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN'; // Bengali
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'; // Telugu

  const lower = text.toLowerCase();

  // Spanish
  if (/(\bque\b|\bpor\s+favor\b|\bgracias\b|\bhola\b|\bbuenos\b|\bcomo\b|\bestas\b|\bmuy\b|\bbien\b|\bamigo\b|¿|¡)/i.test(lower)) {
    return 'es-ES';
  }
  // French
  if (/(\bbonjour\b|\bmerci\b|\bcomment\b|\bca\s+va\b|\boui\b|\bnon\b|\bsalut\b|\bs'il\s+vous\s+plait\b)/i.test(lower)) {
    return 'fr-FR';
  }
  // German
  if (/(\bhallo\b|\bdanke\b|\bwie\s+geht\b|\bguten\b|\bmorgen\b|\btschuss\b|\bbitte\b)/i.test(lower)) {
    return 'de-DE';
  }
  // Portuguese
  if (/(\bola\b|\bobrigado\b|\bobrigada\b|\bcomo\b|\btudo\b|\bbem\b|\bvoce\b)/i.test(lower)) {
    return 'pt-BR';
  }
  // Italian
  if (/(\bciao\b|\bgrazie\b|\bcome\s+stai\b|\bbuongiorno\b|\bper\s+favore\b)/i.test(lower)) {
    return 'it-IT';
  }
  // Hinglish
  if (/(kaisa|kaise|namaste|shukriya|aaj|apka|aapka|shubh|aap|kya|haan|nahi)/i.test(lower)) {
    return 'hi-IN';
  }

  return 'en-US';
}

/**
 * Converts raw 16-bit PCM little-endian audio bytes into a valid WAV Blob URL
 */
function pcmToWavBlobUrl(base64Pcm: string, sampleRate = 24000, numChannels = 1): string {
  const binary = atob(base64Pcm);
  const pcmLen = binary.length;
  const buffer = new ArrayBuffer(44 + pcmLen);
  const view = new DataView(buffer);

  function writeString(v: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmLen, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcmLen, true);

  const pcmBytes = new Uint8Array(buffer, 44);
  for (let i = 0; i < pcmLen; i++) {
    pcmBytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * Synthesizes PCM audio through AudioContext for instant, zero-restriction auto-play.
 */
function playPcmAudioContext(
  base64Pcm: string,
  sampleRate = 24000,
  thisId: number,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const binary = atob(base64Pcm);
    const pcmLen = binary.length;
    const numSamples = Math.floor(pcmLen / 2);
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    const dataView = new DataView(new ArrayBuffer(pcmLen));
    for (let i = 0; i < pcmLen; i++) {
      dataView.setUint8(i, binary.charCodeAt(i));
    }

    for (let i = 0; i < numSamples; i++) {
      const sample = dataView.getInt16(i * 2, true);
      channelData[i] = sample / (sample < 0 ? 32768 : 32767);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    currentSourceNode = source;

    source.onended = () => {
      if (currentUtteranceId === thisId) {
        isSpeakingActiveState = false;
        currentSourceNode = null;
      }
      onEnd?.();
    };

    isSpeakingActiveState = true;
    onStart?.();
    source.start(0);
    return true;
  } catch (err) {
    console.warn('[Speech] AudioContext playback warning:', err);
    return false;
  }
}

function getAuthHeadersForSpeech(): Record<string, string> {
  try {
    const rawSession = localStorage.getItem('daily_companion_session_user');
    if (rawSession) {
      const parsed = decryptSync<any>(rawSession, 'session_sec_key', JSON.parse(rawSession));
      if (parsed?.uid) {
        const token = parsed.token || `sat_${parsed.uid}_speech`;
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Auth-Token': token,
          'X-User-Id': parsed.uid,
        };
      }
    }
  } catch {}
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer guest_token',
    'X-User-Auth-Token': 'guest_token',
    'X-User-Id': 'guest',
  };
}

export function speakMessage(
  text: string,
  preferredLang?: VoiceLanguageSetting,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): void {
  // Always stop previous speech and ensure audio context is active
  stopSpeech();
  unlockAudio();

  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText) {
    onEnd?.();
    return;
  }

  const thisId = ++currentUtteranceId;
  const activeLangSetting = preferredLang || getVoiceLanguageSetting();
  const emotionalTone = detectEmotionalTone(cleanedText);
  const speedMultiplier = getSpeedMultiplier();

  // Try Server-Side High Quality Neural TTS First (Gemini Flash Neural TTS)
  const ttsUrl = getApiUrl('/api/tts');

  fetch(ttsUrl, {
    method: 'POST',
    headers: getAuthHeadersForSpeech(),
    body: JSON.stringify({
      text: cleanedText,
      voice: 'Kore',
      emotion: emotionalTone,
      speedRate: speedMultiplier,
    }),
  })
    .then(async (res) => {
      if (currentUtteranceId !== thisId) return;
      if (!res.ok) throw new Error('Neural TTS HTTP Error');
      const data = await res.json();
      if (!data.audio) throw new Error('No audio returned');

      // Attempt 1: Web Audio API (AudioContext) for zero-latency, unrestricted auto-play
      if (data.mimeType?.includes('pcm')) {
        const played = playPcmAudioContext(data.audio, 24000, thisId, onStart, onEnd);
        if (played) return;
      }

      // Attempt 2: HTMLAudioElement with WAV Blob
      let audioUrl = '';
      if (data.mimeType?.includes('pcm')) {
        audioUrl = pcmToWavBlobUrl(data.audio, 24000, 1);
      } else {
        audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audio}`;
      }

      currentAudioObjectUrl = audioUrl.startsWith('blob:') ? audioUrl : null;
      const audio = new Audio(audioUrl);
      currentAudioElement = audio;

      // Adjust HTMLAudioElement playback rate based on speed settings
      if (speedMultiplier !== 1.0) {
        audio.playbackRate = speedMultiplier;
      }

      audio.onplay = () => {
        if (currentUtteranceId !== thisId) return;
        isSpeakingActiveState = true;
        onStart?.();
      };

      audio.onended = () => {
        if (currentUtteranceId === thisId) {
          isSpeakingActiveState = false;
          currentAudioElement = null;
        }
        onEnd?.();
      };

      audio.onerror = () => {
        if (currentUtteranceId !== thisId) return;
        currentAudioElement = null;
        fallbackToWebSpeech(cleanedText, activeLangSetting, thisId, onStart, onEnd, onError);
      };

      try {
        await audio.play();
      } catch (playErr) {
        if (currentUtteranceId !== thisId) return;
        currentAudioElement = null;
        fallbackToWebSpeech(cleanedText, activeLangSetting, thisId, onStart, onEnd, onError);
      }
    })
    .catch(() => {
      if (currentUtteranceId !== thisId) return;
      fallbackToWebSpeech(cleanedText, activeLangSetting, thisId, onStart, onEnd, onError);
    });
}

/**
 * Fallback Web Speech API synthesis for offline or fallback scenarios
 */
function fallbackToWebSpeech(
  cleanedText: string,
  preferredLang: VoiceLanguageSetting | undefined,
  thisId: number,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.();
    return;
  }

  const langSetting = preferredLang || getVoiceLanguageSetting();
  let targetLang = 'en-US';

  if (langSetting && langSetting !== 'auto') {
    const matched = SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === langSetting);
    targetLang = matched ? matched.locale : 'en-US';
  } else {
    targetLang = detectTextLanguage(cleanedText);
  }

  const emotion = detectEmotionalTone(cleanedText);
  const speedMultiplier = getSpeedMultiplier();

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  utterance.lang = targetLang;

  // Emotional rate & pitch tuning
  if (emotion === 'softer') {
    utterance.rate = 0.88 * speedMultiplier;
    utterance.pitch = 0.95;
  } else if (emotion === 'upbeat') {
    utterance.rate = 1.08 * speedMultiplier;
    utterance.pitch = 1.08;
  } else {
    utterance.rate = 0.98 * speedMultiplier;
    utterance.pitch = 1.0;
  }

  const setVoice = () => {
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const targetBase = targetLang.slice(0, 2).toLowerCase();
        const matchedVoices = voices.filter(
          (v) =>
            v.lang.toLowerCase().replace('_', '-') === targetLang.toLowerCase() ||
            v.lang.toLowerCase().startsWith(targetBase)
        );
        const pool = matchedVoices.length > 0 ? matchedVoices : voices;
        const premiumKeywords = [
          'neural',
          'natural',
          'online (natural)',
          'swara',
          'aria',
          'google',
          'samantha',
          'veena',
          'female',
          'monica',
          'zira',
          'yelda',
          'kyoko',
          'sin-ji',
          'amélie',
          'lucia',
          'victoria',
        ];
        let selected = pool.find((v) => {
          const nameLower = v.name.toLowerCase();
          return (nameLower.includes('neural') || nameLower.includes('natural')) && nameLower.includes('female');
        });
        if (!selected) {
          selected = pool.find((v) => premiumKeywords.some((kw) => v.name.toLowerCase().includes(kw)));
        }
        utterance.voice = selected || pool[0];
      }
    } catch (e) {}
  };

  setVoice();

  utterance.onstart = () => {
    if (currentUtteranceId !== thisId) return;
    isSpeakingActiveState = true;
    onStart?.();
  };

  utterance.onend = () => {
    if (currentUtteranceId === thisId) {
      isSpeakingActiveState = false;
    }
    onEnd?.();
  };

  utterance.onerror = () => {
    if (currentUtteranceId === thisId) {
      isSpeakingActiveState = false;
    }
    onError?.();
  };

  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    isSpeakingActiveState = false;
    onError?.();
  }
}

