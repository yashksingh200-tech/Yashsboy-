import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Send, CheckCircle2, MessageSquare, Mail, Sparkles } from 'lucide-react';
import { AppButton } from './AppButton';
import { useAuth } from '../context/AuthContext';
import { secureFetch } from '../utils/apiClient';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, userEmail = '' }) => {
  const { user, getAuthToken } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>(userEmail);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && rating === 0) return;

    setIsSubmitting(true);

    try {
      const res = await secureFetch('/api/feedback', {
        method: 'POST',
        userId: user?.uid || 'guest',
        token: getAuthToken(),
        body: JSON.stringify({ rating, message, email }),
      });

      if (!res.ok) throw new Error('Feedback submission failed');

      // Save locally as backup
      const existing = JSON.parse(localStorage.getItem('daily_companion_feedback_list') || '[]');
      existing.push({ rating, message, email, date: new Date().toISOString() });
      localStorage.setItem('daily_companion_feedback_list', JSON.stringify(existing));

      setSubmitted(true);
    } catch (err) {
      // Fallback local save
      const existing = JSON.parse(localStorage.getItem('daily_companion_feedback_list') || '[]');
      existing.push({ rating, message, email, date: new Date().toISOString() });
      localStorage.setItem('daily_companion_feedback_list', JSON.stringify(existing));

      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden"
        >
          <button
            type="button"
            onClick={handleResetAndClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {submitted ? (
            <div className="py-6 flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thank You for Your Feedback!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Your thoughts help us make Ferio Heart AI better every day. We appreciate your support!
              </p>
              <AppButton
                type="button"
                variant="primary"
                size="md"
                onClick={handleResetAndClose}
                fullWidth
                className="mt-3"
              >
                Close
              </AppButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Send Feedback</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">We love hearing your suggestions!</p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex flex-col items-center py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">How is your experience so far?</p>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Thoughts or Feature Requests
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you like or what we can improve..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                />
              </div>

              {/* Optional Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Email <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <AppButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
                fullWidth
              >
                Submit Feedback
              </AppButton>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
