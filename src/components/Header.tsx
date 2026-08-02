import React from 'react';
import { Moon, Sun, Flame, PhoneCall, LifeBuoy } from 'lucide-react';
import { CompanionConfig } from '../types';
import { AriaAvatar } from './AriaAvatar';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  companion: CompanionConfig;
  streakDays: number;
  onStartVoiceCall?: () => void;
  onOpenCrisisHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  companion,
  streakDays,
  onStartVoiceCall,
  onOpenCrisisHelp,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800 transition-colors shadow-2xs">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* App & Companion Title */}
        <div className="flex items-center gap-2.5">
          <AriaAvatar size="sm" status="idle" onClick={onStartVoiceCall} />

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                {companion.name}
              </h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Ferio Heart AI
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Permanent Get Help Now / Crisis Button */}
          {onOpenCrisisHelp && (
            <button
              onClick={onOpenCrisisHelp}
              title="Get Help Now - Regional Crisis Helplines & Emergency Contacts"
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-xs font-extrabold transition cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
            >
              <LifeBuoy className="w-3.5 h-3.5 animate-pulse text-rose-500" />
              <span className="hidden sm:inline">Get Help</span>
            </button>
          )}

          {/* Streak Counter */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-bounce" />
            <span>{streakDays}d</span>
          </div>

          {/* Quick Voice Call Launch */}
          {onStartVoiceCall && (
            <button
              onClick={onStartVoiceCall}
              title="Start Voice Call"
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 transition cursor-pointer border border-indigo-200/50 dark:border-indigo-800/50"
            >
              <PhoneCall className="w-4 h-4" />
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
