import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Star,
  Trash2,
  Bot,
  User,
  Heart,
  Compass,
  Zap,
  PhoneCall,
  Smile,
  CheckCheck,
  RotateCcw,
  AlertCircle,
  Settings,
  MessageSquare,
  Wand2,
  Pencil,
  ChevronDown,
  Check,
  X,
  Search,
} from 'lucide-react';
import { ChatMessage, ChatThread, CompanionConfig, PersonaMode, UserProfile, ChatMode, EmergencyContact } from '../types';
import { speakMessage, stopSpeech, unlockAudio, getVoiceLanguageSetting, SUPPORTED_VOICE_LANGUAGES } from '../utils/speech';
import { hasVoiceConsent, savePrivacyConsent } from '../utils/privacyConsent';
import { parseVoiceCommand, ParsedAppCommand } from '../utils/appControl';
import { AppControlModal } from './AppControlModal';
import { PinSecurityModal } from './PinSecurityModal';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import { AppIcon } from './AppIcon';
import { EmergencyLocationShare } from './EmergencyLocationShare';
import { AriaStudio } from './AriaStudio';
import { FormattedMessage } from './FormattedMessage';
import { ChatContactPicker } from './ChatContactPicker';

interface ChatTabProps {
  messages: ChatMessage[];
  threads: ChatThread[];
  activeThreadId: string;
  onSendMessage: (
    text: string,
    options?: {
      threadId?: string;
      imageUrl?: string;
      inlineImage?: { data: string; mimeType: string };
      audioUrl?: string;
      audioDuration?: number;
      isVoiceNote?: boolean;
    }
  ) => Promise<void>;
  onClearHistory: (threadId?: string) => void;
  onToggleStarMessage: (id: string) => void;
  onTogglePinMessage?: (id: string) => void;
  onDeleteMessage?: (id: string) => void;
  onEditMessage?: (id: string, newText: string) => void;
  onReactToMessage?: (id: string, emoji: string) => void;
  companion: CompanionConfig;
  onUpdatePersona: (persona: PersonaMode) => void;
  userProfile: UserProfile;
  onUpdateUserProfile?: (profile: UserProfile) => void;
  onUpdateEmergencyContacts?: (contacts: EmergencyContact[]) => void;
  isGenerating: boolean;
  onStartVoiceCall: () => void;
  onCreateThread: (title: string, category?: string, icon?: string, initialGreeting?: string) => void;
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onExportThread: (threadId: string) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  messages,
  threads,
  activeThreadId,
  onSendMessage,
  onClearHistory,
  onToggleStarMessage,
  onTogglePinMessage,
  onDeleteMessage,
  onEditMessage,
  onReactToMessage,
  companion,
  onUpdatePersona,
  userProfile,
  onUpdateUserProfile,
  onUpdateEmergencyContacts,
  isGenerating,
  onStartVoiceCall,
  onCreateThread,
  onSelectThread,
  onDeleteThread,
  onExportThread,
}) => {
  const [chatMode, setChatMode] = useState<ChatMode>('quick');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [micLang, setMicLang] = useState<'hi-IN' | 'en-US' | 'auto'>('auto');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [showVoiceSettingsModal, setShowVoiceSettingsModal] = useState(false);
  const [isAutoVoiceMuted, setIsAutoVoiceMuted] = useState<boolean>(() => {
    return localStorage.getItem('daily_companion_voice_muted') === 'true';
  });

  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 120);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const lastAutoSpokenMsgIdRef = useRef<string | null>(
    messages.length > 0 ? messages[messages.length - 1].id : null
  );

  const recognitionRef = useRef<any>(null);
  const isListeningMicRef = useRef<boolean>(false);
  const isAISpeakingRef = useRef<boolean>(false);
  const isGeneratingRef = useRef<boolean>(isGenerating);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceAutoSendTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [detectedAppCommand, setDetectedAppCommand] = useState<ParsedAppCommand | null>(null);
  const [showPinSecurityModal, setShowPinSecurityModal] = useState<boolean>(false);
  const [pinSecurityMessage, setPinSecurityMessage] = useState<string>(
    "I don't recognize this voice. Please unlock the app normally to continue."
  );

  useEffect(() => {
    isListeningMicRef.current = isListeningMic;
  }, [isListeningMic]);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
    // When AI starts generating, pause mic input so it doesn't capture background noise
    if (isGenerating) {
      if (silenceAutoSendTimerRef.current) {
        clearTimeout(silenceAutoSendTimerRef.current);
        silenceAutoSendTimerRef.current = null;
      }
      stopSpeechRecognitionInstance();
    } else {
      // When AI finishes generating, if continuous voice mode is active, check after a short delay to ensure mic resumes if AI is not speaking
      if (isListeningMicRef.current) {
        const timer = setTimeout(() => {
          if (isListeningMicRef.current && !isAISpeakingRef.current && !isGeneratingRef.current) {
            console.log('[QuickChat Mic] AI finished generating and no active speech -> Auto-resuming mic listening');
            startContinuousRecognition();
          }
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [isGenerating]);

  const stopSpeechRecognitionInstance = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
  };

  const stopContinuousMic = () => {
    isListeningMicRef.current = false;
    setIsListeningMic(false);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (silenceAutoSendTimerRef.current) {
      clearTimeout(silenceAutoSendTimerRef.current);
      silenceAutoSendTimerRef.current = null;
    }
    stopSpeechRecognitionInstance();
  };

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Auto-stop after 90 seconds of total silence/inactivity to protect battery & privacy
    inactivityTimerRef.current = setTimeout(() => {
      console.log('[QuickChat Mic] 90s silence timeout reached. Stopping continuous mic.');
      stopContinuousMic();
    }, 90000);
  };

  const startContinuousRecognition = () => {
    if (!isListeningMicRef.current || isAISpeakingRef.current || isGeneratingRef.current) {
      console.log(`[QuickChat Mic] Skipping start: active=${isListeningMicRef.current}, aiSpeaking=${isAISpeakingRef.current}, generating=${isGeneratingRef.current}`);
      return;
    }
    if (typeof window === 'undefined') return;
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;

    try {
      stopSpeechRecognitionInstance();

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      const preferred = getVoiceLanguageSetting();
      if (micLang === 'hi-IN') {
        recognition.lang = 'hi-IN';
      } else if (micLang === 'en-US') {
        recognition.lang = 'en-US';
      } else if (preferred !== 'auto') {
        const langInfo = SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === preferred);
        recognition.lang = langInfo?.locale || 'en-US';
      } else {
        recognition.lang =
          typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
      }

      recognition.onstart = () => {
        console.log('[QuickChat Mic] Speech recognition active and listening');
        setIsListeningMic(true);
        isListeningMicRef.current = true;
        resetInactivityTimer();
      };

      recognition.onresult = (event: any) => {
        resetInactivityTimer();
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        const spoken = (finalText || interimText).trim();
        if (spoken) {
          setInputText(spoken);
        }

        // If a final result segment was received in continuous mic mode, schedule auto-send after silence pause (1.4s)
        if (finalText.trim()) {
          if (silenceAutoSendTimerRef.current) {
            clearTimeout(silenceAutoSendTimerRef.current);
          }
          silenceAutoSendTimerRef.current = setTimeout(() => {
            if (isListeningMicRef.current && !isAISpeakingRef.current && !isGeneratingRef.current) {
              const textToSend = finalText.trim();
              if (textToSend) {
                console.log('[QuickChat Mic] Silence auto-send triggering for text:', textToSend);
                setInputText('');
                unlockAudio();
                const appCmd = parseVoiceCommand(textToSend);
                if (appCmd) {
                  setDetectedAppCommand(appCmd);
                } else {
                  stopSpeechRecognitionInstance();
                  onSendMessage(textToSend, { threadId: activeThreadId });
                }
              }
            }
          }, 1400);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('[QuickChat Mic] Speech recognition error event:', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          stopContinuousMic();
          alert('Microphone access was denied or is unavailable.');
        } else if (isListeningMicRef.current && !isAISpeakingRef.current && !isGeneratingRef.current) {
          // Non-fatal error (no-speech, network, aborted) -> attempt auto-restart
          setTimeout(() => {
            if (isListeningMicRef.current && !isAISpeakingRef.current && !isGeneratingRef.current) {
              startContinuousRecognition();
            }
          }, 400);
        }
      };

      recognition.onend = () => {
        console.log('[QuickChat Mic] Speech recognition session ended');
        // Auto-restart if user still has continuous mic mode active and AI is not busy
        if (isListeningMicRef.current && !isAISpeakingRef.current && !isGeneratingRef.current) {
          setTimeout(() => {
            if (isListeningMicRef.current && !isAISpeakingRef.current && !isGeneratingRef.current) {
              startContinuousRecognition();
            }
          }, 300);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[QuickChat Mic] Start exception:', err);
    }
  };

  useEffect(() => {
    return () => {
      stopContinuousMic();
    };
  }, []);

  const toggleAutoVoiceMute = () => {
    const nextVal = !isAutoVoiceMuted;
    setIsAutoVoiceMuted(nextVal);
    localStorage.setItem('daily_companion_voice_muted', String(nextVal));
    if (nextVal) {
      stopSpeech();
    }
  };

  useEffect(() => {
    if (chatMode === 'quick') {
      scrollToBottom();
    }
  }, [messages, isGenerating, chatMode]);

  // Auto-play voice when a new AI message arrives if auto voice is enabled or continuous mic mode is active
  useEffect(() => {
    if (messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (
      latest.sender === 'ai' &&
      !latest.isError &&
      (isListeningMicRef.current || !isAutoVoiceMuted) &&
      latest.id !== lastAutoSpokenMsgIdRef.current
    ) {
      lastAutoSpokenMsgIdRef.current = latest.id;
      handleSpeakText(latest.id, latest.text);
    }
  }, [messages, isAutoVoiceMuted]);

  const activeSearchQuery = searchQuery.trim().toLowerCase();

  const filteredQuickMessages = messages.filter((m) => {
    if (!activeSearchQuery) return true;
    const txt = (m.text || '').toLowerCase();
    if (txt.includes(activeSearchQuery)) return true;
    const tokens = activeSearchQuery.split(/\s+/).filter(Boolean);
    return tokens.length > 0 && tokens.every((t) => txt.includes(t));
  });

  const handleSearchSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    console.log('[QuickChat Search] Form submitted with query:', searchQuery.trim());
    console.log(`[QuickChat Search] Total messages evaluated: ${messages.length}, Matched messages: ${filteredQuickMessages.length}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    if (silenceAutoSendTimerRef.current) {
      clearTimeout(silenceAutoSendTimerRef.current);
      silenceAutoSendTimerRef.current = null;
    }

    unlockAudio();

    const textToSend = inputText;
    setInputText('');

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert(
        "You're currently offline. Connect to the internet to chat with AI or view your past check-ins & history anytime!"
      );
      return;
    }

    const appCmd = parseVoiceCommand(textToSend);
    if (appCmd) {
      setDetectedAppCommand(appCmd);
      return;
    }

    await onSendMessage(textToSend, { threadId: activeThreadId });
  };

  // Quick Prompt Pills
  const quickPrompts = [
    'YouTube pe lofi music search karo',
    'Open Maps and find pizza near me',
    'Rahul ko WhatsApp pe message bhejo hello',
    'Play Arijit Singh gaana bajao',
  ];

  // Speech Recognition (Web Speech API)
  const handleMicToggle = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (!hasVoiceConsent()) {
      const grant = confirm(
        'Voice Recognition Consent Required:\n\nVoice recognition is currently disabled in your privacy settings. Would you like to grant consent and enable voice input now?'
      );
      if (grant) {
        savePrivacyConsent({ voiceRecognitionConsent: true });
      } else {
        return;
      }
    }

    if (isListeningMicRef.current) {
      stopContinuousMic();
    } else {
      setIsAutoVoiceMuted(false);
      localStorage.setItem('daily_companion_voice_muted', 'false');
      isListeningMicRef.current = true;
      setIsListeningMic(true);
      startContinuousRecognition();
    }
  };

  const toggleMicLang = () => {
    if (micLang === 'auto') setMicLang('hi-IN');
    else if (micLang === 'hi-IN') setMicLang('en-US');
    else setMicLang('auto');
  };

  const handleSpeakText = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      stopSpeech();
      setSpeakingMsgId(null);
      isAISpeakingRef.current = false;
      if (isListeningMicRef.current && !isGeneratingRef.current) {
        startContinuousRecognition();
      }
      return;
    }

    // Immediately mark AI as speaking and stop mic while TTS audio is fetching/playing
    isAISpeakingRef.current = true;
    stopSpeechRecognitionInstance();

    const preferred = getVoiceLanguageSetting();
    speakMessage(
      text,
      preferred,
      () => {
        setSpeakingMsgId(msgId);
        isAISpeakingRef.current = true;
        stopSpeechRecognitionInstance();
      },
      () => {
        console.log('[QuickChat TTS] Speech playback finished -> Resuming mic');
        setSpeakingMsgId(null);
        isAISpeakingRef.current = false;
        if (isListeningMicRef.current && !isGeneratingRef.current) {
          setTimeout(() => {
            if (isListeningMicRef.current && !isAISpeakingRef.current && !isGeneratingRef.current) {
              startContinuousRecognition();
            }
          }, 350);
        }
      },
      () => {
        console.warn('[QuickChat TTS] Speech playback error or cancelled -> Resuming mic');
        setSpeakingMsgId(null);
        isAISpeakingRef.current = false;
        if (isListeningMicRef.current && !isGeneratingRef.current) {
          setTimeout(() => {
            if (isListeningMicRef.current && !isAISpeakingRef.current && !isGeneratingRef.current) {
              startContinuousRecognition();
            }
          }, 350);
        }
      }
    );
  };

  const personasList: { id: PersonaMode; label: string; icon: any }[] = [
    { id: 'adaptive', label: 'Auto-Blend', icon: Sparkles },
    { id: 'empathetic', label: 'Empathetic', icon: Heart },
    { id: 'coach', label: 'Life Coach', icon: Zap },
    { id: 'mindful', label: 'Mindful', icon: Compass },
    { id: 'creative', label: 'Creative', icon: Sparkles },
    { id: 'calm', label: 'Calm', icon: Smile },
  ];

  const currentHour = new Date().getHours();
  const timeOfDayInfo =
    currentHour >= 5 && currentHour < 12
      ? { label: 'Morning Energy', icon: '🌅' }
      : currentHour >= 12 && currentHour < 18
      ? { label: 'Afternoon Focus', icon: '☀️' }
      : currentHour >= 18 && currentHour < 22
      ? { label: 'Evening Reflection', icon: '🌆' }
      : { label: 'Quiet Night', icon: '🌙' };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] pb-16 max-w-md mx-auto bg-slate-100/60 dark:bg-slate-950/80 transition-colors relative">
      {/* Top Segmented Mode Toggle: Quick Chat vs Aria Studio */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 shrink-0 flex justify-center shadow-xs">
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center gap-1 w-full max-w-xs shadow-inner">
          <button
            type="button"
            onClick={() => setChatMode('quick')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              chatMode === 'quick'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Quick Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setChatMode('studio')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              chatMode === 'studio'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Aria Studio</span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wide">
              STUDIO
            </span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {chatMode === 'studio' ? (
        <AriaStudio
          messages={messages}
          threads={threads}
          activeThreadId={activeThreadId}
          onSendMessage={onSendMessage}
          onClearHistory={onClearHistory}
          onToggleStarMessage={onToggleStarMessage}
          onTogglePinMessage={onTogglePinMessage}
          onDeleteMessage={onDeleteMessage}
          onEditMessage={onEditMessage}
          onReactToMessage={onReactToMessage}
          companion={companion}
          onUpdatePersona={onUpdatePersona}
          userProfile={userProfile}
          isGenerating={isGenerating}
          onStartVoiceCall={onStartVoiceCall}
          onCreateThread={onCreateThread}
          onSelectThread={onSelectThread}
          onDeleteThread={onDeleteThread}
          onExportThread={onExportThread}
          onUpdateUserProfile={onUpdateUserProfile}
          onUpdateEmergencyContacts={onUpdateEmergencyContacts}
        />
      ) : (
        /* Quick Chat View (Simple everyday check-in) */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Persona Mode Switcher Bar */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-2 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-1 shrink-0">
              Persona:
            </span>
            {personasList.map((p) => {
              const Icon = p.icon;
              const isActive = companion.personaMode === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onUpdatePersona(p.id)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Chat Header Actions Bar */}
          <div className="px-4 py-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {companion.name}
              </span>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                <span>{timeOfDayInfo.icon}</span>
                <span>{timeOfDayInfo.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  showSearch
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Search Quick Chat Messages"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={toggleAutoVoiceMute}
                className={`px-2 py-1 rounded-full text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  isAutoVoiceMuted
                    ? 'text-slate-400 hover:text-slate-600'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isAutoVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onStartVoiceCall}
                className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer text-xs flex items-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call</span>
              </button>

              {messages.length > 0 && (
                <button
                  onClick={() => onClearHistory(activeThreadId)}
                  title="Clear Chat History"
                  className="text-slate-400 hover:text-rose-500 transition cursor-pointer p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Chat Search Bar */}
          {showSearch && (
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <form onSubmit={handleSearchSubmit} className="relative">
                <button
                  type="submit"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                  title="Submit Search"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    console.log('[QuickChat Search] Input value typed:', val);
                    setSearchQuery(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      console.log('[QuickChat Search] Enter key pressed on input with query:', searchQuery);
                      handleSearchSubmit(e);
                    }
                  }}
                  placeholder="Search quick chat messages..."
                  className="w-full text-xs pl-8 pr-8 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      console.log('[QuickChat Search] Cleared search query');
                      setSearchQuery('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
              {searchQuery.trim() && (
                <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                  <span>
                    Found <strong>{filteredQuickMessages.length}</strong> matching message(s)
                  </span>
                  <button
                    onClick={() => {
                      console.log('[QuickChat Search] Clicked clear search button');
                      setSearchQuery('');
                    }}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Chat Stream */}
          <div onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3.5 relative">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-4">
                <AppIcon size="xl" style={companion.avatarStyle} className="shadow-md" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Quick Chat with {companion.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  Fast everyday check-ins. Ask general knowledge, share feelings, or switch to Aria Studio for photos & threads!
                </p>
              </div>
            ) : activeSearchQuery && filteredQuickMessages.length === 0 ? (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-500 shadow-2xs">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No matching messages found
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  No messages match "<span className="text-indigo-600 dark:text-indigo-400 font-semibold">{searchQuery.trim()}</span>".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    console.log('[QuickChat Search] Cleared search query from empty result button');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer shadow-xs"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              filteredQuickMessages.map((msg, index, filteredArray) => {
                  const isUser = msg.sender === 'user';
                  const isSpeaking = speakingMsgId === msg.id;
                  const isEditingThis = editingMsgId === msg.id;
                  const isLastMessage = index === filteredArray.length - 1;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                    {!isUser ? (
                      <AppIcon size="sm" style={companion.avatarStyle} className="mt-0.5 shrink-0 shadow-2xs" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs relative space-y-2 ${
                        isUser
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      {/* Editable text vs Formatted Message */}
                      {isEditingThis ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-2 rounded-xl bg-indigo-700 text-white border border-indigo-400 text-xs focus:outline-none"
                            rows={2}
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingMsgId(null)}
                              className="px-2 py-1 rounded-lg bg-indigo-800 text-indigo-200 text-[10px] font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (editingText.trim() && onEditMessage) {
                                  onEditMessage(msg.id, editingText.trim());
                                }
                                setEditingMsgId(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white text-indigo-900 text-[10px] font-bold flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <FormattedMessage content={msg.text} isUser={isUser} />
                      )}

                      {/* Reactions Pills */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {msg.reactions.map((emoji, rIdx) => (
                            <button
                              key={rIdx}
                              type="button"
                              onClick={() => onReactToMessage && onReactToMessage(msg.id, emoji)}
                              className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/80 text-[11px] border border-slate-200 dark:border-slate-600 cursor-pointer hover:scale-105 transition"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="mt-1 pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700">
                        <span className="flex items-center gap-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {msg.isEdited && <span className="text-[9px] opacity-75">(edited)</span>}
                        </span>

                        {!isUser && (
                          <div className="flex items-center gap-1.5">
                            {/* Emoji Reaction Options */}
                            <div className="flex items-center gap-1">
                              {['❤️', '👍', '😊', '💡'].map((e) => (
                                <button
                                  key={e}
                                  type="button"
                                  onClick={() => onReactToMessage && onReactToMessage(msg.id, e)}
                                  className="hover:scale-125 transition text-[11px] cursor-pointer opacity-80 hover:opacity-100"
                                >
                                  {e}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() => handleSpeakText(msg.id, msg.text)}
                              className="text-slate-500 hover:text-indigo-600 flex items-center gap-0.5"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                            </button>
                            <button onClick={() => onToggleStarMessage(msg.id)}>
                              <Star
                                className={`w-3 h-3 ${
                                  msg.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                                }`}
                              />
                            </button>
                          </div>
                        )}

                        {isUser && (
                          <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100">
                            {onEditMessage && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMsgId(msg.id);
                                  setEditingText(msg.text);
                                }}
                                className="hover:text-white p-0.5 rounded transition"
                                title="Edit message"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                            {onDeleteMessage && (
                              <button
                                type="button"
                                onClick={() => onDeleteMessage(msg.id)}
                                className="hover:text-rose-200 p-0.5 rounded transition"
                                title="Delete message"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quick-Reply Suggestion Chips below AI messages */}
                      {!isUser && isLastMessage && (
                        <div className="pt-2 flex flex-wrap gap-1.5">
                          {(msg.suggestions && msg.suggestions.length > 0
                            ? msg.suggestions
                            : ['Tell me more', 'That helps!', 'How does this work?', 'Can you clarify?']
                          ).map((chip, cIdx) => (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => onSendMessage(chip)}
                              className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium transition cursor-pointer hover:scale-102 flex items-center gap-1 shadow-2xs"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                              <span>{chip}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}

            {isGenerating && (
              <div className="flex gap-2 items-center text-xs text-slate-500">
                <AppIcon size="sm" style={companion.avatarStyle} />
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {companion.name} is typing...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Floating Scroll-to-Bottom Button */}
            <AnimatePresence>
              {showScrollBottom && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={scrollToBottom}
                  className="sticky bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-lg flex items-center gap-1 hover:bg-indigo-700 transition cursor-pointer z-20"
                >
                  <ChevronDown className="w-4 h-4 animate-bounce" />
                  <span>Scroll to latest</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-white/70 dark:bg-slate-900/70 border-t border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(prompt)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Quick Chat Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 shadow-lg relative z-20"
          >
            <div className="flex items-center gap-2 w-full">
              {/* Left Action Buttons: Voice Input Mic + Contact Picker */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleMicToggle}
                  title={isListeningMic ? 'Stop voice input' : 'Start voice input'}
                  className={`w-10 h-10 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 border ${
                    isListeningMic
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse ring-2 ring-rose-300'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  {isListeningMic ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>

                <ChatContactPicker
                  userProfile={userProfile}
                  onUpdateUserProfile={onUpdateUserProfile}
                  onUpdateEmergencyContacts={onUpdateEmergencyContacts}
                  messages={messages}
                  threadTitle="Quick Chat"
                  onInsertText={(text) => setInputText((prev) => (prev ? `${prev} ${text}` : text))}
                />
              </div>

              {/* Text Input Field with Send Button inside at the right end */}
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${companion.name}...`}
                  className="w-full text-xs pl-3.5 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isGenerating}
                  title="Send message"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Voice Modals */}
      <AppControlModal command={detectedAppCommand} onClose={() => setDetectedAppCommand(null)} />
      <PinSecurityModal
        isOpen={showPinSecurityModal}
        onClose={() => setShowPinSecurityModal(false)}
        onSuccess={() => setShowPinSecurityModal(false)}
        customMessage={pinSecurityMessage}
      />
      <VoiceSettingsModal
        isOpen={showVoiceSettingsModal}
        onClose={() => setShowVoiceSettingsModal(false)}
        isAutoVoiceMuted={isAutoVoiceMuted}
        onToggleAutoVoiceMute={toggleAutoVoiceMute}
      />
    </div>
  );
};
