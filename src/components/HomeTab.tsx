import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Smile,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Volume2,
  TrendingUp,
  Mic,
  Heart,
} from 'lucide-react';
import { CompanionConfig, MoodCheckin, MoodType, UserProfile } from '../types';
import { speakMessage } from '../utils/speech';
import { AppButton } from './AppButton';

interface HomeTabProps {
  userProfile: UserProfile;
  companion: CompanionConfig;
  checkins: MoodCheckin[];
  onNavigateTab: (tab: 'chat' | 'progress' | 'profile') => void;
  onOpenCheckinScreen: () => void;
  onOpenReflectionScreen: () => void;
  onStartVoiceCall: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  userProfile,
  companion,
  checkins = [],
  onNavigateTab,
  onOpenCheckinScreen,
  onOpenReflectionScreen,
  onStartVoiceCall,
}) => {
  // Today's Date String (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckin = checkins.find((c) => c.dateStr === todayStr || c.timestamp.startsWith(todayStr));

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Good Night';
  };

  const handleSpeakCheckinStatus = () => {
    speakMessage("You've already checked in today! आपने आज पहले ही चेक-इन कर लिया है!", 'auto');
  };

  const getMoodEmoji = (m: MoodType) => {
    switch (m) {
      case 'happy': return '😊';
      case 'neutral': return '😐';
      case 'sad': return '😔';
      case 'stressed': return '😫';
      case 'excited': return '🤩';
      case 'calm': return '🧘';
      case 'thoughtful': return '💭';
      case 'energetic': return '⚡';
      case 'anxious': return '😰';
      case 'tired': return '😴';
      default: return '✨';
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-md mx-auto px-4 pt-4">
      {/* 1. Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {userProfile.name} ✨
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Here is your daily summary and quick wellness actions.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/50 font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* 2. Today's Check-in Status Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => onNavigateTab('progress')}
        className="overflow-hidden rounded-2xl border shadow-2xs transition-all bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 p-4 space-y-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700/80 group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
            <span>Today's Status</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          {todayCheckin ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Checked In</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending</span>
            </span>
          )}
        </div>

        {todayCheckin ? (
          /* Check-in Completed View */
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-700 shadow-2xs border border-slate-100 dark:border-slate-600">
                  {getMoodEmoji(todayCheckin.mood)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {todayCheckin.mood} Mood
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                      Energy: {todayCheckin.energyLevel}/5
                    </span>
                  </div>
                  {todayCheckin.note ? (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic truncate max-w-[220px]">
                      "{todayCheckin.note}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-0.5">Checked in for today ({todayCheckin.dateStr})</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeakCheckinStatus();
                }}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer shrink-0"
                title="Speak status"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {todayCheckin.aiInsight && (
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200">
                <span className="font-semibold flex items-center gap-1 text-indigo-700 dark:text-indigo-300 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> {companion.name}'s Note:
                </span>
                <p className="line-clamp-2">{todayCheckin.aiInsight}</p>
              </div>
            )}

            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold inline-flex items-center gap-1 pt-0.5">
              <span>View full mood history & progress</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        ) : (
          /* Check-in Pending View */
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Take a peaceful moment for yourself today. Completing your check-in in the Progress tab is a positive step of self-care!
            </p>
            <div className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-2xs transition flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Go to Progress & Check-in</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* 3. Quick Action Navigation Buttons Grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          Quick Actions
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <AppButton
            variant="primary"
            size="md"
            leftIcon={<MessageSquare className="w-4 h-4" />}
            onClick={() => onNavigateTab('chat')}
            fullWidth
          >
            Chat with {companion.name}
          </AppButton>

          <AppButton
            variant="outline"
            size="md"
            leftIcon={<Heart className="w-4 h-4 text-purple-500" />}
            onClick={onOpenReflectionScreen}
            fullWidth
          >
            Daily Reflection
          </AppButton>
        </div>
      </motion.div>

      {/* 4. Aria Active Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-4.5 shadow-lg"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{companion.name}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                  Active
                </span>
              </div>
              <p className="text-xs text-indigo-100/80 mt-0.5 font-light">
                Ready to listen, offer guidance, or talk whenever you need.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('chat')}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-indigo-50 transition cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Start Chat</span>
          </button>

          <button
            onClick={onStartVoiceCall}
            className="py-2.5 px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 flex items-center justify-center gap-1.5 backdrop-blur-md transition cursor-pointer active:scale-95"
            title="Start Voice Call"
          >
            <PhoneCall className="w-3.5 h-3.5 text-indigo-200" />
            <span>Voice Call</span>
          </button>
        </div>
      </motion.div>

      {/* 5. Free Support Banner */}
      <div className="p-3 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 text-center space-y-0.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% Free • Unlimited Ferio Heart AI Support</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          No subscriptions or feature locks. Designed for your peace of mind.
        </p>
      </div>
    </div>
  );
};
