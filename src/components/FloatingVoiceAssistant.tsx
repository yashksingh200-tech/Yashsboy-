import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Radio,
  Shield,
  Battery,
  ChevronRight,
  Compass,
  CheckCircle2,
  Moon,
  Sun,
  LogOut,
  Target,
  Smile,
  Info,
} from 'lucide-react';
import { speakMessage, stopSpeech, isSpeechActive } from '../utils/speech';
import { secureFetch } from '../utils/apiClient';
import { CompanionConfig, UserProfile, TabType, MoodCheckin, MoodType } from '../types';
import { ParsedAppCommand } from '../utils/appControl';
import { processVoiceCommand, VoiceCommandResult } from '../utils/voiceCommandEngine';
import { AppControlModal } from './AppControlModal';
import { VoiceCommandsHelpModal } from './VoiceCommandsHelpModal';

interface FloatingVoiceAssistantProps {
  companion: CompanionConfig;
  userProfile: UserProfile;
  activeTab: TabType;
  onNavigateTab: (tab: TabType) => void;
  onAddCheckin: (checkin: MoodCheckin) => void;
  onUpdateUserProfile: (up: UserProfile) => void;
  darkMode: boolean;
  onToggleDarkMode: (forcedState?: boolean) => void;
  onLogout: () => void;
}

