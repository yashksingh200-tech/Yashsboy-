import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  KeyRound,
  History,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Database,
  FileCode,
  Smartphone,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSecurityAuditLogs } from '../utils/securityGuard';

export const SecuritySafeguardsCard: React.FC = () => {
  const { user, getAuthToken } = useAuth();
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  const logs = user?.uid ? getSecurityAuditLogs(user.uid) : [];
  const token = getAuthToken();

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Account Security & Technical Safeguards</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                ACTIVE
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Multi-layer defense in depth protecting your personal data
            </p>
          </div>
        </div>
      </div>

      {/* Safeguards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Item 1: AES-256 Encryption */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>AES-256-GCM Encryption At Rest</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            All chat histories, check-ins, reflections, and goals are encrypted before being written to storage.
          </p>
        </div>

        {/* Item 2: Data Isolation & Auth Verification */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Strict Per-User Data Isolation</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Every query verifies cryptographic session signature <code className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded">{user?.uid || 'guest'}</code>.
          </p>
        </div>

        {/* Item 3: Rate Limiting / Brute-Force Shield */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Brute-Force Rate Limiter</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Maximum 5 login attempts before temporary 15-minute account lockout to prevent password guessing.
          </p>
        </div>

        {/* Item 4: Session Inactivity Auto-Logout */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Clock className="w-4 h-4 text-purple-500 shrink-0" />
            <span>15-Minute Inactivity Safeguard</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Sessions automatically terminate after 15 minutes of inactivity to protect left-open browser tabs.
          </p>
        </div>
      </div>

      {/* Active Session Token Inspection */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs space-y-1.5">
        <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-200">
          <span className="flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Active Authenticated Session Signature</span>
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">Verified Token</span>
        </div>
        <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900">
          {token}
        </p>
      </div>

      {/* Security Audit Log Trigger */}
      <div>
        <button
          type="button"
          onClick={() => setShowAuditLogs(!showAuditLogs)}
          className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <History className="w-4 h-4 text-indigo-500" />
            <span>Security Audit Logs ({logs.length} Recorded Events)</span>
          </span>
          {showAuditLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {showAuditLogs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-1.5 overflow-hidden"
            >
              {logs.length === 0 ? (
                <p className="text-[11px] text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center">
                  No security events recorded yet.
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/60 text-[11px] flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-slate-900 dark:text-white">
                        {log.eventType.replace('_', ' ')}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px]">{log.description}</p>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Honest Technical Note / Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
        <p className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <EyeOff className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Honest Security Commitment & Defense-in-Depth</span>
        </p>
        <p>
          No computer system can be claimed as 100% unhackable. Our goal is to implement industry-standard best practices that make unauthorized access as technically difficult as possible.
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          Ferio Heart AI combines zero plain-text local storage, PBKDF2 key derivation, per-user token isolation, input sanitization, and AES-256-GCM encryption at rest following standards used by reputable services.
        </p>
      </div>
    </div>
  );
};
