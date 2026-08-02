import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Heart,
  RefreshCw,
  Sparkles,
  Send,
  Calendar,
  BookOpen,
  Volume2,
} from 'lucide-react';
import { CompanionConfig, MoodType, ReflectionEntry, UserProfile } from '../types';
import { REFLECTION_PROMPTS } from '../data/initialData';
import { speakMessage } from '../utils/speech';
import { AppButton } from './AppButton';
import { useAuth } from '../context/AuthContext';
import { secureFetch } from '../utils/apiClient';

interface ReflectionScreenProps {
  userProfile: UserProfile;
  companion: CompanionConfig;
  reflections: ReflectionEntry[];
  onAddReflection: (reflection: ReflectionEntry) => void;
  onBack: () => void;
}

export const ReflectionScreen: React.FC<ReflectionScreenProps> = ({
  userProfile,
  companion,
  reflections = [],
  onAddReflection,
  onBack,
}) => {
  const { user, getAuthToken } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [promptIndex, setPromptIndex] = useState(0);
  const currentPrompt = REFLECTION_PROMPTS[promptIndex % REFLECTION_PROMPTS.length];
  const [reflectionText, setReflectionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reflectionResult, setReflectionResult] = useState<string | null>(null);

  const handleReflectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionText.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await secureFetch('/api/reflect', {
        method: 'POST',
        userId: user?.uid || 'guest',
        token: getAuthToken(),
        body: JSON.stringify({
          prompt: currentPrompt,
          userResponse: reflectionText,
          companionName: companion.name,
        }),
      });
      const data = await res.json();
      const aiReply = data.aiResponse || 'Thank you for this beautiful reflection.';

      const newEntry: ReflectionEntry = {
        id: 'r-' + Date.now(),
        dateStr: todayStr,
        prompt: currentPrompt,
        userResponse: reflectionText,
        aiResponse: aiReply,
        createdAt: new Date().toISOString(),
      };

      onAddReflection(newEntry);
      setReflectionResult(aiReply);
      setReflectionText('');

      try {
        confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err) {
      const fallback = 'Every reflection brings clarity. Thank you for sharing your genuine thoughts today.';
      setReflectionResult(fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto px-4 pt-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-3 py-1.5 rounded-full border border-purple-200/50 dark:border-purple-800/50 font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Screen Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <span>Daily Journal Reflection</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          Take a quiet moment to write your thoughts and reflect on your day.
        </p>
      </div>

      {/* Reflection Interactive Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Today's Prompt
          </span>

          <button
            onClick={() => {
              setPromptIndex((prev) => prev + 1);
              setReflectionResult(null);
            }}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>New Prompt</span>
          </button>
        </div>

        {/* Prompt Quote Box */}
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-purple-50/70 dark:bg-purple-950/40 p-3.5 rounded-xl border border-purple-200/60 dark:border-purple-800/60 leading-relaxed italic">
          "{currentPrompt}"
        </p>

        {/* Text Area Form */}
        <form onSubmit={handleReflectionSubmit} className="space-y-3">
          <textarea
            rows={4}
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="Write freely here... What comes to mind when you ponder this?"
            className="w-full text-xs p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none leading-relaxed"
          />

          <AppButton
            type="submit"
            variant="secondary"
            size="md"
            isLoading={isSubmitting}
            disabled={!reflectionText.trim()}
            rightIcon={<Sparkles className="w-3.5 h-3.5 text-purple-500" />}
            fullWidth
          >
            Reflect with Ferio Heart AI
          </AppButton>
        </form>

        {/* AI Reflection Output */}
        {reflectionResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-purple-50/80 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/60 text-xs text-purple-950 dark:text-purple-200 leading-relaxed"
          >
            <div className="flex items-center justify-between font-bold text-purple-800 dark:text-purple-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>{companion.name}'s Thoughtful Response</span>
              </span>
              <button
                type="button"
                onClick={() => speakMessage(reflectionResult, 'auto')}
                className="p-1 rounded-full hover:bg-purple-200/50 text-purple-700 dark:text-purple-300"
                title="Speak response"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p>{reflectionResult}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Past Reflection Entries Journal */}
      {reflections.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Journal History ({reflections.length})
            </h3>
          </div>

          <div className="space-y-3">
            {reflections.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>{r.dateStr || r.createdAt.split('T')[0]}</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">Reflection</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 italic">"{r.prompt}"</p>
                <p className="text-slate-600 dark:text-slate-300 pl-2 border-l-2 border-purple-400">
                  {r.userResponse}
                </p>
                {r.aiResponse && (
                  <p className="text-indigo-900 dark:text-indigo-200 bg-indigo-50/60 dark:bg-indigo-950/40 p-2 rounded-lg text-[11px] mt-1">
                    <strong className="text-indigo-700 dark:text-indigo-300">{companion.name}: </strong>
                    {r.aiResponse}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <button
          onClick={onBack}
          className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
        >
          Return to Home Overview
        </button>
      </div>
    </div>
  );
};
