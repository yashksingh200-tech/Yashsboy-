import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType, CompanionConfig, UserProfile, MoodCheckin, ReflectionEntry, ChatMessage, PersonaMode, ChatThread } from './types';
import { DEFAULT_COMPANION, DEFAULT_USER_PROFILE, INITIAL_CHECKINS, INITIAL_REFLECTIONS } from './data/initialData';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { HomeTab } from './components/HomeTab';
import { CheckinScreen } from './components/CheckinScreen';
import { ReflectionScreen } from './components/ReflectionScreen';
import { ChatTab } from './components/ChatTab';
import { ProgressTab } from './components/ProgressTab';
import { ProfileTab } from './components/ProfileTab';
import { VoiceCallModal } from './components/VoiceCallModal';
import { PushNotificationBanner } from './components/PushNotificationBanner';
import { FloatingVoiceAssistant } from './components/FloatingVoiceAssistant';
import { OnboardingScreen } from './components/OnboardingScreen';
import { OfflineBanner } from './components/OfflineBanner';
import { FeedbackModal } from './components/FeedbackModal';
import { RatingPromptModal } from './components/RatingPromptModal';
import { HomeSkeleton } from './components/LoadingSkeleton';
import { speakMessage } from './utils/speech';
import { detectCrisis, generateCrisisResponseText, detectUserCountry } from './utils/crisisDetector';
import { CrisisModal } from './components/CrisisModal';

import { getEncryptedStorageItem, setEncryptedStorageItem } from './utils/encryption';
import { secureFetch, securePost } from './utils/apiClient';

