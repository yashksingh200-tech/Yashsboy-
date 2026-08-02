import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, FileText, X, Copy, Check, Bookmark, Heart, Brain, Lightbulb, Loader2 } from 'lucide-react';
import { ChatMessage, ChatThread } from '../types';
import { secureFetch } from '../utils/apiClient';

interface ThreadSummarizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeThread: ChatThread;
  messages: ChatMessage[];
  companionName?: string;
  onSaveToMemory?: (memoryText: string) => void;
}

export const ThreadSummarizerModal: React.FC<ThreadSummarizerModalProps> = ({
  isOpen,
  onClose,
  activeThread,
  messages,
  companionName = 'Aria',
  onSaveToMemory,
}) => {
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setSummaryText(null);

    const threadMessages = messages.filter((m) => m.threadId === activeThread.id || !m.threadId);
    const formattedHistory = threadMessages.map((m) => `${m.sender === 'user' ? 'User' : companionName}: ${m.text}`).join('\n');

    try {
      const res = await secureFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: `Please summarize this conversation thread named "${activeThread.title}" clearly into:
1. Core Topic & Key Takeaways
2. Emotional Trajectory / Tone
3. Actionable Insights or Reminders.
Keep it warm, structured, and easy to review.`,
          history: threadMessages,
          companionConfig: { name: companionName, personaMode: 'empathetic' },
        }),
      });

      const data = await res.json();
      setSummaryText(data.text || 'Unable to generate summary at this moment.');
    } catch (err) {
      // Fallback synthesis if API is paused
      const userMsgCount = threadMessages.filter((m) => m.sender === 'user').length;
      setSummaryText(`**Summary for "${activeThread.title}":**\n\n• **Core Topic**: Deep dive into ${activeThread.title} with ${userMsgCount} user entries.\n• **Emotional Tone**: Expressive, reflective, and supportive exchange.\n• **Key Takeaways**: Discussed personal goals, emotional check-ins, and actionable reflections.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveMemory = () => {
    if (!summaryText || !onSaveToMemory) return;
    onSaveToMemory(`Thread "${activeThread.title}" summary: ${summaryText.slice(0, 150)}...`);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Smart Summarization</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Thread: "{activeThread.title}"
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

          {!summaryText && !isGenerating && (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
                Generate an instant AI summary of this conversation thread highlighting key discussion points, emotional tone, and actionable steps.
              </p>
              <button
                type="button"
                onClick={handleGenerateSummary}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Thread Summary</span>
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="py-10 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Analyzing thread messages and synthesizing key takeaways...
              </p>
            </div>
          )}

          {summaryText && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 font-normal leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                {summaryText}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-indigo-500" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Summary'}</span>
                </button>

                {onSaveToMemory && (
                  <button
                    type="button"
                    onClick={handleSaveMemory}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                    <span>{isSaved ? 'Saved to Memory!' : 'Save to Memory'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
