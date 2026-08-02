import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, KeyRound, AlertTriangle, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { verifySecurityPin, hasSecurityPin } from '../utils/voiceSecurity';

interface PinSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customMessage?: string;
}

export const PinSecurityModal: React.FC<PinSecurityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customMessage = "I don't recognize this voice. Please unlock the app normally to continue.",
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg(null);

    if (nextPin.length === 4) {
      if (verifySecurityPin(nextPin)) {
        onSuccess();
        onClose();
        setPin('');
      } else {
        setErrorMsg("Incorrect Security PIN. Please try again.");
        setTimeout(() => setPin(''), 500);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-5 text-center"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Voice Security Verification
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed px-2">
              {customMessage}
            </p>
          </div>

          {/* PIN Dots */}
          <div className="flex items-center justify-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = idx < pin.length;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 border ${
                    isFilled
                      ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-sm'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                  }`}
                />
              );
            })}
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 animate-bounce">
              {errorMsg}
            </p>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                className="py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-900 dark:text-white font-bold text-base transition cursor-pointer active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-900 dark:text-white font-bold text-base transition cursor-pointer active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              ⌫
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
