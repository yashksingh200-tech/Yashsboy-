import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Award,
  Sparkles,
  CheckCircle2,
  Plus,
  Star,
  Smile,
  Heart,
  BookOpen,
  BarChart3,
  Inbox,
  ArrowRight,
  Trophy,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { ChatMessage, CompanionConfig, MoodCheckin, ReflectionEntry, UserProfile } from '../types';
import { DAILY_AFFIRMATIONS } from '../data/initialData';
import { AppButton } from './AppButton';
import { useAuth } from '../context/AuthContext';
import { secureFetch } from '../utils/apiClient';

interface ProgressTabProps {
  userProfile: UserProfile;
  checkins: MoodCheckin[];
  reflections: ReflectionEntry[];
  starredMessages: ChatMessage[];
  companion: CompanionConfig;
  onUpdateGoals: (newGoals: string[]) => void;
  onNavigateTab?: (tab: 'home' | 'chat' | 'progress' | 'profile') => void;
}

type ProgressSubsectionType = 'overview' | 'mood' | 'insights' | 'affirmation' | 'goals' | null;

export const ProgressTab: React.FC<ProgressTabProps> = ({
  userProfile,
  checkins = [],
  reflections = [],
  starredMessages = [],
  companion,
  onUpdateGoals,
  onNavigateTab,
}) => {
  const { user, getAuthToken } = useAuth();
  const [activeSubsection, setActiveSubsection] = useState<ProgressSubsectionType>(null);
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [weeklyGoalProgress, setWeeklyGoalProgress] = useState<string | null>(null);
  const [weeklyEncouragement, setWeeklyEncouragement] = useState<string | null>(null);
  const [weeklyRec, setWeeklyRec] = useState<string | null>(null);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');

  // Daily Affirmation state
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const currentAffirmation = DAILY_AFFIRMATIONS[affirmationIndex % DAILY_AFFIRMATIONS.length];

  // Fetch weekly AI insights on load or checkin update
  useEffect(() => {
    const fetchInsights = async () => {
      if (checkins.length === 0) return;
      setIsLoadingWeekly(true);
      try {
        const res = await secureFetch('/api/weekly-insights', {
          method: 'POST',
          userId: user?.uid || 'guest',
          token: getAuthToken(),
          body: JSON.stringify({
            checkins: checkins.slice(-7),
            goals: userProfile.goals,
            userName: userProfile.name,
            companionName: companion.name,
          }),
        });
        const data = await res.json();
        setWeeklySummary(data.summary);
        setWeeklyGoalProgress(data.goalProgress);
        setWeeklyEncouragement(data.encouragingObservation);
        setWeeklyRec(data.recommendation);
      } catch (err) {
        setWeeklySummary("You've built steady momentum this week with your check-ins and reflections.");
        setWeeklyGoalProgress("Every small effort on your active goals adds up over time.");
        setWeeklyEncouragement("I noticed your dedication to taking time for self-care even on busy days.");
        setWeeklyRec("Remember to take 3 deep grounding breaths during busy moments.");
      } finally {
        setIsLoadingWeekly(false);
      }
    };

    fetchInsights();
  }, [checkins.length, userProfile.goals.length]);

  const [completedGoalNotice, setCompletedGoalNotice] = useState<string | null>(null);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    onUpdateGoals([...userProfile.goals, newGoalText.trim()]);
    setNewGoalText('');
  };

  const handleCompleteGoal = (index: number) => {
    const completedGoalName = userProfile.goals[index];
    const updated = userProfile.goals.filter((_, i) => i !== index);
    onUpdateGoals(updated);
    setCompletedGoalNotice(`🎉 Milestone Achieved! You completed "${completedGoalName}" — fantastic work!`);

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'],
      });
    } catch (e) {}

    setTimeout(() => {
      setCompletedGoalNotice(null);
    }, 5000);
  };

  const handleRemoveGoal = (index: number) => {
    const updated = userProfile.goals.filter((_, i) => i !== index);
    onUpdateGoals(updated);
  };

  // Calculate Streak dynamically from check-ins history
  const calculateStreak = (): number => {
    if (!checkins || checkins.length === 0) return 0;

    const dates = Array.from(
      new Set(checkins.map((c) => c.dateStr || c.timestamp.split('T')[0]))
    ).sort().reverse();

    if (dates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if user checked in today or yesterday
    if (!dates.includes(todayStr) && !dates.includes(yesterdayStr)) {
      return 0; // streak broken
    }

    let streak = 0;
    let curr = new Date(dates.includes(todayStr) ? todayStr : yesterdayStr);

    while (true) {
      const dateString = curr.toISOString().split('T')[0];
      if (dates.includes(dateString)) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
    return Math.max(streak, userProfile.streakDays || 1);
  };

  const currentStreak = calculateStreak();

  // Milestone Message Logic
  const getMilestoneMessage = (streak: number) => {
    if (streak === 0) {
      return {
        title: 'Start Your Streak Today!',
        text: 'Complete your first check-in to begin building your consistency habit.',
        badge: 'Day 0',
        color: 'from-amber-500 to-orange-500',
      };
    } else if (streak < 3) {
      return {
        title: `${streak}-Day Streak! Great Start!`,
        text: 'Consistency builds peace of mind. Keep logging daily to hit your 3-day goal!',
        badge: `${streak} Day Streak`,
        color: 'from-amber-500 to-orange-500',
      };
    } else if (streak < 7) {
      return {
        title: `${streak}-Day Streak! Building Habit!`,
        text: "You're building a strong daily habit! Just a few more days to reach a full 7-day milestone!",
        badge: `${streak}/7 Days`,
        color: 'from-orange-500 to-amber-600',
      };
    } else if (streak < 14) {
      return {
        title: '7-Day Streak Milestone! Keep it up! 🔥',
        text: 'Incredible commitment to your mental wellbeing! A full week of mindful check-ins!',
        badge: '7-Day Champion',
        color: 'from-amber-500 to-rose-500',
      };
    } else if (streak < 30) {
      return {
        title: `${streak}-Day Streak! Outstanding Momentum! 🏆`,
        text: 'Two+ weeks of continuous self-care! Your self-awareness and focus are inspiring.',
        badge: '14+ Days Master',
        color: 'from-rose-500 to-purple-600',
      };
    } else {
      return {
        title: `${streak}-Day Legend Milestone! 🌟`,
        text: 'A whole month of daily mindfulness and self-awareness! Phenomenal achievement!',
        badge: 'Monthly Legend',
        color: 'from-purple-600 to-indigo-600',
      };
    }
  };

  const milestoneInfo = getMilestoneMessage(currentStreak);

  // Generate 7-day history calendar bars (last 7 days including today)
  const getLast7Days = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const foundCheckin = checkins.find(
        (c) => c.dateStr === dateStr || c.timestamp.startsWith(dateStr)
      );
      list.push({
        dateStr,
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateDisplay: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        checkin: foundCheckin || null,
      });
    }
    return list;
  };

  const last7DaysData = getLast7Days();

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
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

  const getMoodBg = (mood?: string) => {
    switch (mood) {
      case 'happy': return 'bg-amber-400';
      case 'neutral': return 'bg-slate-400';
      case 'sad': return 'bg-blue-400';
      case 'stressed': return 'bg-rose-500';
      case 'excited': return 'bg-purple-500';
      case 'calm': return 'bg-teal-400';
      case 'energetic': return 'bg-emerald-500';
      default: return 'bg-indigo-500';
    }
  };

  const menuSections = [
    {
      id: 'overview' as ProgressSubsectionType,
      title: 'Overview & Streak',
      subtitle: 'Consecutive day streak, milestones & check-in totals',
      icon: <Flame className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
      bgIcon: 'bg-amber-100 dark:bg-amber-950/80',
      badge: `${currentStreak} Day Streak`,
      badgeColor: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    },
    {
      id: 'mood' as ProgressSubsectionType,
      title: '7-Day Mood History',
      subtitle: 'Mood trends, energy levels & weekly check-in calendar',
      icon: <BarChart3 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />,
      bgIcon: 'bg-indigo-100 dark:bg-indigo-950/80',
      badge: `${checkins.length} Logs`,
      badgeColor: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
    },
    {
      id: 'insights' as ProgressSubsectionType,
      title: 'Weekly Insights',
      subtitle: `${companion.name}'s summary, observation & mindful tips`,
      icon: <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400" />,
      bgIcon: 'bg-purple-100 dark:bg-purple-950/80',
      badge: 'Weekly Pulse',
      badgeColor: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
    },
    {
      id: 'affirmation' as ProgressSubsectionType,
      title: 'Daily Affirmation',
      subtitle: 'Mindful quote & daily perspective refresh',
      icon: <Heart className="w-5 h-5 text-pink-500 dark:text-pink-400" />,
      bgIcon: 'bg-pink-100 dark:bg-pink-950/80',
      badge: 'Daily Quote',
      badgeColor: 'bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300',
    },
    {
      id: 'goals' as ProgressSubsectionType,
      title: 'My Goals & Intentions',
      subtitle: 'Personal milestones, active goals & progress tracking',
      icon: <Award className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      bgIcon: 'bg-emerald-100 dark:bg-emerald-950/80',
      badge: `${userProfile.goals.length} Active`,
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
    },
  ];

  // ----------------------------------------------------
  // MAIN PROGRESS MENU LIST (When no sub-section selected)
  // ----------------------------------------------------
  if (activeSubsection === null) {
    return (
      <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-4">
        {/* Top Header */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Progress & Wellbeing
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Select a category below to explore streak stats, mood trends, insights & goals.
          </p>
        </div>

        {/* Quick Summary Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-md flex items-center justify-between border border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">{currentStreak}-Day Streak Active</h3>
              </div>
              <p className="text-xs text-indigo-200/80">
                {checkins.length} check-ins • {reflections.length} reflections
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveSubsection('overview')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-100 text-xs font-bold transition cursor-pointer backdrop-blur-xs"
          >
            Overview
          </button>
        </div>

        <div className="px-1 pt-1">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Progress Sections
          </h3>
        </div>

        {/* 5 Main Sub-Section Category Cards */}
        <div className="space-y-2.5">
          {menuSections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSubsection(sec.id)}
              className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-xs transition cursor-pointer flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-3 rounded-2xl ${sec.bgIcon} shrink-0 transition-transform group-hover:scale-105`}>
                  {sec.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {sec.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{sec.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60 hidden sm:inline-block ${sec.badgeColor}`}>
                  {sec.badge}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SUB-SECTION DETAILS VIEW (With Back Button)
  // ----------------------------------------------------
  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-4">
      {/* Back Button to main menu */}
      <button
        type="button"
        onClick={() => setActiveSubsection(null)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>Back to Progress Menu</span>
      </button>

      {/* =========================================
          SUB-SECTION 1: OVERVIEW & STREAK
         ========================================= */}
      {activeSubsection === 'overview' && (
        <div className="space-y-4 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white p-5 shadow-xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
                  <Flame className="w-7 h-7 text-yellow-200 animate-bounce" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-yellow-100 px-2.5 py-0.5 rounded-full border border-white/20">
                    {milestoneInfo.badge}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1 flex items-baseline gap-1">
                    {currentStreak} <span className="text-xs font-semibold text-yellow-100">Consecutive Days</span>
                  </h3>
                </div>
              </div>

              <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-200" />
              </div>
            </div>

            {/* Milestone Motivational Message */}
            <div className="mt-4 pt-3 border-t border-white/20">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                <span>{milestoneInfo.title}</span>
              </h4>
              <p className="text-xs text-amber-100/90 mt-0.5 font-light leading-relaxed">
                "{milestoneInfo.text}"
              </p>
            </div>
          </motion.div>

          {/* Companion Journey Visual Timeline */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ferio Heart AI Journey Timeline</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b'],
                  });
                }}
                className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Celebrate Progress</span>
              </button>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100 dark:before:bg-slate-800">
              {[
                {
                  title: 'First Step',
                  desc: 'Completed your first mindful check-in with Aria',
                  required: 1,
                  badge: '🌱 Beginning',
                  achieved: checkins.length >= 1,
                },
                {
                  title: 'Momentum Builder',
                  desc: 'Maintained a 3-day consecutive check-in streak',
                  required: 3,
                  badge: '🔥 3-Day Flame',
                  achieved: currentStreak >= 3,
                },
                {
                  title: 'Mindful Habits',
                  desc: '7 full days of emotional awareness & reflection',
                  required: 7,
                  badge: '⭐ 7-Day Star',
                  achieved: currentStreak >= 7,
                },
                {
                  title: 'Growth Master',
                  desc: '14 days of dedicated self-care and personal tracking',
                  required: 14,
                  badge: '🏆 14-Day Master',
                  achieved: currentStreak >= 14,
                },
                {
                  title: 'Zen Legend',
                  desc: '30-day streak of complete emotional consistency',
                  required: 30,
                  badge: '👑 30-Day Legend',
                  achieved: currentStreak >= 30,
                },
              ].map((step, idx) => (
                <div key={idx} className="relative flex items-start justify-between gap-3 text-xs">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      step.achieved
                        ? 'bg-indigo-600 border-indigo-200 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {step.achieved && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>

                  <div>
                    <h4
                      className={`font-bold text-xs ${
                        step.achieved
                          ? 'text-indigo-900 dark:text-indigo-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {step.desc}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 border ${
                      step.achieved
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {step.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          SUB-SECTION 2: MOOD HISTORY
         ========================================= */}
      {activeSubsection === 'mood' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">7-Day Mood History</h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              Past 7 Days
            </span>
          </div>

          {checkins.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 text-center space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center mx-auto shadow-xs">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No check-in history yet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Complete your first check-in on the Home screen to unlock your 7-day mood trend chart and stats!
                </p>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('home')}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <span>Complete First Check-in Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-2 h-40 pt-6 px-1">
                {last7DaysData.map((item, idx) => {
                  const hasEntry = !!item.checkin;
                  const energy = item.checkin?.energyLevel || 0;
                  const heightPct = hasEntry ? (energy / 5) * 100 : 8;
                  const mood = item.checkin?.mood;
                  const barBg = hasEntry ? getMoodBg(mood) : 'bg-slate-200 dark:bg-slate-800';

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="h-6 flex items-center justify-center text-sm">
                        {hasEntry ? getMoodEmoji(mood) : <span className="text-[10px] text-slate-300">•</span>}
                      </div>

                      <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800/80 rounded-t-lg h-full flex items-end overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPct}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.06 }}
                          className={`w-full rounded-t-md ${barBg}`}
                        />
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">
                          {item.dayLabel}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          {item.dateDisplay}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">😊 Happy</span>
                <span className="flex items-center gap-1">😐 Neutral</span>
                <span className="flex items-center gap-1">😔 Sad</span>
                <span className="flex items-center gap-1">😫 Stressed</span>
                <span className="flex items-center gap-1">🤩 Excited</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================
          SUB-SECTION 3: WEEKLY INSIGHTS
         ========================================= */}
      {activeSubsection === 'insights' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white shadow-lg space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">{companion.name}'s Weekly Summary & Insights</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/10">
                Weekly Pulse
              </span>
            </div>

            {isLoadingWeekly ? (
              <p className="text-xs text-indigo-200 animate-pulse">Generating your personalized weekly report...</p>
            ) : (
              <div className="space-y-2.5 text-xs leading-relaxed text-indigo-100 font-light pt-1">
                <p className="text-slate-200 font-medium">
                  {weeklySummary || "Log daily check-ins to receive personalized AI weekly insights."}
                </p>

                {weeklyGoalProgress && (
                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-indigo-100">
                    <span className="font-bold text-indigo-300">🎯 Goals Progress: </span>
                    {weeklyGoalProgress}
                  </div>
                )}

                {weeklyEncouragement && (
                  <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-200">
                    <span className="font-bold text-purple-300">🌟 Aria's Observation: </span>
                    "{weeklyEncouragement}"
                  </div>
                )}

                {weeklyRec && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-200">
                    <span className="font-bold text-emerald-300">🌿 Mindful Tip for Next Week: </span>
                    {weeklyRec}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Saved Insights Vault */}
          {starredMessages.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Saved Insights</h3>
              </div>

              <div className="space-y-2">
                {starredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 leading-relaxed"
                  >
                    <p>"{msg.text}"</p>
                    <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 block mt-1">
                      Saved from chat
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================
          SUB-SECTION 4: DAILY AFFIRMATION
         ========================================= */}
      {activeSubsection === 'affirmation' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
              <span>Daily Affirmation</span>
            </div>

            <button
              type="button"
              onClick={() => setAffirmationIndex((prev) => prev + 1)}
              title="Next Affirmation"
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Next</span>
            </button>
          </div>

          <p className="text-base font-medium text-slate-800 dark:text-slate-100 italic leading-relaxed pt-2">
            "{currentAffirmation.quote}"
          </p>

          {currentAffirmation.author && (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium text-right">
              — {currentAffirmation.author}
            </p>
          )}
        </div>
      )}

      {/* =========================================
          SUB-SECTION 5: MY GOALS
         ========================================= */}
      {activeSubsection === 'goals' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Goals & Intentions</h3>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              {userProfile.goals.length} Active
            </span>
          </div>

          {completedGoalNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{completedGoalNotice}</span>
            </motion.div>
          )}

          <div className="space-y-2">
            {userProfile.goals.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                No active goals added yet. Add a personal intention or wellbeing goal below!
              </p>
            ) : (
              userProfile.goals.map((goal, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">{goal}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCompleteGoal(idx)}
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-xs"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Mark Done</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(idx)}
                      className="text-slate-400 hover:text-red-500 text-[10px] cursor-pointer p-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Goal Form */}
          <form onSubmit={handleAddGoal} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              placeholder="Add new personal goal..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <AppButton
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 from-emerald-600 to-teal-600 border-emerald-500/30"
            >
              Save Goal
            </AppButton>
          </form>
        </div>
      )}
    </div>
  );
};
