import React from 'react';
import { Target, CheckCircle2, Save, Bell, BellOff, Moon, Sun, Globe } from 'lucide-react';

import { VoiceLanguageSetting } from '../../utils/speech';

interface GoalsSubTabProps {
  goalsText: string;
  setGoalsText: (text: string) => void;
  handleSaveGoals: (e: React.FormEvent) => void;
  goalsSavedSuccess: boolean;
  notificationsEnabled: boolean;
  handleToggleNotifications: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  voiceLang: VoiceLanguageSetting;
  handleVoiceLangChange: (lang: VoiceLanguageSetting) => void;
}

export const GoalsSubTab: React.FC<GoalsSubTabProps> = ({
  goalsText,
  setGoalsText,
  handleSaveGoals,
  goalsSavedSuccess,
  notificationsEnabled,
  handleToggleNotifications,
  darkMode,
  onToggleDarkMode,
  voiceLang,
  handleVoiceLangChange,
}) => {
  return (
    <div className="space-y-5">
      {/* Editable "My Goals" Text Section */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Personal Goals</h3>
          </div>
          {goalsSavedSuccess && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Profile!
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Write your goals below (one goal per line). Your companion will refer to these goals to keep you motivated.
        </p>

        <form onSubmit={handleSaveGoals} className="space-y-3">
          <textarea
            rows={4}
            value={goalsText}
            onChange={(e) => setGoalsText(e.target.value)}
            placeholder="• Walk 20 minutes daily&#10;• Practice mindfulness before sleep&#10;• Stay hydrated and active..."
            className="w-full text-xs p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-medium leading-relaxed"
          />

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save My Goals</span>
          </button>
        </form>
      </div>

      {/* Notification Preferences & Dark Mode Toggles */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">App Preferences</h3>

        <div className="space-y-3">
          {/* Notification Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Daily Check-in Reminders
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Receive a push prompt at 9:00 AM daily
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Dark Theme Mode</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {darkMode ? 'Dark display enabled' : 'Light display enabled'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                darkMode ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  darkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Voice Language Preference Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Text-to-Speech Voice Language</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Choose voice language for spoken AI messages
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { id: 'auto' as const, label: 'Auto (match language)' },
                { id: 'hindi' as const, label: 'Hindi Voice' },
                { id: 'english' as const, label: 'English Voice' },
              ].map((opt) => {
                const isActive = voiceLang === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleVoiceLangChange(opt.id)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition cursor-pointer text-center border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