export const FloatingVoiceAssistant: React.FC<FloatingVoiceAssistantProps> = ({
  companion,
  userProfile,
  activeTab,
  onNavigateTab,
  onAddCheckin,
  onUpdateUserProfile,
  darkMode,
  onToggleDarkMode,
  onLogout,
}) => {
  // Widget & Overlay state
  const [isOpenOverlay, setIsOpenOverlay] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenQuestion, setSpokenQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [executedFeedback, setExecutedFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedAppCommand, setDetectedAppCommand] = useState<ParsedAppCommand | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // First-Time Voice Control Onboarding Banner State
  const [showVoiceOnboarding, setShowVoiceOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('daily_companion_voice_onboarding_dismissed') !== 'true';
  });

  // Wake Word state & Disclaimer Modal
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(() => {
    return localStorage.getItem('daily_companion_wakeword_enabled') === 'true';
  });
  const [showWakeWordDisclaimer, setShowWakeWordDisclaimer] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);

  // Speech Recognition Refs
  const recognitionRef = useRef<any>(null);
  const wakeRecognitionRef = useRef<any>(null);

  // Initialize Wake Word Listener if enabled
  useEffect(() => {
    if (wakeWordEnabled) {
      startWakeWordListener();
    } else {
      stopWakeWordListener();
    }

    return () => {
      stopWakeWordListener();
    };
  }, [wakeWordEnabled]);

  const startWakeWordListener = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsWakeWordActive(false);
      return;
    }

    try {
      if (wakeRecognitionRef.current) {
        wakeRecognitionRef.current.abort();
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'hi-IN'; // Supports English & Hindi wake words

      rec.onstart = () => {
        setIsWakeWordActive(true);
      };

      rec.onresult = (event: any) => {
        // Crucial Guard: Do NOT trigger wake word if text-to-speech is currently playing out loud!
        if (isSpeechActive()) {
          return;
        }

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase();
          if (
            transcript.includes('hey ferio') ||
            transcript.includes('ferio') ||
            transcript.includes('hello ferio') ||
            transcript.includes('hey aria') ||
            transcript.includes('aria') ||
            transcript.includes('सुनो ferio')
          ) {
            rec.stop();
            setIsWakeWordActive(false);

            // Check Internet Connectivity
            const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

            if (!isOnline) {
              setIsOpenOverlay(true);
              const offlineMsg = "I'm having trouble connecting right now, please check your internet";
              setErrorMessage(offlineMsg);
              speakMessage(offlineMsg, 'auto');
              break;
            }

            setIsOpenOverlay(true);
            speakMessage('Yes? I am listening to your command!', 'auto');
            setTimeout(() => {
              startQuestionListening();
            }, 1200);
            break;
          }
        }
      };

      rec.onerror = () => {
        if (wakeWordEnabled) {
          setTimeout(() => {
            if (wakeWordEnabled && !isListening) {
              try {
                rec.start();
              } catch (e) {}
            }
          }, 3000);
        }
      };

      rec.onend = () => {
        if (wakeWordEnabled && !isListening && !isOpenOverlay) {
          setTimeout(() => {
            try {
              rec.start();
            } catch (e) {}
          }, 1500);
        }
      };

      rec.start();
      wakeRecognitionRef.current = rec;
    } catch (e) {
      setIsWakeWordActive(false);
    }
  };

  const stopWakeWordListener = () => {
    if (wakeRecognitionRef.current) {
      try {
        wakeRecognitionRef.current.abort();
      } catch (e) {}
      wakeRecognitionRef.current = null;
    }
    setIsWakeWordActive(false);
  };

  const handleToggleWakeWordRequest = () => {
    if (!wakeWordEnabled) {
      setShowWakeWordDisclaimer(true);
    } else {
      setWakeWordEnabled(false);
      localStorage.setItem('daily_companion_wakeword_enabled', 'false');
    }
  };

  const handleConfirmWakeWord = () => {
    setShowWakeWordDisclaimer(false);
    setWakeWordEnabled(true);
    localStorage.setItem('daily_companion_wakeword_enabled', 'true');
  };

  const startQuestionListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const msg = 'Speech recognition is not supported in this browser. You can use manual tap controls below.';
      setErrorMessage(msg);
      speakMessage("Speech recognition isn't supported in this browser. Please use manual controls.", 'auto');
      return;
    }

    try {
      stopSpeech();
      stopWakeWordListener();

      // Trigger Haptic Feedback (Vibration)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([25, 35]);
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'hi-IN'; // Captures English, Hindi, and Hinglish spoken commands seamlessly
      if ('noiseSuppression' in rec) {
        (rec as any).noiseSuppression = true;
      }

      setIsListening(true);
      setSpokenQuestion('');
      setAiResponse(null);
      setExecutedFeedback(null);
      setErrorMessage(null);

      rec.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setSpokenQuestion(text);
      };

      rec.onerror = (err: any) => {
        setIsListening(false);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(15);
        }

        if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
          const micErrorMsg = 'Microphone permission denied. Please allow microphone access or use manual tap buttons.';
          setErrorMessage(micErrorMsg);
          if (!isSpeechActive()) {
            speakMessage("Microphone permission was denied. You can use manual buttons below.", 'auto');
          }
        } else if (err.error !== 'no-speech' && !isSpeechActive()) {
          const retryMsg = "I couldn't hear that clearly. Please tap the mic and try again!";
          setErrorMessage(retryMsg);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(15);
        }
        if (wakeWordEnabled) {
          startWakeWordListener();
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      setIsListening(false);
      const permError = 'Microphone access error. Please grant permission or use manual tap controls.';
      setErrorMessage(permError);
      speakMessage("Microphone access error. Please grant permission.", 'auto');
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  // Execute Spoken Voice Command Across Entire App
  const handleExecuteVoiceCommand = async (commandToRun?: string) => {
    const query = commandToRun || spokenQuestion;
    if (!query.trim()) return;

    handleStopListening();
    setIsLoading(true);
    setErrorMessage(null);

    // Process phrase against Unified Voice Command Engine
    const result: VoiceCommandResult = processVoiceCommand(query, userProfile, darkMode);

    if (result.actionType === 'navigate' && result.targetTab) {
      onNavigateTab(result.targetTab);
      setExecutedFeedback(result.spokenConfirmation);
      speakMessage(result.spokenConfirmation, 'auto');
      setIsLoading(false);
      setTimeout(() => setIsOpenOverlay(false), 1200);
      return;
    }

    if (result.actionType === 'start_checkin') {
      onNavigateTab('home');
      setExecutedFeedback(result.spokenConfirmation);
      speakMessage(result.spokenConfirmation, 'auto');
      setIsLoading(false);
      setTimeout(() => setIsOpenOverlay(false), 1200);
      return;
    }

    if (result.actionType === 'set_mood' && result.mood) {
      const todayStr = new Date().toISOString().split('T')[0];
      const newCheckin: MoodCheckin = {
        id: 'chk-voice-' + Date.now(),
        timestamp: new Date().toISOString(),
        dateStr: todayStr,
        mood: result.mood,
        energyLevel: 4,
        note: `Voice command: "${query}"`,
        aiInsight: `Mood set to ${result.mood} via voice action.`,
      };
      onAddCheckin(newCheckin);
      setExecutedFeedback(result.spokenConfirmation);
      speakMessage(result.spokenConfirmation, 'auto');
      setIsLoading(false);
      setTimeout(() => setIsOpenOverlay(false), 1500);
      return;
    }

    if (result.actionType === 'read_goals') {
      setExecutedFeedback(result.spokenConfirmation);
      speakMessage(result.spokenConfirmation, 'auto');
      setIsLoading(false);
      return;
    }

    if (result.actionType === 'add_goal' && result.goalText) {
      const updatedGoals = [...(userProfile.goals || []), result.goalText];
      onUpdateUserProfile({
        ...userProfile,
        goals: updatedGoals,
      });
      setExecutedFeedback(result.spokenConfirmation);
      speakMessage(result.spokenConfirmation, 'auto');
      setIsLoading(false);
      return;
    }

    if (result.actionType === 'toggle_dark_mode' && result.darkModeState !== undefined) {
      onToggleDarkMode(result.darkModeState);
      setExecutedFeedback(result.spokenConfirmation);
      speakMessage(result.spokenConfirmation, 'auto');
      setIsLoading(false);
      return;
    }

    if (result.actionType === 'toggle_notifications' && result.notificationState !== undefined) {
      setExecutedFeedback(result.spokenConfirmation);
      speakMessage(result.spokenConfirmation, 'auto');
      setIsLoading(false);
      return;
    }

    if (result.actionType === 'logout') {
      setExecutedFeedback(result.spokenConfirmation);
      speakMessage(result.spokenConfirmation, 'auto');
      setIsLoading(false);
      setTimeout(() => {
        setIsOpenOverlay(false);
        onLogout();
      }, 1800);
      return;
    }

    if (result.actionType === 'external_app' && result.externalCommand) {
      handleStopListening();
      setIsOpenOverlay(false);
      setDetectedAppCommand(result.externalCommand);
      speakMessage(result.spokenConfirmation, 'auto');
      setIsLoading(false);
      return;
    }

    // Check internet connectivity for AI query
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      const offlineMsg = "I'm having trouble connecting right now, please check your internet";
      setErrorMessage(offlineMsg);
      speakMessage(offlineMsg, 'auto');
      setIsLoading(false);
      return;
    }

    // Unrecognized or General Question -> Query Gemini AI
    try {
      const res = await secureFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: query,
          history: [],
          companionConfig: companion,
          userProfile,
        }),
      });

      if (!res.ok) {
        setExecutedFeedback("Sorry, I didn't understand that command. Try saying 'Open chat', 'Show my progress', or 'Turn on dark mode'.");
        speakMessage("Sorry, I didn't understand that command. Can you try again?", 'auto');
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      const reply = data.text || "I'm here for you! How can I help further?";

      setAiResponse(reply);
      speakMessage(reply, 'auto');
    } catch (err: any) {
      setExecutedFeedback("Sorry, I didn't understand that. You can say 'Open chat', 'Show my progress', or 'Turn on dark mode'.");
      speakMessage("Sorry, I didn't understand that command. Can you try again?", 'auto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseOverlay = () => {
    stopSpeech();
    handleStopListening();
    setIsOpenOverlay(false);
    setSpokenQuestion('');
    setAiResponse(null);
    setExecutedFeedback(null);
    setErrorMessage(null);
  };

  const dismissVoiceOnboarding = () => {
    setShowVoiceOnboarding(false);
    localStorage.setItem('daily_companion_voice_onboarding_dismissed', 'true');
  };

  return (
    <>
      {/* First-Time Voice Control Onboarding Tutorial Banner */}
      <AnimatePresence>
        {showVoiceOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-20 sm:w-80 z-40 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-2xl border border-indigo-500/40 backdrop-blur-md space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <Mic className="w-5 h-5 animate-pulse shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Voice Control Enabled
                </h4>
              </div>
              <button
                type="button"
                onClick={dismissVoiceOnboarding}
                className="text-slate-400 hover:text-white p-0.5 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              You can control the entire app with your voice! Try saying:
              <br />
              <strong className="text-indigo-300">"Open chat"</strong>,{' '}
              <strong className="text-indigo-300">"Show my progress"</strong>, or{' '}
              <strong className="text-indigo-300">"I'm feeling happy"</strong>.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  dismissVoiceOnboarding();
                  setIsOpenOverlay(true);
                  startQuestionListening();
                }}
                className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try Voice Now</span>
              </button>
              <button
                type="button"
                onClick={dismissVoiceOnboarding}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Home / Universal Mic Button (Bottom Right) */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
        {/* Active Wake Word Persistent Badge */}
        {wakeWordEnabled && (
          <div className="bg-slate-900/95 text-white text-[10px] font-medium px-3 py-1.5 rounded-2xl shadow-xl border border-indigo-500/40 flex items-center gap-2 backdrop-blur-md animate-fade-in max-w-xs">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="leading-tight">
              <p className="font-bold text-indigo-300">Ferio Wake-Word Listening</p>
              <p className="text-[9px] text-slate-300">Say "Hey Ferio" or "Ferio"</p>
            </div>
            <button
              type="button"
              onClick={handleToggleWakeWordRequest}
              className="ml-1 text-[9px] font-bold text-slate-400 hover:text-rose-400 transition cursor-pointer underline"
              title="Disable Wake Word"
            >
              Stop
            </button>
          </div>
        )}

        {/* Universal Visible Mic Button for Voice Commands */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setIsOpenOverlay(true);
            setAiResponse(null);
            setExecutedFeedback(null);
            setSpokenQuestion('');
            startQuestionListening();
          }}
          className="relative group p-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-xl shadow-indigo-500/30 border border-white/20 cursor-pointer flex items-center justify-center gap-2"
          title="Voice Command Assistant - Tap to control app by voice"
        >
          <Mic className="w-5 h-5 text-white animate-pulse" />
          <span className="text-xs font-bold pr-1 hidden sm:inline-block">Voice Control</span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
        </motion.button>
      </div>

      {/* Full-App Voice Command Mini Overlay Interface */}
      <AnimatePresence>
        {isOpenOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 overflow-hidden relative space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Full App Voice Control
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Supports Hindi, English & Hinglish commands
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="p-1.5 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition cursor-pointer"
                    title="View All Voice Commands Directory"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseOverlay}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Speech Waveform / Listening Visualizer */}
              <div className="py-4 flex flex-col items-center justify-center text-center space-y-3">
                {isListening ? (
                  <div className="flex flex-col items-center space-y-3">
                    {/* Animated Pulsing Waveform Ring */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-indigo-600/20 dark:bg-indigo-500/20 animate-ping absolute inset-0" />
                      <div className="w-24 h-24 rounded-full bg-purple-500/10 animate-pulse absolute -inset-2" />
                      <button
                        type="button"
                        onClick={handleStopListening}
                        className="relative w-20 h-20 rounded-full bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg cursor-pointer"
                      >
                        <Mic className="w-8 h-8 animate-bounce" />
                      </button>
                    </div>

                    {/* Audio Waveform Bars Simulation */}
                    <div className="flex items-center justify-center gap-1.5 h-6">
                      <span className="w-1 bg-indigo-500 h-3 animate-pulse rounded-full" />
                      <span className="w-1 bg-indigo-600 h-5 animate-pulse delay-75 rounded-full" />
                      <span className="w-1 bg-purple-500 h-6 animate-pulse delay-150 rounded-full" />
                      <span className="w-1 bg-purple-600 h-4 animate-pulse delay-100 rounded-full" />
                      <span className="w-1 bg-indigo-500 h-2 animate-pulse delay-200 rounded-full" />
                    </div>

                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
                      Listening to your voice command...
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startQuestionListening}
                    className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer border border-indigo-200 dark:border-indigo-800 flex items-center gap-2"
                  >
                    <Mic className="w-5 h-5" />
                    <span className="text-xs font-bold">Tap to Speak Voice Command</span>
                  </button>
                )}

                {/* Real-time Spoken Text Transcript Preview */}
                {spokenQuestion && (
                  <div className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Transcript Heard:
                    </p>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      "{spokenQuestion}"
                    </p>
                  </div>
                )}

                {/* Execute Button */}
                {spokenQuestion && !isListening && !isLoading && !executedFeedback && !aiResponse && (
                  <button
                    type="button"
                    onClick={() => handleExecuteVoiceCommand()}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Voice Command & Speak Feedback</span>
                  </button>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold animate-pulse pt-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing voice command across app...</span>
                  </div>
                )}

                {/* Action Executed Feedback Banner */}
                {executedFeedback && (
                  <div className="w-full p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Action Executed & Confirmed</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                      {executedFeedback}
                    </p>
                  </div>
                )}

                {/* AI Text Response Card */}
                {aiResponse && (
                  <div className="w-full p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-left space-y-2">
                    <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Volume2 className="w-4 h-4 animate-pulse text-indigo-600" />
                        <span>Spoken AI Answer</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => speakMessage(aiResponse, 'auto')}
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Replay
                      </button>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                      {aiResponse}
                    </p>
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="w-full p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex flex-col gap-2 text-left">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Spoken Command Shortcut Pills */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Example Spoken Commands:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSpokenQuestion('Open chat');
                      handleExecuteVoiceCommand('Open chat');
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    "Open chat"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSpokenQuestion('Show my progress');
                      handleExecuteVoiceCommand('Show my progress');
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    "Show my progress"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSpokenQuestion("I'm feeling happy");
                      handleExecuteVoiceCommand("I'm feeling happy");
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    "I'm feeling happy"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSpokenQuestion('Read my goals');
                      handleExecuteVoiceCommand('Read my goals');
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    "Read my goals"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSpokenQuestion('Turn on dark mode');
                      handleExecuteVoiceCommand('Turn on dark mode');
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    "Turn on dark mode"
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleToggleWakeWordRequest}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Wake Word: {wakeWordEnabled ? 'ON ("Hey Ferio")' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseOverlay}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wake Word Privacy & Battery Disclaimer Modal */}
      <AnimatePresence>
        {showWakeWordDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Enable "Hey Ferio" Wake Word
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Background Voice Assistant Mode
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                <p className="flex items-start gap-2">
                  <Mic className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>
                    Listens continuously for <strong>"Hey Ferio"</strong> or <strong>"Ferio"</strong> to launch Aria automatically.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Privacy & Permissions:</strong> Only works with explicit user opt-in and granted microphone permissions (Android/iOS privacy rules).
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Radio className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Persistent Notification:</strong> A visible status badge is shown whenever listening is active for full transparency.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Battery className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Background listening uses a small amount of extra battery power.</span>
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowWakeWordDisclaimer(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWakeWord}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Enable Mode
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice App Control Confirmation Modal */}
      <AppControlModal
        command={detectedAppCommand}
        onClose={() => setDetectedAppCommand(null)}
      />

      {/* Voice Commands Directory Help Screen */}
      <VoiceCommandsHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onSelectCommand={(cmd) => {
          setSpokenQuestion(cmd);
          handleExecuteVoiceCommand(cmd);
        }}
      />
    </>
  );
};
