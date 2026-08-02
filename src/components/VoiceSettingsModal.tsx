import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sparkles, Key, CheckCircle2, AlertCircle, Info, X, Zap, Radio, Mic, Globe } from 'lucide-react';
import {
  stopSpeech,
  speakMessage,
  getVoiceLanguageSetting,
  setVoiceLanguageSetting,
  getVoiceRateSetting,
  setVoiceRateSetting,
  VoiceLanguageSetting,
  VoiceSpeedSetting,
  SUPPORTED_VOICE_LANGUAGES,
} from '../utils/speech';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAutoVoiceMuted: boolean;
  onToggleAutoVoiceMute: () => void;
  wakeWordEnabled?: boolean;
  onToggleWakeWord?: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  isAutoVoiceMuted,
  onToggleAutoVoiceMute,
  wakeWordEnabled,
  onToggleWakeWord,
}) => {
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean | null>(null);
  const [hasSarvamKey, setHasSarvamKey] = useState<boolean | null>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [selectedLang, setSelectedLang] = useState<VoiceLanguageSetting>(getVoiceLanguageSetting());
  const [selectedSpeed, setSelectedSpeed] = useState<VoiceSpeedSetting>(getVoiceRateSetting());

  useEffect(() => {
    if (isOpen) {
      setSelectedLang(getVoiceLanguageSetting());
      setSelectedSpeed(getVoiceRateSetting());
      fetch('/api/health')
        .then((res) => res.json())
        .then((data) => {
          setHasGeminiKey(!!data.hasGeminiKey);
          setHasSarvamKey(!!data.hasSarvamKey);
        })
        .catch(() => {
          setHasGeminiKey(false);
          setHasSarvamKey(false);
        });
    }
  }, [isOpen]);

  const handleSpeedChange = (speed: VoiceSpeedSetting) => {
    setSelectedSpeed(speed);
    setVoiceRateSetting(speed);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as VoiceLanguageSetting;
    setSelectedLang(newLang);
    setVoiceLanguageSetting(newLang);
  };

  const handleTestVoice = () => {
    setIsTestingVoice(true);
    let samplePhrase = "Hello! I am your AI companion Aria. Speech test complete!";

    if (selectedLang === 'spanish') samplePhrase = "¡Hola! Soy Aria, tu compañera de IA. ¡Prueba de voz completada!";
    else if (selectedLang === 'french') samplePhrase = "Bonjour! Je suis Aria, votre compagne IA. Test vocal réussi!";
    else if (selectedLang === 'hindi') samplePhrase = "Namaste! Main aapki AI companion Aria hoon. High quality voice test complete!";
    else if (selectedLang === 'german') samplePhrase = "Hallo! Ich bin Aria, deine KI-Begleiterin. Sprachtest erfolgreich!";
    else if (selectedLang === 'arabic') samplePhrase = "مرحبا! أنا آريا، رفيقتك الذكية. اكتمل اختبار الصوت بنجاح!";
    else if (selectedLang === 'portuguese') samplePhrase = "Olá! Eu sou a Aria, sua companheira de IA. Teste de voz concluído!";
    else if (selectedLang === 'mandarin') samplePhrase = "你好！我是你的AI伴侣Aria。语音测试完成！";
    else if (selectedLang === 'japanese') samplePhrase = "こんにちは！私はAIパートナーのアリアです。音声テスト完了！";
    else if (selectedLang === 'russian') samplePhrase = "Привет! Я Ария, твой ИИ-компаньон. Голосовой тест завершен!";
    else if (selectedLang === 'bengali') samplePhrase = "হ্যালো! আমি আপনার এআই সঙ্গী আরিয়া। ভয়েস টেস্ট সম্পন্ন হয়েছে!";
    else if (selectedLang === 'tamil') samplePhrase = "வணக்கம்! நான் உங்கள் AI தோழி ஆரியா. குரல் சோதனை முடிந்தது!";

    speakMessage(
      samplePhrase,
      selectedLang,
      () => setIsTestingVoice(true),
      () => setIsTestingVoice(false),
      () => setIsTestingVoice(false)
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Voice & Language Settings</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Speech Output & Global Languages</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preferred Language Selector */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Preferred Voice Language
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select Aria's spoken language or keep Auto to match your input language
            </p>

            <div className="relative mt-1">
              <select
                value={selectedLang}
                onChange={handleLanguageChange}
                className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Voice Speed Control */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Voice Speaking Speed
              </span>
              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-300 uppercase">
                {selectedSpeed === 'slow' ? 'Slow (0.85x)' : selectedSpeed === 'fast' ? 'Fast (1.2x)' : 'Normal (1.0x)'}
              </span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Adjust speech tempo for comfort and easy listening
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['slow', 'normal', 'fast'] as VoiceSpeedSetting[]).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => handleSpeedChange(spd)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition capitalize cursor-pointer border ${
                    selectedSpeed === spd
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {spd === 'slow' ? '🐢 Slow' : spd === 'normal' ? '⚡ Normal' : '🚀 Fast'}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Voice Playback Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Auto-Play AI Voice Responses
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically speak Aria's text replies as soon as they arrive
              </p>
            </div>
            <button
              onClick={onToggleAutoVoiceMute}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                !isAutoVoiceMuted
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {!isAutoVoiceMuted ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>OFF</span>
                </>
              )}
            </button>
          </div>

          {/* Wake Word Listening Toggle ("Hey Ferio" / "Ferio") */}
          {onToggleWakeWord !== undefined && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Wake Word Listening ("Hey Ferio")
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Say "Hey Ferio" or "Ferio" to activate voice assistant
                  </p>
                </div>
                <button
                  onClick={onToggleWakeWord}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    wakeWordEnabled
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {wakeWordEnabled ? (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>ACTIVE</span>
                    </>
                  ) : (
                    <span>OFF</span>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-indigo-700 dark:text-indigo-300 leading-tight bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">
                🔒 Privacy Notice: Requires microphone permissions. Status indicator shows when active.
              </p>
            </div>
          )}

          {/* Voice Engine Status Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Voice Engine Status
              </span>
              {hasSarvamKey ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Sarvam AI Active
                </span>
              ) : hasGeminiKey ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Gemini Studio Neural Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  <AlertCircle className="w-3 h-3" /> Device Voice Fallback
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {hasGeminiKey
                ? 'Gemini Neural TTS is active with full multilingual speech generation in 15+ world languages!'
                : 'Currently using browser speech fallback. Configure GEMINI_API_KEY for neural studio voice.'}
            </p>

            <button
              onClick={handleTestVoice}
              disabled={isTestingVoice}
              className="mt-1 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isTestingVoice ? 'Playing Sample Voice...' : 'Test Selected Language Voice'}</span>
            </button>
          </div>

          {/* Multilingual Support Note */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 bg-slate-100 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              Aria automatically detects whatever language you speak or type (English, Spanish, French, German, Arabic, Japanese, Hindi, Hinglish, Portuguese, Russian, Chinese, etc.) and responds fluently in natural, everyday conversational style.
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

