import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Heart, X, Sparkles, Send, ThumbsUp } from 'lucide-react';
import { secureFetch } from '../utils/apiClient';

interface RatingPromptModalProps {
  checkInCount: number;
  userCreatedDate?: string; // ISO date string
}

export const RatingPromptModal: React.FC<RatingPromptModalProps> = ({ checkInCount, userCreatedDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Check if user already rated or dismissed
    const ratedState = localStorage.getItem('daily_companion_rated');
    const dismissedState = localStorage.getItem('daily_companion_rate_dismissed_until');

    if (ratedState === 'true') return;

    // Check if dismissed recently (e.g., within 3 days)
    if (dismissedState && Date.now() < Number(dismissedState)) return;

    // Check conditions: 5 check-ins OR 7 days since app start
    let daysOld = 0;
    const firstUsed = localStorage.getItem('daily_companion_first_used');
    if (firstUsed) {
      daysOld = (Date.now() - Number(firstUsed)) / (1000 * 60 * 60 * 24);
    } else {
      localStorage.setItem('daily_companion_first_used', String(Date.now()));
    }

    if (checkInCount >= 5 || daysOld >= 7) {
      // Delay popup slightly after screen mount so it's pleasant
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [checkInCount]);

  const handleDismiss = () => {
    setIsOpen(false);
    // Dismiss for 3 days
    localStorage.setItem('daily_companion_rate_dismissed_until', String(Date.now() + 3 * 24 * 60 * 60 * 1000));
  };

  const handleNeverShow = () => {
    setIsOpen(false);
    localStorage.setItem('daily_companion_rated', 'true');
  };

  const handleSubmitRating = async () => {
    try {
      await secureFetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          rating: selectedRating,
          message: feedbackMessage || `Rated ${selectedRating} stars via automatic prompt`,
        }),
      });
    } catch (e) {}

    localStorage.setItem('daily_companion_rated', 'true');
    setIsSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 20 }}
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center relative overflow-hidden"
        >
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {isSubmitted ? (
            <div className="py-4 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Heart className="w-6 h-6 fill-indigo-600 dark:fill-indigo-400 animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Thank You for Rating Us!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your support keeps Ferio Heart AI growing every day!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Enjoying Ferio Heart AI?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  You've checked in <strong>{checkInCount} times</strong>! Would you take 10 seconds to rate your experience?
                </p>
              </div>

              {/* Star Rating Select */}
              <div className="flex items-center justify-center gap-1.5 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= selectedRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Short comment input */}
              <input
                type="text"
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Any quick thoughts? (optional)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleSubmitRating}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Submit {selectedRating}-Star Rating</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  Maybe later
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
