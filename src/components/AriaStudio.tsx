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
  Image as ImageIcon,
  Paperclip,
  Download,
  Search,
  X,
  Layers,
  ChevronDown,
  Plus,
  Play,
  Pause,
  FileText,
  Wand2,
  Brain,
  TrendingUp,
  Bookmark,
  Pencil,
  Check,
  Pin,
  Clock,
  BellRing,
  CheckSquare,
  Wind,
} from 'lucide-react';
import { ChatMessage, ChatThread, CompanionConfig, PersonaMode, UserProfile, EmergencyContact, ScheduledFollowUp } from '../types';
import { speakMessage, stopSpeech, unlockAudio, getVoiceLanguageSetting, SUPPORTED_VOICE_LANGUAGES } from '../utils/speech';
import { hasVoiceConsent, savePrivacyConsent } from '../utils/privacyConsent';
import { parseVoiceCommand, ParsedAppCommand } from '../utils/appControl';
import { AppControlModal } from './AppControlModal';
import { PinSecurityModal } from './PinSecurityModal';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import { AppIcon } from './AppIcon';
import { EmergencyLocationShare } from './EmergencyLocationShare';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { ThreadManagerModal } from './ThreadManagerModal';
import { FormattedMessage } from './FormattedMessage';
import { ChatContactPicker } from './ChatContactPicker';
import { ThreadSummarizerModal } from './ThreadSummarizerModal';
import { ScheduledFollowUpModal } from './ScheduledFollowUpModal';
import { ChecklistWidget, BreathingGuideWidget, MoodChartWidget } from './RichChatWidgets';

