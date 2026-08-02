import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Calendar, X, Check, BellRing, Sparkles } from 'lucide-react';
import { ScheduledFollowUp } from '../types';

interface ScheduledFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeThreadId?: string;
  onAddFollowUp: (followUp: ScheduledFollowUp) => void;
}

export const ScheduledFollowUpModal: React.FC<ScheduledFollowUpModalProps> = ({
  isOpen,
  onClose,
  activeThreadId,
  onAddFollowUp,
}) => {
  const [note, setNote] = useState('');
  const [timeframe, setTimeframe] = useState<'1h' | 'tonight' | 'tomorrow_morn' | 'tomorrow_eve' | '3days'>('tomorrow_morn');

  if (!isOpen) return null;

  const calculateTargetTime = (tf: string) => {
    const now = new Date();
    if (tf === '1h') {
      now.setHours(now.getHours() + 1);
    } else if (tf === 'tonight') {
      now.setHours(20, 0, 0, 0);
      if (now.getTime() <= Date.now()) now.setDate(now.getDate() + 1);
    } else if (tf === 'tomorrow_morn') {
      now.setDate(now.getDate() + 1);
      now.setHours(9, 0, 0, 0);
    } else if (tf === 'tomorrow_eve') {
      now.setDate(now.getDate() + 1);
      now.setHours(18, 0, 0, 0);
    } else if (tf === '3days') {
      now.setDate(now.getDate() + 3);
      now.setHours(10, 0, 0, 0);
    }
    return now.toISOString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    const newFollowUp: ScheduledFollowUp = {
      id: `fup-${Date.now()}`,
      threadId: activeThreadId,
      note: note.trim(),
      scheduledTime: calculateTargetTime(timeframe),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    onAddFollowUp(newFollowUp);
    setNote('');
    onClose();
  };

  const timeframeOptions = [
    { id: '1h', label: 'In 1 Hour' },
    { id: 'tonight', label: 'Tonight (8 PM)' },
    { id: 'tomorrow_morn', label: 'Tomorrow Morning (9 AM)' },
    { id: 'tomorrow_eve', label: 'Tomorrow Evening (6 PM)' },
    { id: '3days', label: 'In 3 Days' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Schedule Follow-up</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Ask Aria to check in on something later
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                What should Aria follow up on? *
              </label>
              <input
                type="text"
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Ask me about my job interview results"
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                Select Timeframe:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {timeframeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTimeframe(opt.id as any)}
                    className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                      timeframe === opt.id
                        ? 'bg-amber-600 text-white font-extrabold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!note.trim()}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <BellRing className="w-4 h-4" />
              <span>Confirm Scheduled Follow-up</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
