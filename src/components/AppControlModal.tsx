import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ExternalLink,
  X,
  Volume2,
  Smartphone,
  Info,
  Youtube,
  Search,
  MapPin,
  Music,
  MessageCircle,
  Play,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { ParsedAppCommand, executeAppCommand } from '../utils/appControl';
import { speakMessage, stopSpeech } from '../utils/speech';

interface AppControlModalProps {
  command: ParsedAppCommand | null;
  onClose: () => void;
}

export const AppControlModal: React.FC<AppControlModalProps> = ({ command, onClose }) => {
  const [countdown, setCountdown] = useState<number>(4);
  const [isCanceled, setIsCanceled] = useState<boolean>(false);
  const [appNotInstalledWarning, setAppNotInstalledWarning] = useState<boolean>(false);
  const [showPlatformInfo, setShowPlatformInfo] = useState<boolean>(false);

  useEffect(() => {
    if (!command) return;

    setIsCanceled(false);
    setCountdown(4);
    setAppNotInstalledWarning(false);

    // Speak aloud the confirmation message
    speakMessage(command.spokenConfirmation, 'auto');

    // Countdown timer before auto-executing
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleRunNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [command]);

  if (!command) return null;

  const handleRunNow = () => {
    stopSpeech();
    executeAppCommand(command);

    // Friendly check notice
    setTimeout(() => {
      setAppNotInstalledWarning(true);
    }, 1500);
  };

  const handleCancel = () => {
    stopSpeech();
    setIsCanceled(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getAppIcon = () => {
    switch (command.type) {
      case 'youtube_search':
        return <Youtube className="w-8 h-8 text-red-500" />;
      case 'maps_search':
        return <MapPin className="w-8 h-8 text-emerald-500" />;
      case 'whatsapp_message':
        return <MessageCircle className="w-8 h-8 text-emerald-600" />;
      case 'play_music':
        return <Music className="w-8 h-8 text-purple-500" />;
      case 'google_search':
      default:
        return <Search className="w-8 h-8 text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 20 }}
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden"
        >
          {/* Close / Cancel Button */}
          <button
            type="button"
            onClick={handleCancel}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* App Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-xs flex items-center justify-center">
              {getAppIcon()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Voice App Intent
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500">
                  Android
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Launching {command.appName}
              </h3>
            </div>
          </div>

          {/* Command Details & Spoken Confirmation */}
          <div className="py-4 space-y-3">
            <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-left space-y-1.5">
              <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Volume2 className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <span>Spoken Confirmation</span>
                </div>
                <button
                  type="button"
                  onClick={() => speakMessage(command.spokenConfirmation, 'auto')}
                  className="text-[10px] font-semibold hover:underline cursor-pointer"
                >
                  Replay Voice
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                "{command.spokenConfirmation}"
              </p>
            </div>

            {/* Specific Command Metadata */}
            {command.query && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Search Query:</span>
                <span className="font-bold text-slate-900 dark:text-white">{command.query}</span>
              </div>
            )}

            {command.contact && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Recipient Contact:</span>
                <span className="font-bold text-slate-900 dark:text-white">{command.contact}</span>
              </div>
            )}

            {command.message && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Pre-filled Message:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">"{command.message}"</span>
              </div>
            )}

            {/* Note on manual send for WhatsApp security */}
            {command.type === 'whatsapp_message' && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic text-center">
                🔒 For security reasons, WhatsApp opens with pre-filled text so you can tap Send manually.
              </p>
            )}

            {/* App Not Installed Banner */}
            {appNotInstalledWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>If {command.appName} didn't open:</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  If this app isn't installed on your device, we opened the web version in a browser tab!
                </p>
              </motion.div>
            )}
          </div>

          {/* Action Buttons & Timer */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleRunNow}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>
                {countdown > 0 ? `Opening in ${countdown}s... (Tap to Launch Now)` : `Open ${command.appName} Now`}
              </span>
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold transition cursor-pointer"
              >
                Cancel Command
              </button>

              <button
                type="button"
                onClick={() => setShowPlatformInfo(!showPlatformInfo)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Android vs iOS Info</span>
              </button>
            </div>
          </div>

          {/* Platform Info Accordion */}
          {showPlatformInfo && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed text-left"
            >
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                Platform Requirements
              </p>
              <p>
                • <strong>Android:</strong> Uses Android's Intent system (ACTION_VIEW, ACTION_SEND) to launch installed native apps.
              </p>
              <p>
                • <strong>iOS / Web:</strong> iOS restricts direct deep linking for third-party apps due to platform security. Web browser fallbacks are used automatically.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
