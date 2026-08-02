import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  MessageSquare,
  Flame,
  ArrowRight,
  Check,
  Heart,
  Shield,
  Mic,
  TrendingUp,
  ChevronRight,
  Lock,
  Eye,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { savePrivacyConsent, getPrivacyConsent } from '../utils/privacyConsent';

interface OnboardingScreenProps {
  onComplete: () => void;
  appName?: string;
  tagline?: string;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  appName = 'Ferio Heart AI',
  tagline = 'Your daily mood companion',
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Privacy consent toggle states during onboarding
  const [voiceConsent, setVoiceConsent] = useState(true);
  const [aiConsent, setAiConsent] = useState(true);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);

  const steps = [
    {
      id: 'mood_goals',
      title: "Meet Aria, your warm daily companion",
      description: "Hi, I'm Aria, your daily companion! I'm here to check in on you, celebrate your wins, track your emotional wellbeing, and support you along the way.",
      badge: 'Mindful Intelligence',
      icon: (
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 p-0.5 shadow-xl flex items-center justify-center">
          <div className="w-full h-full rounded-[22px] bg-slate-900/90 flex items-center justify-center backdrop-blur-md">
            <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 bg-amber-500 rounded-2xl text-white shadow-md border border-amber-300/30 text-lg">
            😊
          </div>
        </div>
      ),
      highlights: [
        'Daily mood check-ins in under 30 seconds',
        'Personalized daily affirmations & goals',
        'Caring AI partner tailored to your personality',
      ],
    },
    {
      id: 'chat_speak',
      title: 'Chat, speak, and check in daily',
      description: 'Talk naturally using voice or text in English, Hindi, or Hinglish. Listen to spoken responses out loud with intelligent voice matching.',
      badge: 'Voice & Text Enabled',
      icon: (
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 p-0.5 shadow-xl flex items-center justify-center">
          <div className="w-full h-full rounded-[22px] bg-slate-900/90 flex items-center justify-center backdrop-blur-md flex-col gap-1">
            <Mic className="w-8 h-8 text-purple-400 animate-bounce" />
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">EN • HI</span>
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 bg-indigo-500 rounded-2xl text-white shadow-md border border-indigo-300/30">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
        </div>
      ),
      highlights: [
        'Hands-free spoken voice conversations',
        'Full Hindi & English bilingual voice support',
        'Quick 9 AM push notifications & background widget',
      ],
    },
    {
      id: 'privacy_consent',
      title: 'Your Privacy & Explicit Consent',
      description: 'Plain-language data transparency: We NEVER sell or share your data with advertisers. Choose which features you consent to enable.',
      badge: 'Privacy & Control',
      icon: (
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 p-0.5 shadow-xl flex items-center justify-center">
          <div className="w-full h-full rounded-[22px] bg-slate-900/90 flex items-center justify-center backdrop-blur-md flex-col gap-1">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
            <span className="text-[9px] font-extrabold text-emerald-300 uppercase tracking-wider">AES-256</span>
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-2xl text-white shadow-md border border-emerald-300/30">
            <Lock className="w-4 h-4 text-white" />
          </div>
        </div>
      ),
      highlights: [
        '100% AES-256 encrypted storage at rest',
        'Zero third-party data broker sharing guarantee',
        'View, edit, export, or delete your data anytime',
      ],
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleCompleteOnboarding = () => {
    // Save explicit user consent choices
    savePrivacyConsent({
      voiceRecognitionConsent: voiceConsent,
      aiPersonalizationConsent: aiConsent,
      analyticsAndTrendConsent: analyticsConsent,
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('daily_companion_onboarded', 'true');
    }
    onComplete();
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-5 sm:p-6 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white overflow-hidden select-none">
      {/* Background ambient lighting glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar with Skip button on every screen */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-xs flex items-center justify-center">
            <div className="w-full h-full rounded-[9px] bg-slate-950 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
          </div>
          <span className="text-xs font-bold text-white tracking-wide">{appName}</span>
        </div>

        <button
          type="button"
          onClick={handleCompleteOnboarding}
          className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition border border-white/10 backdrop-blur-md cursor-pointer"
        >
          Skip Intro
        </button>
      </div>

      {/* Main Slide Content */}
      <div className="w-full max-w-sm mx-auto my-auto flex flex-col items-center text-center px-2 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepData.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col items-center w-full"
          >
            {/* Top Category Badge */}
            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/20 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              <Shield className="w-3 h-3 text-indigo-400" />
              <span>{currentStepData.badge}</span>
            </div>

            {/* Icon Banner */}
            <div className="mb-4">{currentStepData.icon}</div>

            {/* Step Title */}
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent leading-tight max-w-xs">
              {currentStepData.title}
            </h2>

            {/* Step Description */}
            <p className="mt-2 text-xs text-slate-300/90 leading-relaxed max-w-xs font-normal">
              {currentStepData.description}
            </p>

            {/* SPECIAL STEP 3: Interactive Privacy Consent Controls */}
            {currentStepData.id === 'privacy_consent' ? (
              <div className="mt-4 w-full p-3.5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 backdrop-blur-md text-left space-y-3">
                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-white/10">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Configure Explicit Feature Consent</span>
                </div>

                {/* Voice Toggle */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">Voice Recognition & Audio</span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      Hands-free microphone input & neural voice responses
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={voiceConsent}
                    onChange={(e) => setVoiceConsent(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-indigo-400 text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
                  />
                </label>

                {/* AI Personalization Toggle */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">AI Memory & Personalization</span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      Aria remembers personal preferences across check-ins
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiConsent}
                    onChange={(e) => setAiConsent(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-indigo-400 text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
                  />
                </label>

                {/* Mood Analytics Toggle */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">Mood Trends & Journaling</span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      Track emotional wellness charts & daily streak counts
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={analyticsConsent}
                    onChange={(e) => setAnalyticsConsent(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-indigo-400 text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
                  />
                </label>
              </div>
            ) : (
              /* Standard Bullet Highlights Card for other steps */
              <div className="mt-4 w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-left space-y-2">
                {currentStepData.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-indigo-100 font-medium">
                    <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation Controls */}
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-3 pb-3 z-10">
        {/* Step Indicator Dots */}
        <div className="flex items-center gap-2">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentStep ? 'w-7 bg-indigo-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
              title={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <div className="w-full flex items-center gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold border border-white/10 transition cursor-pointer"
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98]"
          >
            <span>{currentStep === steps.length - 1 ? 'Accept & Begin' : 'Continue'}</span>
            {currentStep === steps.length - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