function MainApp() {
  const { user, logout, isLoading, getAuthToken } = useAuth();

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Onboarding Screen State (Shown on first open)
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('daily_companion_onboarded') !== 'true';
  });

  // Active Tab & SubView State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [subView, setSubView] = useState<'checkin' | 'reflection' | null>(null);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSubView(null);
  };

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('daily_companion_darkmode');
    return saved ? JSON.parse(saved) : false;
  });

  // Font Size Accessibility State
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>(() => {
    const saved = localStorage.getItem('daily_companion_fontsize');
    return (saved as 'small' | 'normal' | 'large') || 'normal';
  });

  useEffect(() => {
    localStorage.setItem('daily_companion_fontsize', fontSize);
  }, [fontSize]);

  // Companion Configuration State
  const [companion, setCompanion] = useState<CompanionConfig>(DEFAULT_COMPANION);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  // Mood Check-ins State
  const [checkins, setCheckins] = useState<MoodCheckin[]>(INITIAL_CHECKINS);

  // Daily Reflections State
  const [reflections, setReflections] = useState<ReflectionEntry[]>(INITIAL_REFLECTIONS);

  // Threads & Active Thread State
  const [threads, setThreads] = useState<ChatThread[]>([
    { id: 'thread-default', title: 'Daily Chats', icon: '💬', category: 'General', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'thread-work', title: 'Work & Career', icon: '💼', category: 'Work Stress', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'thread-goals', title: 'Fitness & Goals', icon: '🎯', category: 'Fitness Goals', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'thread-mindful', title: 'Mindful Venting', icon: '🌿', category: 'Mindfulness', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]);
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-default');

  // Chat Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Hi, I'm Aria, your daily companion. I'm here to check in on you, celebrate your wins, and support you along the way. Let's get started!`,
      timestamp: new Date().toISOString(),
      threadId: 'thread-default',
    },
  ]);

  const [isGeneratingChat, setIsGeneratingChat] = useState(false);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Sync Dark Mode class to <html> tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('daily_companion_darkmode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Load user-scoped data whenever logged-in user changes (Encrypted at Rest)
  useEffect(() => {
    const uid = user?.uid || 'guest';

    // Companion config
    const loadedConfig = getEncryptedStorageItem<CompanionConfig>(
      `daily_companion_config_${uid}`,
      uid,
      DEFAULT_COMPANION
    );
    setCompanion(loadedConfig);

    // User profile
    const loadedProfile = getEncryptedStorageItem<UserProfile>(
      `daily_companion_user_${uid}`,
      uid,
      DEFAULT_USER_PROFILE
    );
    if (user?.name) loadedProfile.name = user.name;
    setUserProfile(loadedProfile);

    // Mood check-ins
    const loadedCheckins = getEncryptedStorageItem<MoodCheckin[]>(
      `daily_companion_checkins_${uid}`,
      uid,
      INITIAL_CHECKINS
    );
    setCheckins(loadedCheckins);

    // Reflections
    const loadedReflections = getEncryptedStorageItem<ReflectionEntry[]>(
      `daily_companion_reflections_${uid}`,
      uid,
      INITIAL_REFLECTIONS
    );
    setReflections(loadedReflections);

    // Threads
    const loadedThreads = getEncryptedStorageItem<ChatThread[]>(
      `daily_companion_threads_${uid}`,
      uid,
      [
        { id: 'thread-default', title: 'Daily Chats', icon: '💬', category: 'General', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'thread-work', title: 'Work & Career', icon: '💼', category: 'Work Stress', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'thread-goals', title: 'Fitness & Goals', icon: '🎯', category: 'Fitness Goals', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'thread-mindful', title: 'Mindful Venting', icon: '🌿', category: 'Mindfulness', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ]
    );
    setThreads(loadedThreads);

    // Chat messages
    const loadedMessages = getEncryptedStorageItem<ChatMessage[]>(
      `daily_companion_messages_${uid}`,
      uid,
      [
        {
          id: 'msg-welcome',
          sender: 'ai',
          text: `Hi, I'm Aria, your daily companion. I'm here to check in on you, celebrate your wins, and support you along the way. Let's get started!`,
          timestamp: new Date().toISOString(),
          threadId: 'thread-default',
        },
      ]
    );
    setMessages(loadedMessages);
  }, [user?.uid]);

  // Persist State Changes with User Isolation & AES-256 Encryption At Rest
  useEffect(() => {
    const uid = user?.uid || 'guest';
    setEncryptedStorageItem(`daily_companion_config_${uid}`, companion, uid);
  }, [companion, user?.uid]);

  useEffect(() => {
    const uid = user?.uid || 'guest';
    setEncryptedStorageItem(`daily_companion_threads_${uid}`, threads, uid);
  }, [threads, user?.uid]);

  useEffect(() => {
    const uid = user?.uid || 'guest';
    setEncryptedStorageItem(`daily_companion_user_${uid}`, userProfile, uid);
  }, [userProfile, user?.uid]);

  useEffect(() => {
    const uid = user?.uid || 'guest';
    setEncryptedStorageItem(`daily_companion_checkins_${uid}`, checkins, uid);
  }, [checkins, user?.uid]);

  useEffect(() => {
    const uid = user?.uid || 'guest';
    setEncryptedStorageItem(`daily_companion_reflections_${uid}`, reflections, uid);
  }, [reflections, user?.uid]);

  useEffect(() => {
    const uid = user?.uid || 'guest';
    setEncryptedStorageItem(`daily_companion_messages_${uid}`, messages, uid);
  }, [messages, user?.uid]);

  // Handle Dark Mode Toggle
  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Add Checkin Handler
  const handleAddCheckin = (checkin: MoodCheckin) => {
    setCheckins((prev) => [checkin, ...prev]);

    // Update streak if checking in on a new day
    const todayStr = new Date().toISOString().split('T')[0];
    if (userProfile.lastCheckinDate !== todayStr) {
      const newStreak = userProfile.streakDays + 1;
      setUserProfile((prev) => ({
        ...prev,
        streakDays: newStreak,
        lastCheckinDate: todayStr,
      }));

      // Genuine celebration message from Aria on milestone streak check-in
      const celebrateMsgText = `${newStreak} days in a row! 🎉 I'm really proud of how consistent you've been, ${user?.name || userProfile.name}. Keeping up with your emotional wellbeing is a beautiful accomplishment!`;
      
      setMessages((prev) => [
        ...prev,
        {
          id: 'celebrate-' + Date.now(),
          sender: 'ai',
          text: celebrateMsgText,
          timestamp: new Date().toISOString(),
        },
      ]);

      const isVoiceMuted = localStorage.getItem('daily_companion_voice_muted') === 'true';
      if (!isVoiceMuted) {
        speakMessage(celebrateMsgText, 'auto');
      }
    }
  };

  // Add Reflection Handler
  const handleAddReflection = (reflection: ReflectionEntry) => {
    setReflections((prev) => [reflection, ...prev]);
  };

  // Thread Management Handlers
  const handleCreateThread = (title: string, category?: string, icon?: string, initialGreeting?: string) => {
    const newThread: ChatThread = {
      id: 'thread-' + Date.now(),
      title,
      category: category || 'General',
      icon: icon || '💬',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setThreads((prev) => [...prev, newThread]);
    setActiveThreadId(newThread.id);

    if (initialGreeting) {
      const initAiMsg: ChatMessage = {
        id: 'init-' + Date.now(),
        sender: 'ai',
        text: initialGreeting,
        timestamp: new Date().toISOString(),
        threadId: newThread.id,
      };
      setMessages((prev) => [...prev, initAiMsg]);
    }
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
  };

  const handleDeleteThread = (threadId: string) => {
    if (threadId === 'thread-default') {
      alert("The default 'Daily Chats' thread cannot be deleted.");
      return;
    }
    if (confirm('Delete this thread and all associated messages?')) {
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      setMessages((prev) => prev.filter((m) => m.threadId !== threadId));
      if (activeThreadId === threadId) {
        setActiveThreadId('thread-default');
      }
    }
  };

  const handleExportThread = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId) || { title: 'Conversation' };
    const threadMsgs = messages.filter((m) => (!m.threadId && threadId === 'thread-default') || m.threadId === threadId);

    let exportText = `==================================================\n`;
    exportText += `Aria Studio - Conversation History Export\n`;
    exportText += `Topic Thread: ${thread.title}\n`;
    exportText += `Exported On: ${new Date().toLocaleString()}\n`;
    exportText += `==================================================\n\n`;

    threadMsgs.forEach((m) => {
      const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sender = m.sender === 'user' ? (user?.name || userProfile.name || 'User') : companion.name;
      exportText += `[${time}] ${sender}:\n${m.text}\n`;
      if (m.imageUrl) exportText += `[Photo Attached]\n`;
      if (m.audioUrl) exportText += `[Voice Note Attached - ${m.audioDuration || 0}s]\n`;
      exportText += `\n`;
    });

    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aria-studio-${thread.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Chat Send Message Handler
  const handleSendMessage = async (
    text: string,
    options?: {
      threadId?: string;
      imageUrl?: string;
      inlineImage?: { data: string; mimeType: string };
      audioUrl?: string;
      audioDuration?: number;
      isVoiceNote?: boolean;
    }
  ) => {
    if (!text.trim() && !options?.imageUrl && !options?.inlineImage && !options?.audioUrl) return;
    if (isGeneratingChat) return;

    const targetThreadId = options?.threadId || activeThreadId || 'thread-default';

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
      threadId: targetThreadId,
      imageUrl: options?.imageUrl,
      audioUrl: options?.audioUrl,
      audioDuration: options?.audioDuration,
      isVoiceNote: options?.isVoiceNote,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGeneratingChat(true);

    // 1. Client-Side Crisis Safety Interceptor
    if (detectCrisis(text)) {
      const userRegion = userProfile.countryRegion || detectUserCountry();
      const crisisText = generateCrisisResponseText(
        user?.name || userProfile.name,
        companion.name,
        userRegion,
        userProfile.emergencyContact
      );

      const crisisAiMsg: ChatMessage = {
        id: 'crisis-' + Date.now(),
        sender: 'ai',
        text: crisisText,
        timestamp: new Date().toISOString(),
        threadId: targetThreadId,
      };

      setMessages((prev) => [...prev, crisisAiMsg]);
      setIsCrisisModalOpen(true);
      setIsGeneratingChat(false);

      const isVoiceMuted = localStorage.getItem('daily_companion_voice_muted') === 'true';
      if (!isVoiceMuted) {
        speakMessage(crisisText, 'auto');
      }
      return;
    }

    try {
      // Gather recent notes for contextual memory
      const recentNotes = checkins.slice(0, 5).map((c) => c.note).filter(Boolean);

      // Compute time of day period
      const currentHour = new Date().getHours();
      let timeOfDayPeriod = 'afternoon';
      if (currentHour >= 5 && currentHour < 12) timeOfDayPeriod = 'morning';
      else if (currentHour >= 12 && currentHour < 18) timeOfDayPeriod = 'afternoon';
      else if (currentHour >= 18 && currentHour < 22) timeOfDayPeriod = 'evening';
      else timeOfDayPeriod = 'night';

      const clientLocalTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Filter history for current thread
      const threadHistory = messages.filter(
        (m) => (!m.threadId && targetThreadId === 'thread-default') || m.threadId === targetThreadId
      );

      // Cross-Thread Memory Context: gather recent snippets from OTHER active threads
      const otherThreadsContext = threads
        .filter((t) => t.id !== targetThreadId)
        .map((t) => {
          const lastMsg = messages.filter((m) => m.threadId === t.id).pop();
          return `[Thread '${t.title}' (${t.category}): ${lastMsg ? lastMsg.text.slice(0, 100) : 'No recent messages'}]`;
        })
        .slice(0, 4);

      const res = await secureFetch('/api/chat', {
        method: 'POST',
        userId: user?.uid || 'guest',
        token: getAuthToken(),
        body: JSON.stringify({
          message: text,
          history: threadHistory,
          companionConfig: companion,
          userMemories: [
            ...userProfile.memories,
            ...(otherThreadsContext.length > 0 ? [`Cross-Thread Contexts: ${otherThreadsContext.join('; ')}`] : []),
          ],
          timeOfDayPeriod,
          clientLocalTime,
          inlineImage: options?.inlineImage,
          userProfile: {
            ...userProfile,
            name: user?.name || userProfile.name,
            recentNotes,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.text || "I'm listening and right here with you.";

      if (data.isCrisisResponse) {
        setIsCrisisModalOpen(true);
      }

      // Automatically store new personal facts extracted by Aria
      if (data.extractedMemory && typeof data.extractedMemory === 'string') {
        const newMem = data.extractedMemory.trim();
        setUserProfile((prev) => {
          if (!prev.memories.includes(newMem)) {
            return { ...prev, memories: [...prev.memories, newMem] };
          }
          return prev;
        });
      }

      // Instantly render AI response
      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toISOString(),
        threadId: targetThreadId,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Speak AI response aloud matching the language unless user has auto voice muted
      const isVoiceMuted = localStorage.getItem('daily_companion_voice_muted') === 'true';
      if (!isVoiceMuted) {
        speakMessage(replyText, 'auto');
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: 'ai-err-' + Date.now(),
        sender: 'ai',
        text: "I experienced a brief pause in connection. Please click retry to send your message again.",
        timestamp: new Date().toISOString(),
        threadId: targetThreadId,
        isError: true,
        failedUserMessage: text,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGeneratingChat(false);
    }
  };

  // Star / Bookmark Message
  const handleToggleStarMessage = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, isStarred: !msg.isStarred } : msg))
    );
  };

  // Toggle Pin Message
  const handleTogglePinMessage = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, isPinned: !msg.isPinned } : msg))
    );
  };

  // Delete Single Message
  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  // Edit Sent Message
  const handleEditMessage = (id: string, newText: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, text: newText, isEdited: true } : msg))
    );
  };

  // React to Message with Emoji
  const handleReactToMessage = (id: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== id) return msg;
        const currentReactions = msg.reactions || [];
        const exists = currentReactions.includes(emoji);
        const nextReactions = exists
          ? currentReactions.filter((r) => r !== emoji)
          : [...currentReactions, emoji];
        return { ...msg, reactions: nextReactions };
      })
    );
  };

  // Clear Chat History (by thread or all)
  const handleClearHistory = (threadId?: string) => {
    const targetId = threadId || activeThreadId;
    if (confirm('Clear history for this thread?')) {
      setMessages((prev) =>
        prev.filter((msg) => {
          if (targetId === 'thread-default') {
            return msg.threadId && msg.threadId !== 'thread-default';
          }
          return msg.threadId !== targetId;
        })
      );
    }
  };

  // Update Persona Mode
  const handleUpdatePersona = (personaMode: PersonaMode) => {
    setCompanion((prev) => ({ ...prev, personaMode }));
  };

  // Update User Goals
  const handleUpdateGoals = (newGoals: string[]) => {
    setUserProfile((prev) => ({ ...prev, goals: newGoals }));
  };

  // Reset All Data
  const handleClearAllData = () => {
    const uid = user?.uid || 'guest';
    localStorage.removeItem(`daily_companion_config_${uid}`);
    localStorage.removeItem(`daily_companion_user_${uid}`);
    localStorage.removeItem(`daily_companion_checkins_${uid}`);
    localStorage.removeItem(`daily_companion_reflections_${uid}`);
    localStorage.removeItem(`daily_companion_messages_${uid}`);

    setCompanion(DEFAULT_COMPANION);
    setUserProfile(DEFAULT_USER_PROFILE);
    setCheckins(INITIAL_CHECKINS);
    setReflections(INITIAL_REFLECTIONS);
    setMessages([
      {
        id: 'msg-reset',
        sender: 'ai',
        text: `App data has been reset. Ready for a peaceful fresh start!`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const starredMessages = messages.filter((m) => m.isStarred);

  // If Auth state is resolving
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pt-12">
        <HomeSkeleton />
      </div>
    );
  }

  // If user is not authenticated, render Login / Signup Screen
  if (!user) {
    return <AuthScreen />;
  }

  const fontClass = fontSize === 'small' ? 'text-[13px]' : fontSize === 'large' ? 'text-[15px]' : 'text-sm';

  return (
    <div className={`min-h-screen transition-colors ${fontClass} ${darkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Offline Connectivity Banner */}
      <OfflineBanner />

      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            onDismiss={() => setShowSplash(false)}
            appName="Ferio Heart AI"
            tagline="Your daily mood companion"
          />
        )}
      </AnimatePresence>

      {/* Onboarding Screen (Shown after splash if first time) */}
      <AnimatePresence>
        {!showSplash && showOnboarding && (
          <OnboardingScreen
            onComplete={() => setShowOnboarding(false)}
            appName="Ferio Heart AI"
            tagline="Your daily mood companion"
          />
        )}
      </AnimatePresence>

      {!showSplash && !showOnboarding && (
        <div className="min-h-screen flex flex-col relative">
          {/* Automatic Rating Prompt Popup (Triggers after 5 checkins or 7 days) */}
          <RatingPromptModal checkInCount={checkins.length} />

          {/* User Feedback Modal */}
          <FeedbackModal
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
            userEmail={user.email}
          />

          {/* Universal Full App Voice Assistant Floating Widget & Overlay */}
          <FloatingVoiceAssistant
            companion={companion}
            userProfile={{
              ...userProfile,
              name: user.name,
            }}
            activeTab={activeTab}
            onNavigateTab={handleTabChange}
            onAddCheckin={handleAddCheckin}
            onUpdateUserProfile={setUserProfile}
            darkMode={darkMode}
            onToggleDarkMode={(forcedState) => {
              if (forcedState !== undefined) {
                setDarkMode(forcedState);
              } else {
                toggleDarkMode();
              }
            }}
            onLogout={logout}
          />

          {/* Daily Push Notification Banner */}
          <PushNotificationBanner
            companionName={companion.name}
            onOpenCheckinChat={(greetingText) => {
              handleTabChange('chat');
              const currentHour = new Date().getHours();
              let fallback = "Good morning! Ready for my daily check-in.";
              if (currentHour >= 12 && currentHour < 17) fallback = "Good afternoon! Ready for my check-in.";
              else if (currentHour >= 17 && currentHour < 22) fallback = "Good evening! Ready for my evening check-in.";
              else if (currentHour >= 22 || currentHour < 5) fallback = "Good night! Unwinding for the day.";
              handleSendMessage(greetingText || fallback);
            }}
          />

          {/* Header */}
          <Header
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            companion={companion}
            streakDays={userProfile.streakDays}
            onStartVoiceCall={() => setIsVoiceCallOpen(true)}
            onOpenCrisisHelp={() => setIsCrisisModalOpen(true)}
          />

          {/* Main Tab Content View with Smooth Screen Transitions */}
          <main className="flex-1 max-w-md mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${subView || 'main'}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="w-full"
              >
                {activeTab === 'home' && (
                  subView === 'checkin' ? (
                    <CheckinScreen
                      userProfile={{
                        ...userProfile,
                        name: user.name,
                      }}
                      companion={companion}
                      checkins={checkins}
                      onAddCheckin={handleAddCheckin}
                      onBack={() => setSubView(null)}
                    />
                  ) : subView === 'reflection' ? (
                    <ReflectionScreen
                      userProfile={{
                        ...userProfile,
                        name: user.name,
                      }}
                      companion={companion}
                      reflections={reflections}
                      onAddReflection={handleAddReflection}
                      onBack={() => setSubView(null)}
                    />
                  ) : (
                    <HomeTab
                      userProfile={{
                        ...userProfile,
                        name: user.name,
                      }}
                      companion={companion}
                      checkins={checkins}
                      onNavigateTab={handleTabChange}
                      onOpenCheckinScreen={() => setSubView('checkin')}
                      onOpenReflectionScreen={() => setSubView('reflection')}
                      onStartVoiceCall={() => setIsVoiceCallOpen(true)}
                    />
                  )
                )}

                {activeTab === 'chat' && (
                  <ChatTab
                    messages={messages}
                    threads={threads}
                    activeThreadId={activeThreadId}
                    onSendMessage={handleSendMessage}
                    onClearHistory={handleClearHistory}
                    onToggleStarMessage={handleToggleStarMessage}
                    onTogglePinMessage={handleTogglePinMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onEditMessage={handleEditMessage}
                    onReactToMessage={handleReactToMessage}
                    companion={companion}
                    onUpdatePersona={handleUpdatePersona}
                    userProfile={{
                      ...userProfile,
                      name: user.name,
                    }}
                    onUpdateUserProfile={setUserProfile}
                    isGenerating={isGeneratingChat}
                    onStartVoiceCall={() => setIsVoiceCallOpen(true)}
                    onCreateThread={handleCreateThread}
                    onSelectThread={handleSelectThread}
                    onDeleteThread={handleDeleteThread}
                    onExportThread={handleExportThread}
                  />
                )}

                {activeTab === 'progress' && (
                  <ProgressTab
                    userProfile={{
                      ...userProfile,
                      name: user.name,
                    }}
                    checkins={checkins}
                    reflections={reflections}
                    starredMessages={starredMessages}
                    companion={companion}
                    onUpdateGoals={handleUpdateGoals}
                    onNavigateTab={handleTabChange}
                  />
                )}

                {activeTab === 'profile' && (
                  <ProfileTab
                    userProfile={{
                      ...userProfile,
                      name: user.name,
                    }}
                    onUpdateUserProfile={setUserProfile}
                    companion={companion}
                    onUpdateCompanion={setCompanion}
                    darkMode={darkMode}
                    onToggleDarkMode={() => setDarkMode(!darkMode)}
                    fontSize={fontSize}
                    onUpdateFontSize={setFontSize}
                    onReplaySplash={() => setShowSplash(true)}
                    onReplayOnboarding={() => setShowOnboarding(true)}
                    onOpenFeedback={() => setIsFeedbackOpen(true)}
                    onClearAllData={handleClearAllData}
                    onOpenCrisisHelp={() => setIsCrisisModalOpen(true)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Bottom Navigation */}
          <Navbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            unreadChatCount={0}
          />

          {/* Voice Call Overlay Modal */}
          <VoiceCallModal
            isOpen={isVoiceCallOpen}
            onClose={() => setIsVoiceCallOpen(false)}
            companion={companion}
            activeThreadId={activeThreadId}
            onAddMessage={(msg) => setMessages((prev) => [...prev, msg])}
          />

          {/* Crisis Safety & Emergency Resources Modal */}
          <CrisisModal
            isOpen={isCrisisModalOpen}
            onClose={() => setIsCrisisModalOpen(false)}
            userCountryRegion={userProfile.countryRegion}
            onUpdateCountryRegion={(countryRegion) =>
              setUserProfile((prev) => ({ ...prev, countryRegion }))
            }
            emergencyContact={userProfile.emergencyContact}
            userName={user.name || userProfile.name}
            onNavigateToSettings={() => {
              setActiveTab('profile');
              setSubView(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
