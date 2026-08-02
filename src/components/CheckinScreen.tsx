import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Smile,
  Zap,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Volume2,
  Calendar,
  History,
} from 'lucide-react';
import { CompanionConfig, MoodCheckin, MoodType, UserProfile } from '../types';
import { speakMessage } from '../utils/speech';
import { secureFetch } from '../utils/apiClient';
import { AppButton } from './AppButton';

interface CheckinScreenProps {
  userProfile: UserProfile;
  companion: CompanionConfig;
  checkins: MoodCheckin[];
  onAddCheckin: (checkin: MoodCheckin) => void;
  onBack: () => void;
}

export const CheckinScreen: React.FC<CheckinScreenProps> = ({
  userProfile,
  companion,
  checkins = [],
  onAddCheckin,
  onBack,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckin = checkins.find((c) => c.dateStr === todayStr || c.timestamp.startsWith(todayStr));

  const [selectedMood, setSelectedMood] = useState<MoodType>(todayCheckin?.mood || 'calm');
  const [energyLevel, setEnergyLevel] = useState<number>(todayCheckin?.energyLevel || 4);
  const [checkinNote, setCheckinNote] = useState('');
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [checkinInsight, setCheckinInsight] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moodsList: { type: MoodType; label: string; hindiLabel: string; icon: string; bg: string }[] = [
    { type: 'happy', label: 'Happy', hindiLabel: 'खुश', icon: '😊', bg: 'hover:bg-amber-50 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300' },
    { type: 'neutral', label: 'Neutral', hindiLabel: 'सामान्य', icon: '😐', bg: 'hover:bg-slate-100 border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300' },
    { type: 'sad', label: 'Sad', hindiLabel: 'दुखी', icon: '😔', bg: 'hover:bg-blue-50 border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300' },
    { type: 'stressed', label: 'Stressed', hindiLabel: 'तनावग्रस्त', icon: '😫', bg: 'hover:bg-rose-50 border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-300' },
    { type: 'excited', label: 'Excited', hindiLabel: 'उत्साहित', icon: '🤩', bg: 'hover:bg-purple-50 border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300' },
  ];

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await secureFetch('/api/reflect', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `Daily checkin note: ${checkinNote || 'No extra note'}`,
          userResponse: `Mood: ${selectedMood}, Energy level: ${energyLevel}/5`,
          mood: selectedMood,
          companionName: companion.name,
        }),
      });
      const data = await res.json();
      const insight = data.aiResponse || 'Thank you for taking a moment to log your check-in!';

      const newCheckin: MoodCheckin = {
        id: 'm-' + Date.now(),
        timestamp: new Date().toISOString(),
        dateStr: todayStr,
        mood: selectedMood,
        energyLevel,
        note: checkinNote,
        aiInsight: insight,
      };

      onAddCheckin(newCheckin);
      setCheckinInsight(insight);
      setCheckinSuccess(true);
      setCheckinNote('');

      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#6366f1', '#10b981', '#f59e0b', '#ec4899'],
        });
      } catch (e) {}
    } catch (err) {
      const fallbackInsight = 'Your mood check-in is saved! Listening to your body and mind creates healthy awareness.';
      const newCheckin: MoodCheckin = {
        id: 'm-' + Date.now(),
        timestamp: new Date().toISOString(),
        dateStr: todayStr,
        mood: selectedMood,
        energyLevel,
        note: checkinNote,
        aiInsight: fallbackInsight,
      };
      onAddCheckin(newCheckin);
      setCheckinInsight(fallbackInsight);
      setCheckinSuccess(true);

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="space-y-6 pb-24 max-w-md mx-auto px-4 pt-4">
      {/* Navigation Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/50 font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Screen Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Smile className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <span>Daily Mood Check-in</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          Select how your mind, body, and spirit are feeling right now.
        </p>
      </div>

      {/* Today Status Alert Badge */}
      {todayCheckin && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Logged today: <strong>{todayCheckin.mood}</strong> (Energy {todayCheckin.energyLevel}/5)</span>
          </div>
          <button
            type="button"
            onClick={() => speakMessage(`Today's check-in: ${todayCheckin.mood} mood with energy ${todayCheckin.energyLevel} out of 5`, 'auto')}
            className="p-1 rounded-full hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 transition cursor-pointer shrink-0"
            title="Speak check-in status"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Interactive Check-in Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {todayCheckin ? 'Update or Log Check-in' : 'Select Your Mood'}
          </h3>
          {checkinSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </span>
          )}
        </div>

        {/* Mood Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {moodsList.map((m) => {
            const isSelected = selectedMood === m.type;
            return (
              <button
                key={m.type}
                type="button"
                onClick={() => setSelectedMood(m.type)}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border flex items-center justify-start gap-2 transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-semibold scale-[1.02]'
                    : `bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 ${m.bg}`
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                <span className="truncate">{m.label} ({m.hindiLabel})</span>
              </button>
            );
          })}
        </div>

        {/* Energy Bar */}
        <div>
          <div className="flex justify-between items-center text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Energy Level
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{energyLevel} / 5</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setEnergyLevel(lvl)}
                className={`flex-1 h-3 rounded-full transition cursor-pointer ${
                  lvl <= energyLevel ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Notes Form */}
        <form onSubmit={handleMoodSubmit} className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Personal Note or Context (Optional)
            </label>
            <textarea
              rows={2}
              value={checkinNote}
              onChange={(e) => setCheckinNote(e.target.value)}
              placeholder="What's making you feel this way today? Write a brief thought..."
              className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
          </div>

          <AppButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            rightIcon={<Send className="w-3.5 h-3.5" />}
            fullWidth
          >
            Save Check-in
          </AppButton>
        </form>

        {/* AI Insight Card */}
        {checkinInsight && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed"
          >
            <div className="flex items-center justify-between font-bold text-indigo-700 dark:text-indigo-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>{companion.name}'s Reflection Note</span>
              </span>
              <button
                type="button"
                onClick={() => speakMessage(checkinInsight, 'auto')}
                className="p-1 rounded-full hover:bg-indigo-200/50 text-indigo-700 dark:text-indigo-300"
                title="Speak reflection"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p>{checkinInsight}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Check-in History */}
      {checkins.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recent Check-in Logs
            </h3>
          </div>

          <div className="space-y-2">
            {checkins.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{getMoodEmoji(c.mood)}</span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">{c.mood}</span>
                    <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                      Energy {c.energyLevel}/5
                    </span>
                    {c.note && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate max-w-[180px] mt-0.5">
                        "{c.note}"
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {c.dateStr || c.timestamp.split('T')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <button
          onClick={onBack}
          className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
        >
          Return to Home Overview
        </button>
      </div>
    </div>
  );
};
