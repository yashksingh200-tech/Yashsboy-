import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, FileText, Mail, CheckCircle2, Lock, Send, Sparkles } from 'lucide-react';
import { AppIcon } from './AppIcon';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Terms of Service</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ferio Heart AI • Effective July 2026</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-1">
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200">
              <p className="font-semibold">Welcome to Ferio Heart AI!</p>
              <p className="mt-1">By accessing or using our application, you agree to be bound by these Terms of Service. Please read them carefully.</p>
            </div>

            <section className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Service Description</h4>
              <p>Ferio Heart AI provides a personal companion experience for daily reflection, mood tracking, and mindful support powered by generative AI models.</p>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. Not Medical Advice</h4>
              <p className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 font-medium">
                 Ferio Heart AI is designed for emotional wellbeing and self-reflection. It is NOT a substitute for professional mental health care, medical diagnosis, or therapy.
              </p>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. User Responsibilities</h4>
              <p>You are responsible for maintaining the confidentiality of your account session and credentials. You agree to use the service in compliance with applicable laws.</p>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">4. Data Ownership & Storage</h4>
              <p>You retain full ownership of all check-in entries, journal logs, and chat records created within the application. Data is saved securely in your browser and account context.</p>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">5. Updates to Terms</h4>
              <p>We may update these terms periodically. Continued usage of Ferio Heart AI indicates acceptance of any revised terms.</p>
            </section>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
            >
              I Understand & Agree
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Privacy Policy</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your privacy is our highest priority</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-1">
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Zero-Tracking Assurance</p>
                <p className="mt-0.5">We do not sell, rent, or share your personal reflections, voice audio, or mood check-ins with third parties or data brokers.</p>
              </div>
            </div>

            <section className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Data Collection</h4>
              <p>We only process data necessary to power your personal companion features, including mood check-ins, journal reflections, and voice interactions.</p>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. Generative AI Processing</h4>
              <p>Conversations with Aria are routed via secure full-stack server-side endpoints to Gemini AI. API calls are ephemeral and not used to train global public AI models.</p>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. Local & Account Storage</h4>
              <p>All your personal logs are stored securely in isolated client storage tied to your user session. You can export your data in JSON format at any time from Settings.</p>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">4. Permanent Deletion</h4>
              <p>You have the right to permanently erase your account and all associated mood check-ins, audio preferences, and reflections instantly via Settings &gt; Delete Account.</p>
            </section>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
            >
              Close Policy
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setSubject('');
      setMessage('');
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <AppIcon size="md" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Contact Us & Support</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">We're here to help you every step of the way</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {sent ? (
            <div className="py-8 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Message Sent!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                Thank you for reaching out to the Ferio Heart AI team. We've received your inquiry and will respond shortly!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic / Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g., Question about Voice Calls or Check-in Streak"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can we assist you with your Ferio Heart AI experience?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Or email direct support at <strong>support@ferioheart.ai</strong></span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
