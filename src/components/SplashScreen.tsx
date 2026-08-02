import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Shield, ArrowRight } from 'lucide-react';
import { AppIcon } from './AppIcon';

interface SplashScreenProps {
  onDismiss: () => void;
  appName?: string;
  tagline?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onDismiss,
  appName = 'Ferio Heart AI',
  tagline = 'Your daily mood companion',
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 1200);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden select-none"
    >
      {/* Background ambient light shapes */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full flex justify-end">
        <button
          onClick={onDismiss}
          className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition border border-white/10 backdrop-blur-md cursor-pointer"
        >
          Skip
        </button>
      </div>

      <div className="flex flex-col items-center text-center my-auto max-w-sm px-4">
        {/* Animated Glowing Logo Mark */}
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: [0.8, 1.05, 1], rotate: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 blur-xl opacity-60 animate-pulse" />
          <div className="relative">
            <AppIcon size="xl" className="w-24 h-24 rounded-3xl shadow-2xl border border-white/20" />
          </div>
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="absolute -top-2 -right-2 p-1.5 bg-purple-500 rounded-full text-white shadow-lg border border-purple-300/30"
          >
            <Heart className="w-4 h-4 fill-white" />
          </motion.div>
        </motion.div>

        {/* Title & Tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent"
        >
          {appName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-3 text-sm text-indigo-200/80 leading-relaxed max-w-xs font-light"
        >
          {tagline}
        </motion.p>

        {/* Free Forever Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-xs font-medium text-indigo-300"
        >
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>100% Free Forever • No Ads or Paywalls</span>
        </motion.div>
      </div>

      {/* Footer Enter Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="w-full max-w-xs pb-6"
      >
        <button
          onClick={onDismiss}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98]"
        >
          <span>Begin Ferio Heart AI Journey</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
};
