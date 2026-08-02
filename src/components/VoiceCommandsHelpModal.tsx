import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mic,
  Compass,
  Smile,
  Target,
  Settings,
  Smartphone,
  Sparkles,
  Volume2,
  Check,
  Search,
} from 'lucide-react';

interface VoiceCommandsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand?: (cmd: string) => void;
}

export const VoiceCommandsHelpModal: React.FC<VoiceCommandsHelpModalProps> = ({
  isOpen,
  onClose,
  onSelectCommand,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    {
      title: 'Navigation Commands',
      icon: <Compass className="w-4 h-4 text-indigo-500" />,
      color: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
      commands: [
        { en: 'Go to home', hi: 'Home dikhao / Ghar jao', action: 'Navigates to Home screen' },
        { en: 'Open chat', hi: 'Chat kholo / Baat karo', action: 'Navigates to Chat screen' },
        { en: 'Show my progress', hi: 'Progress dikhao / Analytics', action: 'Navigates to Progress screen' },
        { en: 'Open profile', hi: 'Profile kholo / Settings kholo', action: 'Navigates to Profile & Settings' },
      ],
    },
    {
      title: 'Actions & Daily Mood Log',
      icon: <Smile className="w-4 h-4 text-emerald-500" />,
      color: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
      commands: [
        { en: 'Start check-in', hi: 'Check-in karo', action: 'Opens daily mood selector' },
        { en: "I'm feeling happy", hi: 'Mujhe khushi ho rahi hai', action: 'Auto-logs Happy mood' },
        { en: 'I feel stressed', hi: 'Mujhe tanaav ho raha hai', action: 'Auto-logs Stressed mood' },
        { en: 'Feeling calm', hi: 'Mujhe shanti mehsus ho rahi hai', action: 'Auto-logs Calm mood' },
      ],
    },
    {
      title: 'Goal Management',
      icon: <Target className="w-4 h-4 text-purple-500" />,
      color: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
      commands: [
        { en: 'Read my goals', hi: 'Mere goals padho', action: 'AI speaks saved goals aloud' },
        { en: 'Add a goal: Drink 2L water', hi: 'Goal add karo: 2L paani piyo', action: 'Saves new goal to profile' },
      ],
    },
    {
      title: 'Settings & Appearance',
      icon: <Settings className="w-4 h-4 text-amber-500" />,
      color: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      commands: [
        { en: 'Turn on dark mode', hi: 'Dark mode on karo', action: 'Switches to Dark theme' },
        { en: 'Turn off dark mode', hi: 'Light mode karo', action: 'Switches to Light theme' },
        { en: 'Turn off notifications', hi: 'Notification band karo', action: 'Toggles notification alert' },
        { en: 'Log me out', hi: 'Logout karo', action: 'Logs out of account' },
      ],
    },
    {
      title: 'App Control (Android Intents)',
      icon: <Smartphone className="w-4 h-4 text-red-500" />,
      color: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
      commands: [
        { en: 'Open YouTube and search lofi music', hi: 'YouTube pe lofi music search karo', action: 'Launches YouTube search' },
        { en: 'Open Maps and find pizza near me', hi: 'Maps pe pizza dhundo', action: 'Launches Google Maps' },
        { en: 'Send hello to Rahul on WhatsApp', hi: 'Rahul ko WhatsApp pe message bhejo hello', action: 'Launches WhatsApp prefilled' },
        { en: 'Play Arijit Singh songs', hi: 'Arijit Singh gaana bajao', action: 'Launches Music player search' },
      ],
    },
  ];

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      commands: cat.commands.filter(
        (cmd) =>
          cmd.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cmd.hi.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cmd.action.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.commands.length > 0);

  const handleTestCommand = (text: string) => {
    if (onSelectCommand) {
      onSelectCommand(text);
      onClose();
    } else {
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 my-8 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Mic className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Voice Commands Directory
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  English & Hindi (हिन्दी) Voice Controls
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search command e.g. 'home', 'dark mode', 'music'..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Commands List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {filteredCategories.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No commands matching "{searchQuery}". Try searching "home", "goals", or "chat".
              </div>
            ) : (
              filteredCategories.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {cat.icon}
                    <span>{cat.title}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {cat.commands.map((cmd, cIdx) => (
                      <div
                        key={cIdx}
                        className={`p-3 rounded-2xl border transition flex items-start justify-between gap-3 ${cat.color}`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              "{cmd.en}"
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-white/70 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700">
                              हिन्दी: "{cmd.hi}"
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            {cmd.action}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTestCommand(cmd.en)}
                          className="shrink-0 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 text-[11px] font-bold shadow-2xs border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1"
                          title="Try this command"
                        >
                          {copiedText === cmd.en ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>Try</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span className="text-[11px]">
              Tap <strong>"Try"</strong> on any command to test it directly.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition cursor-pointer"
            >
              Close Directory
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
