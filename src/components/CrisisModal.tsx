import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  PhoneCall,
  MessageSquare,
  Globe,
  X,
  ShieldAlert,
  UserCheck,
  ExternalLink,
  ChevronDown,
  Check,
  AlertTriangle,
  LifeBuoy
} from 'lucide-react';
import {
  INTERNATIONAL_CRISIS_HELPLINES,
  detectUserCountry,
  CrisisHelplineRegion,
} from '../utils/crisisDetector';
import { EmergencyContact } from '../types';
import { EmergencyLocationShare } from './EmergencyLocationShare';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCountryRegion?: string;
  onUpdateCountryRegion?: (code: string) => void;
  emergencyContact?: EmergencyContact;
  userName?: string;
  onNavigateToSettings?: () => void;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({
  isOpen,
  onClose,
  userCountryRegion,
  onUpdateCountryRegion,
  emergencyContact,
  userName,
  onNavigateToSettings,
}) => {
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>(() => {
    return userCountryRegion || detectUserCountry();
  });

  const [showRegionDropdown, setShowRegionDropdown] = useState(false);

  if (!isOpen) return null;

  const currentRegion: CrisisHelplineRegion =
    INTERNATIONAL_CRISIS_HELPLINES[selectedRegionCode] ||
    INTERNATIONAL_CRISIS_HELPLINES.IN;

  const handleSelectRegion = (code: string) => {
    setSelectedRegionCode(code);
    setShowRegionDropdown(false);
    if (onUpdateCountryRegion) {
      onUpdateCountryRegion(code);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 p-4 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-white/20 backdrop-blur-xs text-white">
                <LifeBuoy className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-extrabold flex items-center gap-1.5">
                  Get Help Now • Safety & Crisis Resources
                </h2>
                <p className="text-[11px] text-rose-100 font-medium">
                  Free, confidential support available 24/7 around the clock
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-5 overflow-y-auto space-y-4">
            {/* Reassuring Banner */}
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
              <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 fill-rose-500/20" />
              <div className="text-xs text-rose-950 dark:text-rose-200 leading-relaxed">
                <p className="font-bold text-rose-700 dark:text-rose-300">
                  {userName ? `You matter, ${userName}.` : 'You matter.'} You don't have to carry this alone.
                </p>
                <p className="text-[11px] mt-0.5 text-rose-900/80 dark:text-rose-300/80">
                  If you are in immediate physical danger, please call your local emergency services (like 112 / 911 / 100) or go to the nearest emergency room.
                </p>
              </div>
            </div>

            {/* Region / Country Selector */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  Your Location / Helplines Region:
                </label>
              </div>

              <button
                type="button"
                onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold transition flex items-center justify-between cursor-pointer hover:border-indigo-500"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{currentRegion.flag}</span>
                  <span>{currentRegion.countryName}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <span>Change Region</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Region Dropdown Options */}
              {showRegionDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto">
                  {Object.values(INTERNATIONAL_CRISIS_HELPLINES).map((reg) => {
                    const isSelected = reg.countryCode === selectedRegionCode;
                    return (
                      <button
                        key={reg.countryCode}
                        type="button"
                        onClick={() => handleSelectRegion(reg.countryCode)}
                        className={`w-full px-4 py-2.5 text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{reg.flag}</span>
                          <span>{reg.countryName}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Saved Personal Emergency Contact Card */}
            {emergencyContact && emergencyContact.phone ? (
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Your Saved Emergency Contact
                    </span>
                  </div>
                  {onNavigateToSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToSettings();
                      }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-300 font-semibold hover:underline cursor-pointer"
                    >
                      Edit Contact
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {emergencyContact.name}
                      {emergencyContact.relationship && (
                        <span className="text-slate-400 font-normal ml-1">
                          ({emergencyContact.relationship})
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                      {emergencyContact.phone}
                    </p>
                  </div>

                  <a
                    href={`tel:${emergencyContact.phone.replace(/[^0-9+]/g, '')}`}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call {emergencyContact.name.split(' ')[0]}</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  No personal emergency contact saved yet.
                </span>
                {onNavigateToSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToSettings();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition cursor-pointer text-[11px]"
                  >
                    + Add Contact
                  </button>
                )}
              </div>
            )}

            {/* Prominent Emergency Location Sharing */}
            <EmergencyLocationShare
              emergencyContact={emergencyContact}
              userName={userName}
              isCrisisPrompt={true}
              onNavigateToSettings={() => {
                onClose();
                if (onNavigateToSettings) onNavigateToSettings();
              }}
            />

            {/* Regional Helplines List */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-rose-500" />
                <span>Verified Crisis Support Helplines ({currentRegion.countryName})</span>
              </h3>

              <div className="space-y-2">
                {currentRegion.helplines.map((h, idx) => {
                  const isWebOnly = h.number.startsWith('http');
                  const cleanNumber = h.number.replace(/[^0-9+]/g, '');

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {h.name}
                          </p>
                          {h.hours && (
                            <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                              {h.hours}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isWebOnly ? (
                            <a
                              href={h.number}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                            >
                              <span>Visit Website</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <>
                              {(h.type === 'both' || h.type === 'text') && (
                                <a
                                  href={`sms:${cleanNumber}`}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Text</span>
                                </a>
                              )}
                              {(h.type === 'both' || h.type === 'call') && (
                                <a
                                  href={`tel:${cleanNumber}`}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  <span>Call {h.number}</span>
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {h.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                          {h.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Global Directory Links */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                International Crisis Directories (130+ Countries)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="https://findahelpline.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <span>Find A Helpline (130+ Countries)</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href="https://www.iasp.info/resources/Crisis_Centres/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-950/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-500" />
                    <span>IASP Global Crisis Directory</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          {/* Footer Close Action */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