interface AriaStudioProps {
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

export const AriaStudio: React.FC<AriaStudioProps> = ({
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
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ dataUrl: string; mimeType: string; rawBase64: string } | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchScope, setSearchScope] = useState<'current' | 'all'>('all');
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showSummarizerModal, setShowSummarizerModal] = useState(false);
  const [showScheduledFollowUpModal, setShowScheduledFollowUpModal] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [reactionOpenMsgId, setReactionOpenMsgId] = useState<string | null>(null);

  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [showVoiceSettingsModal, setShowVoiceSettingsModal] = useState(false);
  const [isAutoVoiceMuted, setIsAutoVoiceMuted] = useState<boolean>(() => {
    return localStorage.getItem('daily_companion_voice_muted') === 'true';
  });
  const lastAutoSpokenMsgIdRef = useRef<string | null>(null);

  // Save explicit snippet to Cross-Thread Memories
  const handleSaveToMemory = (text: string) => {
    if (!onUpdateUserProfile) return;
    const cleanText = text.length > 120 ? text.slice(0, 120) + '...' : text;
    if (userProfile.memories.includes(cleanText)) return;
    onUpdateUserProfile({
      ...userProfile,
      memories: [cleanText, ...userProfile.memories],
    });
    alert('Saved to Aria\'s Cross-Thread Memory Bank!');
  };

  // Schedule a Follow-up
  const handleScheduleFollowUp = (followUp: ScheduledFollowUp) => {
    if (!onUpdateUserProfile) return;
    const existing = userProfile.scheduledFollowUps || [];
    onUpdateUserProfile({
      ...userProfile,
      scheduledFollowUps: [followUp, ...existing],
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 120);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeThread: ChatThread = threads.find((t) => t.id === activeThreadId) || threads[0] || {
    id: 'thread-default',
    title: 'Daily Chats',
    icon: '💬',
    category: 'general',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const normalizeForSearch = (str: string): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s\u0900-\u097F]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Messages belonging to current thread
  const currentThreadMessages = messages.filter((m) => {
    return (!m.threadId && activeThreadId === 'thread-default') || m.threadId === activeThreadId;
  });

  // Explicit Search submit handler & logger
  const handleSearchSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    console.log('[AriaStudio Search] Search submitted with query:', searchQuery.trim());
    console.log(`[AriaStudio Search] Scope: ${searchScope}, total messages matched: ${displayedMessages.length}`);
  };

  // Filter messages for display (active thread + search query + search scope)
  const displayedMessages = messages.filter((m) => {
    const qRaw = searchQuery.trim();
    if (!qRaw) {
      return (!m.threadId && activeThreadId === 'thread-default') || m.threadId === activeThreadId;
    }

    const isMatchingThread =
      searchScope === 'all' ||
      (!m.threadId && activeThreadId === 'thread-default') ||
      m.threadId === activeThreadId;

    if (!isMatchingThread) return false;

    const rawText = (m.text || '').toLowerCase();
    const qLower = qRaw.toLowerCase();
    if (rawText.includes(qLower)) return true;

    const normText = normalizeForSearch(m.text || '');
    const normQ = normalizeForSearch(qRaw);
    if (normQ && normText.includes(normQ)) return true;

    const tokens = qLower.split(/\s+/).filter(Boolean);
    const normTokens = normQ.split(/\s+/).filter(Boolean);

    if (tokens.length > 0 && tokens.every((t) => rawText.includes(t) || normText.includes(t))) {
      return true;
    }

    if (normTokens.length > 0 && normTokens.every((t) => normText.includes(t) || rawText.includes(t))) {
      return true;
    }

    return false;
  });

  // Alias threadMessages to displayedMessages so search filter applies to message stream and counters
  const threadMessages = displayedMessages;

  useEffect(() => {
    scrollToBottom();
  }, [displayedMessages.length, isGenerating]);

  // Auto-play voice when a new AI message arrives if auto voice is enabled
  useEffect(() => {
    if (displayedMessages.length === 0) return;
    const latest = displayedMessages[displayedMessages.length - 1];
    if (
      latest.sender === 'ai' &&
      !latest.isError &&
      !isAutoVoiceMuted &&
      latest.id !== lastAutoSpokenMsgIdRef.current
    ) {
      lastAutoSpokenMsgIdRef.current = latest.id;
      handleSpeakText(latest.id, latest.text);
    }
  }, [displayedMessages, isAutoVoiceMuted]);

  // Handle Photo Attachment Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('Image size should be less than 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const mimeType = file.type;
      const rawBase64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      setSelectedImage({ dataUrl, mimeType, rawBase64 });
    };
    reader.readAsDataURL(file);
  };

  // Submit Text/Image Message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || isGenerating) return;

    unlockAudio();

    const textToSend = inputText.trim();
    const imageToSend = selectedImage;

    setInputText('');
    setSelectedImage(null);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert("You're currently offline. Connect to the internet to chat with Aria in Studio mode!");
      return;
    }

    await onSendMessage(textToSend || 'Here is a photo I shared with you:', {
      threadId: activeThreadId,
      imageUrl: imageToSend?.dataUrl,
      inlineImage: imageToSend
        ? {
            data: imageToSend.rawBase64,
            mimeType: imageToSend.mimeType,
          }
        : undefined,
    });
  };

  // Send Long Voice Note Message
  const handleSendVoiceNote = async (
    audioBlobUrl: string,
    durationSeconds: number,
    transcriptText: string
  ) => {
    setShowVoiceRecorder(false);

    await onSendMessage(transcriptText, {
      threadId: activeThreadId,
      audioUrl: audioBlobUrl,
      audioDuration: durationSeconds,
      isVoiceNote: true,
    });
  };

  // Audio Playback Handler for Voice Notes
  const togglePlayAudio = (msgId: string, audioUrl: string) => {
    if (playingAudioId === msgId) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    audio.play();
    setPlayingAudioId(msgId);

    audio.onended = () => {
      setPlayingAudioId(null);
    };
  };

  // Text-To-Speech
  const handleSpeakText = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      stopSpeech();
      setSpeakingMsgId(null);
      return;
    }

    const preferred = getVoiceLanguageSetting();
    speakMessage(
      text,
      preferred,
      () => setSpeakingMsgId(msgId),
      () => setSpeakingMsgId(null),
      () => setSpeakingMsgId(null)
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

  return (
    <div className="flex-1 flex flex-col min-h-0 max-w-md mx-auto bg-slate-100/80 dark:bg-slate-950 transition-colors">
      {/* Aria Studio Header & Badge */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 p-3 shrink-0 space-y-2 shadow-2xs">
        {/* Studio Badge & Mode Identifier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xs">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Aria Studio
                </span>
                <span className="text-[9px] font-extrabold px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 text-white uppercase shadow-2xs">
                  ADVANCED
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Multimodal AI workspace & multi-topic threads
              </p>
            </div>
          </div>

          {/* Action Tools Header */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSummarizerModal(true)}
              className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold transition cursor-pointer flex items-center gap-1 text-[11px] shadow-2xs"
              title="Summarize this thread with AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Summarize</span>
            </button>

            <button
              type="button"
              onClick={() => setShowScheduledFollowUpModal(true)}
              className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold transition cursor-pointer flex items-center gap-1 text-[11px] shadow-2xs"
              title="Schedule Follow-Up with Aria"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Follow-Up</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMemoryModal(true)}
              className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold transition cursor-pointer flex items-center gap-1 text-[11px] shadow-2xs"
              title="Aria's Deep Memory & Growth Insights"
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Memory</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer ${
                showSearch ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600' : 'bg-slate-100 dark:bg-slate-800'
              }`}
              title="Search Conversations"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onExportThread(activeThreadId)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              title="Export Thread Conversation (.txt)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onStartVoiceCall}
              className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold transition cursor-pointer flex items-center gap-1 text-[11px]"
              title="Start Live Voice Call"
            >
              <PhoneCall className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onClearHistory(activeThreadId)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition cursor-pointer"
              title="Clear Current Thread History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Thread Selector Bar */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setShowThreadModal(true)}
            className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
          >
            <span className="text-base">{activeThread.icon || '💬'}</span>
            <div className="text-left">
              <span className="block leading-none">{activeThread.title}</span>
              <span className="text-[9px] text-slate-400 font-normal">
                {activeThread.category || 'Topic Thread'} • Click to Switch
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setShowThreadModal(true)}
            className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3 h-3" />
            <span>New Thread</span>
          </button>
        </div>

        {/* Inline Search Bar */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2 pt-1"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
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
                    console.log('[AriaStudio Search] Input value typed:', val);
                    setSearchQuery(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      console.log('[AriaStudio Search] Enter key pressed on input with query:', searchQuery);
                      handleSearchSubmit(e);
                    }
                  }}
                  placeholder="Search past conversations by keyword..."
                  className="w-full text-xs pl-8 pr-8 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      console.log('[AriaStudio Search] Cleared search input');
                      setSearchQuery('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Scope Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[10px] font-bold border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    console.log('[AriaStudio Search] Scope set to: current thread');
                    setSearchScope('current');
                  }}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    searchScope === 'current'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  This Thread
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('[AriaStudio Search] Scope set to: all threads');
                    setSearchScope('all');
                  }}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    searchScope === 'all'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All Threads
                </button>
              </div>
            </form>

            {/* Active Search Result Banner */}
            {searchQuery.trim() && (
              <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200">
                <span>
                  Found <strong>{threadMessages.length}</strong> matching message{threadMessages.length === 1 ? '' : 's'}{' '}
                  {searchScope === 'all' ? 'across all threads' : `in "${activeThread.title}"`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    console.log('[AriaStudio Search] Clicked clear search button');
                    setSearchQuery('');
                  }}
                  className="font-bold underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Persona Switcher Bar */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 shrink-0">Persona:</span>
          {personasList.map((p) => {
            const Icon = p.icon;
            const isActive = companion.personaMode === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onUpdatePersona(p.id)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition cursor-pointer flex items-center gap-1 shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Studio Messages Stream */}
      <div onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {/* Pinned Messages Top Drawer Banner */}
        {threadMessages.some((m) => m.isPinned) && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded-2xl space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>Pinned Messages ({threadMessages.filter((m) => m.isPinned).length})</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {threadMessages.filter((m) => m.isPinned).map((pm) => (
                <div key={pm.id} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-[11px] text-slate-800 dark:text-slate-200 shrink-0 max-w-[200px] flex items-center justify-between gap-2 shadow-2xs">
                  <span className="truncate">{pm.text}</span>
                  <button
                    onClick={() => onTogglePinMessage && onTogglePinMessage(pm.id)}
                    className="text-amber-500 hover:text-amber-700 shrink-0 p-0.5"
                    title="Unpin message"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Follow-ups Banner */}
        {userProfile.scheduledFollowUps && userProfile.scheduledFollowUps.filter((f) => !f.completed).length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 p-2.5 rounded-2xl flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse shrink-0" />
              <div>
                <p className="font-bold">Next Scheduled Follow-up</p>
                <p className="text-[10px] text-indigo-700 dark:text-indigo-300">
                  "{userProfile.scheduledFollowUps.filter((f) => !f.completed)[0].note}"
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextFollowUp = userProfile.scheduledFollowUps?.filter((f) => !f.completed)[0];
                if (nextFollowUp) {
                  onSendMessage(`Aria, regarding my scheduled follow-up: "${nextFollowUp.note}", can you check in on me now?`);
                }
              }}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] cursor-pointer shadow-2xs"
            >
              Ask Aria Now
            </button>
          </div>
        )}

        {threadMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
            <div className="p-3.5 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900">
              <Wand2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Welcome to Aria Studio ({activeThread.title})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                Attach photos of your workspace, record voice notes, ask general knowledge questions, or discuss goals in this thread.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left w-full pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition cursor-pointer text-xs space-y-1 shadow-2xs"
              >
                <ImageIcon className="w-5 h-5 text-indigo-500" />
                <p className="font-bold text-slate-900 dark:text-white">Share a Photo</p>
                <p className="text-[10px] text-slate-400">Attach workspace, journal, or mood photos</p>
              </button>

              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 transition cursor-pointer text-xs space-y-1 shadow-2xs"
              >
                <Mic className="w-5 h-5 text-purple-500" />
                <p className="font-bold text-slate-900 dark:text-white">Record Voice Note</p>
                <p className="text-[10px] text-slate-400">Send voice thoughts for Aria to analyze</p>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSendMessage(
                    `Aria, based on our conversation in the '${activeThread.title}' thread and what you remember about me, please synthesize my personal growth insights and key themes.`
                  )
                }
                className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 transition cursor-pointer text-xs space-y-1 shadow-2xs"
              >
                <Brain className="w-5 h-5 text-amber-500" />
                <p className="font-bold text-slate-900 dark:text-white">Growth Reflection</p>
                <p className="text-[10px] text-slate-400">Synthesize personal progress in this thread</p>
              </button>

              <button
                type="button"
                onClick={onStartVoiceCall}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition cursor-pointer text-xs space-y-1 shadow-2xs"
              >
                <PhoneCall className="w-5 h-5 text-emerald-500" />
                <p className="font-bold text-slate-900 dark:text-white">Live Voice Call</p>
                <p className="text-[10px] text-slate-400">Start an interactive audio chat with Aria</p>
              </button>
            </div>
          </div>
        ) : (
          threadMessages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            const isSpeaking = speakingMsgId === msg.id;
            const isPlaying = playingAudioId === msg.id;
            const isEditingThis = editingMsgId === msg.id;
            const isLastMessage = index === threadMessages.length - 1;

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
                  <div className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs relative space-y-2 ${
                    isUser
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                      : msg.isError
                      ? 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-900 dark:text-rose-200 rounded-tl-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
                  } ${
                    searchQuery.trim()
                      ? 'ring-2 ring-amber-400 dark:ring-amber-500 shadow-md'
                      : ''
                  }`}
                >
                  {/* Thread Badge if searching across all threads */}
                  {searchScope === 'all' && msg.threadId && msg.threadId !== activeThreadId && (
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectThread(msg.threadId!);
                          setSearchScope('current');
                        }}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 text-[10px] font-extrabold hover:underline cursor-pointer"
                      >
                        <span>Thread: {threads.find((t) => t.id === msg.threadId)?.title || 'Topic Thread'}</span>
                        <ChevronDown className="w-3 h-3 -rotate-90" />
                      </button>
                    </div>
                  )}
                  {/* Attached Image Display */}
                  {msg.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                      <img
                        src={msg.imageUrl}
                        alt="Attached in chat"
                        onClick={() => setLightboxImage(msg.imageUrl!)}
                        className="w-full max-h-52 object-cover cursor-pointer hover:opacity-95 transition"
                      />
                    </div>
                  )}

                  {/* Voice Note Audio Player Pill */}
                  {msg.audioUrl && (
                    <div
                      className={`p-2 rounded-xl flex items-center gap-2 text-xs font-bold ${
                        isUser
                          ? 'bg-indigo-700/80 text-white'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => togglePlayAudio(msg.id, msg.audioUrl!)}
                        className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span>Voice Note</span>
                          <span>{msg.audioDuration ? `${msg.audioDuration}s` : 'Audio'}</span>
                        </div>
                        {/* Audio Wave Bar graphic */}
                        <div className="flex items-center gap-1 mt-1">
                          <span className="h-2 w-1 bg-indigo-400 rounded-full animate-pulse" />
                          <span className="h-4 w-1 bg-indigo-500 rounded-full animate-pulse" />
                          <span className="h-3 w-1 bg-indigo-400 rounded-full animate-pulse" />
                          <span className="h-5 w-1 bg-indigo-600 rounded-full animate-pulse" />
                          <span className="h-2 w-1 bg-indigo-400 rounded-full animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}

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
                    <>
                      <FormattedMessage content={msg.text} isUser={isUser} />

                      {/* Embedded Rich Visual Aid Widgets */}
                      {(msg.richWidget?.type === 'breathing_guide' || msg.text.toLowerCase().includes('[widget:breathing]') || msg.text.toLowerCase().includes('breathing exercise')) && (
                        <div className="pt-2">
                          <BreathingGuideWidget />
                        </div>
                      )}

                      {(msg.richWidget?.type === 'checklist' || msg.text.toLowerCase().includes('[widget:checklist]')) && (
                        <div className="pt-2">
                          <ChecklistWidget items={msg.richWidget?.data?.items || ['Identify top priority task', 'Take 3 deep breaths', 'Complete 15-min focus block', 'Reflect & celebrate progress']} />
                        </div>
                      )}

                      {(msg.richWidget?.type === 'mood_chart' || msg.text.toLowerCase().includes('[widget:mood_chart]') || msg.text.toLowerCase().includes('mood trend')) && (
                        <div className="pt-2">
                          <MoodChartWidget />
                        </div>
                      )}
                    </>
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

                  {/* Timestamp & Actions */}
                  <div
                    className={`pt-1 flex items-center justify-between text-[10px] ${
                      isUser
                        ? 'text-indigo-200 border-t border-indigo-500/40'
                        : 'text-slate-400 border-t border-slate-100 dark:border-slate-700/50'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.isEdited && <span className="text-[9px] opacity-75">(edited)</span>}
                    </span>

                    {/* AI Actions: Speak, Star, Pin, Bookmark Memory */}
                    {!isUser && !msg.isError && (
                      <div className="flex items-center gap-1.5">
                        {/* Quick Reaction Bar */}
                        <div className="flex items-center gap-0.5">
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
                          className="hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer"
                          title="Listen to response"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onTogglePinMessage && onTogglePinMessage(msg.id)}
                          className="p-0.5 hover:text-amber-500 cursor-pointer"
                          title={msg.isPinned ? 'Unpin message' : 'Pin message to top'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${msg.isPinned ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveToMemory(msg.text)}
                          className="p-0.5 hover:text-purple-500 cursor-pointer"
                          title="Save to Cross-Thread Memory"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-slate-400 hover:text-purple-500" />
                        </button>

                        <button onClick={() => onToggleStarMessage(msg.id)} className="cursor-pointer">
                          <Star
                            className={`w-3.5 h-3.5 ${
                              msg.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                            }`}
                          />
                        </button>
                      </div>
                    )}

                    {/* User Actions: Pin, Edit, Delete */}
                    {isUser && (
                      <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onTogglePinMessage && onTogglePinMessage(msg.id)}
                          className="hover:text-amber-200 p-0.5 rounded transition cursor-pointer"
                          title={msg.isPinned ? 'Unpin message' : 'Pin message'}
                        >
                          <Pin className={`w-3 h-3 ${msg.isPinned ? 'text-amber-300 fill-amber-200' : 'text-indigo-200'}`} />
                        </button>
                        {onEditMessage && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMsgId(msg.id);
                              setEditingText(msg.text);
                            }}
                            className="hover:text-white p-0.5 rounded transition cursor-pointer"
                            title="Edit message"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        {onDeleteMessage && (
                          <button
                            type="button"
                            onClick={() => onDeleteMessage(msg.id)}
                            className="hover:text-rose-200 p-0.5 rounded transition cursor-pointer"
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
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <span>Aria is observing & responding</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
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

      {/* Image Preview thumbnail if selected */}
      {selectedImage && (
        <div className="px-3 py-2 bg-amber-50/90 dark:bg-slate-900 border-t border-amber-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={selectedImage.dataUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Photo Attached</p>
              <p className="text-[10px] text-slate-400">Aria will analyze this image in her response</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="p-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Note Recorder Drawer */}
      {showVoiceRecorder && (
        <VoiceNoteRecorder
          onSendVoiceNote={handleSendVoiceNote}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Quick Visual Aid & AI Tools Chips */}
      {!showVoiceRecorder && (
        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => onSendMessage('Can you guide me through a 1-minute visual breathing exercise? [WIDGET:BREATHING]')}
            className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium hover:bg-emerald-100 transition shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Wind className="w-3 h-3 text-emerald-500" />
            <span>Breathing Guide</span>
          </button>

          <button
            type="button"
            onClick={() => onSendMessage('Help me organize my top goals into an interactive checklist! [WIDGET:CHECKLIST]')}
            className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium hover:bg-indigo-100 transition shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <CheckSquare className="w-3 h-3 text-indigo-500" />
            <span>Goal Checklist</span>
          </button>

          <button
            type="button"
            onClick={() => onSendMessage('Show me my visual mood trend chart and emotional progress! [WIDGET:MOOD_CHART]')}
            className="text-[10px] px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-medium hover:bg-purple-100 transition shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <TrendingUp className="w-3 h-3 text-purple-500" />
            <span>Mood Chart</span>
          </button>

          <button
            type="button"
            onClick={() => setShowScheduledFollowUpModal(true)}
            className="text-[10px] px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium hover:bg-amber-100 transition shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Schedule Follow-up</span>
          </button>
        </div>
      )}

      {/* Studio Input Bar */}
      {!showVoiceRecorder && (
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 shrink-0 shadow-lg"
        >
          {/* Photo Upload Attachment Trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a photo for Aria to analyze"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-indigo-500" />
          </button>

          {/* Long Voice Note Recorder Trigger */}
          <button
            type="button"
            onClick={() => setShowVoiceRecorder(true)}
            title="Record long voice note"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            <Mic className="w-4 h-4 text-purple-500" />
          </button>

          {/* Contact Picker Trigger */}
          <ChatContactPicker
            userProfile={userProfile}
            onUpdateUserProfile={onUpdateUserProfile}
            onUpdateEmergencyContacts={onUpdateEmergencyContacts}
            messages={messages}
            threadTitle={activeThread.title}
            onInsertText={(text) => setInputText((prev) => (prev ? `${prev} ${text}` : text))}
          />

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              selectedImage ? 'Add a message about this photo...' : `Message Aria in Studio (${activeThread.title})...`
            }
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isGenerating}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition shadow-sm cursor-pointer disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Lightbox Modal for attached image */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
        >
          <img src={lightboxImage} alt="Expanded view" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
        </div>
      )}

      {/* Thread Manager Modal */}
      <ThreadManagerModal
        isOpen={showThreadModal}
        onClose={() => setShowThreadModal(false)}
        threads={threads}
        activeThreadId={activeThreadId}
        onCreateThread={onCreateThread}
        onSelectThread={onSelectThread}
        onDeleteThread={onDeleteThread}
      />

      {/* Memory & Personal Growth Insights Drawer/Modal */}
      <AnimatePresence>
        {showMemoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Aria's Deep Memory Bank
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Personalized context & growth reflection
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMemoryModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Memory List Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-purple-500" />
                    <span>Stored Personal Contexts ({userProfile.memories.length})</span>
                  </p>
                </div>

                {userProfile.memories.length === 0 ? (
                  <p className="text-xs italic text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-center">
                    No memories stored yet. Share details about your routines or goals with Aria during chat to build her long-term memory!
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {userProfile.memories.map((mem, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-xs text-purple-950 dark:text-purple-200 flex items-start gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{mem}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Personal Growth Reflection Action */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/50 dark:border-indigo-800/50 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                  <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <p className="text-xs font-bold">Growth & Mindset Synthesis</p>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ask Aria to review your messages in <strong>{activeThread.title}</strong> and generate a thoughtful synthesis of your progress and key themes.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowMemoryModal(false);
                    onSendMessage(
                      `Aria, based on our conversation in the '${activeThread.title}' thread and what you remember about me, please synthesize my personal growth insights, emotional trends, and actionable next steps.`
                    );
                  }}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize Growth Reflection</span>
                </button>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400">
                🔒 All memories & notes are stored with local AES-GCM encryption on your device.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Smart Thread Summarizer Modal */}
      <ThreadSummarizerModal
        isOpen={showSummarizerModal}
        onClose={() => setShowSummarizerModal(false)}
        activeThread={activeThread}
        messages={messages.filter((m) => (!m.threadId && activeThreadId === 'thread-default') || m.threadId === activeThreadId)}
        companionName={companion.name}
        onSaveToMemory={handleSaveToMemory}
      />

      {/* Scheduled Follow-Up Modal */}
      <ScheduledFollowUpModal
        isOpen={showScheduledFollowUpModal}
        onClose={() => setShowScheduledFollowUpModal(false)}
        activeThreadId={activeThreadId}
        onAddFollowUp={handleScheduleFollowUp}
      />
    </div>
  );
};
