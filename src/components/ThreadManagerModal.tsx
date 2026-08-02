import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Plus, Trash2, Edit2, X, Check, FolderPlus, Sparkles } from 'lucide-react';
import { ChatThread } from '../types';

interface ThreadManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  threads: ChatThread[];
  activeThreadId: string;
  onCreateThread: (title: string, category?: string, icon?: string, initialGreeting?: string) => void;
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
}

export const ThreadManagerModal: React.FC<ThreadManagerModalProps> = ({
  isOpen,
  onClose,
  threads,
  activeThreadId,
  onCreateThread,
  onSelectThread,
  onDeleteThread,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<{ label: string; icon: string }>({
    label: 'Work Stress',
    icon: '💼',
  });

  const threadTemplates = [
    {
      title: 'Vent Session',
      icon: '🌿',
      category: 'Mindful Venting',
      greeting: "I'm here to listen without judgment. What's weighing on your mind today? Take your time.",
    },
    {
      title: 'Goal Planning',
      icon: '🎯',
      category: 'Fitness & Health',
      greeting: "Let's turn your aspirations into realistic, actionable steps. What goal would you like to focus on?",
    },
    {
      title: 'Just Chatting',
      icon: '☕',
      category: 'Daily Life',
      greeting: "Hey there! How's your day unfolding? I'm always happy to chat about anything on your mind.",
    },
    {
      title: 'Reflection Time',
      icon: '✨',
      category: 'Creative Ideas',
      greeting: "Taking a moment to pause is powerful. What experiences or thoughts stand out to you today?",
    },
  ];

  const presetCategories = [
    { label: 'Work & Career', icon: '💼' },
    { label: 'Fitness & Health', icon: '🎯' },
    { label: 'Mindful Venting', icon: '🌿' },
    { label: 'Creative Ideas', icon: '🎨' },
    { label: 'Relationships', icon: '❤️' },
    { label: 'Daily Life', icon: '💬' },
  ];

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateThread(newTitle.trim(), selectedCategory.label, selectedCategory.icon);
    setNewTitle('');
    onClose();
  };

  const handleApplyTemplate = (tmpl: typeof threadTemplates[0]) => {
    onCreateThread(tmpl.title, tmpl.category, tmpl.icon, tmpl.greeting);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-5 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Topic Threads
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Organize your conversations with Aria
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick-Start Thread Templates */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Quick Thread Templates:</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {threadTemplates.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 text-left transition cursor-pointer flex items-center gap-2 group"
                >
                  <span className="text-sm p-1 rounded-lg bg-white dark:bg-slate-800 shadow-xs">{tmpl.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                      {tmpl.title}
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                      {tmpl.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Create New Custom Thread Form */}
          <form onSubmit={handleCreate} className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Create New Named Thread
            </label>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Work Stress, Fitness Goals..."
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Category Pills */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400">Select Topic Type:</p>
              <div className="flex flex-wrap gap-1.5">
                {presetCategories.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition cursor-pointer flex items-center gap-1 ${
                      selectedCategory.label === cat.label
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* List of Existing Threads */}
          <div className="space-y-2 max-h-52 overflow-y-auto">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Your Active Threads ({threads.length}):
            </p>
            <div className="space-y-1.5">
              {threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    className={`p-2.5 rounded-2xl border transition flex items-center justify-between text-xs ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-bold'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectThread(thread.id);
                        onClose();
                      }}
                      className="flex-1 flex items-center gap-2 text-left cursor-pointer"
                    >
                      <span className="text-base">{thread.icon || '💬'}</span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{thread.title}</span>
                          {isActive && (
                            <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                              Active
                            </span>
                          )}
                        </p>
                        {thread.category && (
                          <p className="text-[10px] text-slate-400 font-normal">{thread.category}</p>
                        )}
                      </div>
                    </button>

                    {thread.id !== 'thread-default' && (
                      <button
                        type="button"
                        onClick={() => onDeleteThread(thread.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete Thread"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
