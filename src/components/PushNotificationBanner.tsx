import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Sparkles, X, ChevronRight, Volume2 } from 'lucide-react';
import { speakMessage } from '../utils/speech';

interface PushNotificationBannerProps {
  companionName: string;
  onOpenCheckinChat: (greetingText: string) => void;
}

const getNotificationDetails = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      label: 'Morning Check-in',
      greetings: [
        "Good morning! Just checking in to wish you a peaceful, wonderful day ahead.",
        "सुप्रभात! आज आपका दिन बहुत ख़ास और शांतिपूर्ण रहे। आप कैसा महसूस कर रहे हैं?",
        "Taking a peaceful morning pause? I'm right here whenever you want a moment.",
        "गुड मॉर्निंग! आज बस एक प्यारा सा नमस्ते भेजने आई हूँ।",
      ],
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      label: 'Afternoon Check-in',
      greetings: [
        "Good afternoon! Taking a peaceful pause? How is your day going?",
        "शुभ दोपहर! दिन का आधा हिस्सा बीत चुका है, थोड़ा विश्राम करें और बताएं कैसा महसूस कर रहे हैं?",
        "Taking a mid-day pause? I'm right here whenever you want to chat.",
        "गुड आफ्टरनून! आज दोपहर में आपका हाल-चाल पूछने आई हूँ।",
      ],
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      label: 'Evening Reflection',
      greetings: [
        "Good evening! How was your day today? I'm right here to listen and reflect with you.",
        "शुभ संध्या! शाम का समय है, आज का आपका दिन कैसा रहा? आराम से बैठें और शेयर करें।",
        "Unwinding for the evening? Let's take a peaceful moment together.",
        "गुड इवनिंग! आज शाम बस आपका हाल-चाल पूछने आई हूँ।",
      ],
    };
  } else {
    return {
      label: 'Nightly Unwind',
      greetings: [
        "Good night! Unwinding for the day? Remember to give yourself permission to rest.",
        "शुभ रात्रि! सोने से पहले अपने मन को शांत करें। आज जो भी हुआ, सब अच्छा था।",
        "Peaceful night! Ready to pause and reflect on your day before sleeping?",
        "गुड नाइट! रात के समय आपके मन को शांति और सुकून मिले।",
      ],
    };
  }
};

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  companionName,
  onOpenCheckinChat,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [notifDetails, setNotifDetails] = useState(getNotificationDetails());
  const [currentGreeting, setCurrentGreeting] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const details = getNotificationDetails();
    setNotifDetails(details);
    const dayIndex = new Date().getDate() % details.greetings.length;
    setCurrentGreeting(details.greetings[dayIndex]);

    // Show Push Notification on mount / session start if not dismissed recently
    const dismissedToday = localStorage.getItem('daily_notif_dismissed_' + new Date().toISOString().split('T')[0]);
    if (!dismissedToday) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTapNotification = () => {
    setIsVisible(false);
    // Speak the greeting out loud in matching language (Hindi voice for Hindi, English voice for English)
    speakMessage(currentGreeting, 'auto');
    onOpenCheckinChat(currentGreeting);
  };

  const handleSpeakOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSpeaking(true);
    speakMessage(
      currentGreeting,
      'auto',
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    localStorage.setItem('daily_notif_dismissed_' + new Date().toISOString().split('T')[0], 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={handleTapNotification}
          className="fixed top-3 left-0 right-0 z-50 max-w-sm mx-auto px-3 cursor-pointer"
        >
          <div className="p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-xl border border-slate-700/80 shadow-2xl flex items-start gap-3 relative overflow-hidden group hover:border-indigo-500 transition">
            {/* Ambient indicator gradient */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-0.5">
                <span className="flex items-center gap-1 font-semibold text-indigo-300">
                  <Bell className="w-3 h-3 text-indigo-400" /> {notifDetails.label} Notification
                </span>
                <span>Now</span>
              </div>
              <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{currentGreeting}</span>
                <button
                  type="button"
                  onClick={handleSpeakOnly}
                  className={`p-1 rounded-full hover:bg-slate-800 transition text-indigo-300 cursor-pointer ${
                    isSpeaking ? 'animate-pulse text-indigo-400' : ''
                  }`}
                  title="Listen greeting"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
                <span>Tap to complete daily check-in with {companionName}</span>
                <ChevronRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

