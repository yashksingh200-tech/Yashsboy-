import React, { useState } from 'react';
import {
  BadgeCheck,
  Mail,
  LogOut,
  Type,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Mic,
  KeyRound,
  Trash2,
  Smartphone,
  Globe,
  Youtube,
  MapPin,
  MessageCircle,
  Music,
  Heart,
  Download,
  Play,
  Sparkles,
  AlertTriangle,
  Info,
  Lock,
  Star,
  Share2,
  LifeBuoy,
  PhoneCall,
  UserCheck,
  Phone,
  Save,
  Check,
  ChevronRight,
  ArrowLeft,
  User,
  Sliders,
  Database
} from 'lucide-react';
import { AuthUser, EmergencyContact, UserProfile } from '../../types';
import { VoiceSecurityConfig } from '../../utils/voiceSecurity';
import { ParsedAppCommand } from '../../utils/appControl';
import { INTERNATIONAL_CRISIS_HELPLINES, detectUserCountry } from '../../utils/crisisDetector';
import { getPrivacyConsent, savePrivacyConsent } from '../../utils/privacyConsent';
import { EmergencyLocationShare } from '../EmergencyLocationShare';
import { SecuritySafeguardsCard } from '../SecuritySafeguardsCard';
import { EmergencyContactsManager } from '../EmergencyContactsManager';

interface ProfileSubTabProps {
  user: AuthUser | null;
  userProfile: UserProfile;
  fontSize: 'small' | 'normal' | 'large';
  onUpdateFontSize?: (size: 'small' | 'normal' | 'large') => void;
  voiceSecConfig: VoiceSecurityConfig;
  handleToggleVoiceSecurity: (e: React.ChangeEvent<HTMLInputElement>) => void;
  securityToast: string | null;
  setShowVoiceEnrollModal: (show: boolean) => void;
  setShowPinModal: (show: boolean) => void;
  hasSecurityPin: () => boolean;
  handleDeleteVoiceProfile: () => void;
  parseVoiceCommand: (text: string) => ParsedAppCommand | null;
  setTestedAppCommand: (cmd: ParsedAppCommand | null) => void;
  testCommandInput: string;
  setTestCommandInput: (val: string) => void;
  setShowVoiceHelpModal: (show: boolean) => void;
  onOpenFeedback?: () => void;
  handleExportData: () => void;
  exportMessage: string | null;
  onReplaySplash: () => void;
  onReplayOnboarding?: () => void;
  setShowLogoutConfirm: (show: boolean) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  onClearAllData: () => void;
  setShowTermsModal: (show: boolean) => void;
  setShowPrivacyModal: (show: boolean) => void;
  setShowContactModal: (show: boolean) => void;
  handleShareApp: () => void;
  shareToast: string | null;
  contactToast: string | null;
  onUpdateEmergencyContact?: (contact: EmergencyContact) => void;
  onUpdateEmergencyContacts?: (contacts: EmergencyContact[]) => void;
  onUpdateCountryRegion?: (code: string) => void;
  onOpenCrisisHelp?: () => void;
  onOpenDataManager?: () => void;
}

type SubsectionType = 'account' | 'safety' | 'accessibility' | 'voice' | 'data' | null;

export const ProfileSubTab: React.FC<ProfileSubTabProps> = ({
  user,
  userProfile,
  fontSize,
  onUpdateFontSize,
  voiceSecConfig,
  handleToggleVoiceSecurity,
  securityToast,
  setShowVoiceEnrollModal,
  setShowPinModal,
  hasSecurityPin,
  handleDeleteVoiceProfile,
  parseVoiceCommand,
  setTestedAppCommand,
  testCommandInput,
  setTestCommandInput,
  setShowVoiceHelpModal,
  onOpenFeedback,
  handleExportData,
  exportMessage,
  onReplaySplash,
  onReplayOnboarding,
  setShowLogoutConfirm,
  setShowDeleteConfirm,
  onClearAllData,
  setShowTermsModal,
  setShowPrivacyModal,
  setShowContactModal,
  handleShareApp,
  shareToast,
  contactToast,
  onUpdateEmergencyContact,
  onUpdateEmergencyContacts,
  onUpdateCountryRegion,
  onOpenCrisisHelp,
  onOpenDataManager,
}) => {
  const [activeSubsection, setActiveSubsection] = useState<SubsectionType>(null);
  const [privacyConsentState, setPrivacyConsentState] = useState(getPrivacyConsent());
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactName, setContactName] = useState(userProfile.emergencyContact?.name || '');
  const [contactPhone, setContactPhone] = useState(userProfile.emergencyContact?.phone || '');
  const [contactRel, setContactRel] = useState(userProfile.emergencyContact?.relationship || 'Family / Friend');
  const [emergencyContactToast, setEmergencyContactToast] = useState<string | null>(null);

  const handleUpdatePrivacyToggle = (
    key: 'voiceRecognitionConsent' | 'aiPersonalizationConsent' | 'analyticsAndTrendConsent',
    val: boolean
  ) => {
    const updated = savePrivacyConsent({ [key]: val });
    setPrivacyConsentState(updated);
  };

  const selectedRegion = userProfile.countryRegion || detectUserCountry();

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    const newContact: EmergencyContact = {
      name: contactName.trim(),
      phone: contactPhone.trim(),
      relationship: contactRel.trim() || 'Trusted Contact',
    };

    if (onUpdateEmergencyContact) {
      onUpdateEmergencyContact(newContact);
    }
    setIsEditingContact(false);
    setEmergencyContactToast('Emergency contact saved successfully!');
    setTimeout(() => setEmergencyContactToast(null), 3000);
  };

  const menuSections = [
    {
      id: 'account' as SubsectionType,
      title: 'My Account',
      subtitle: 'Profile info, email & account session',
      icon: <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bgIcon: 'bg-indigo-100 dark:bg-indigo-950/80',
      badge: user?.provider === 'google' ? 'Google Connected' : 'Active Session',
      badgeColor: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
    },
    {
      id: 'safety' as SubsectionType,
      title: 'Safety & Emergency',
      subtitle: 'Crisis helplines, regional setup & personal emergency contact',
      icon: <LifeBuoy className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      bgIcon: 'bg-rose-100 dark:bg-rose-950/80',
      badge: userProfile.emergencyContact?.phone ? 'Contact Saved' : 'Helplines Ready',
      badgeColor: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
    },
    {
      id: 'accessibility' as SubsectionType,
      title: 'Accessibility & Display',
      subtitle: 'Font sizing & reading comfort preferences',
      icon: <Type className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bgIcon: 'bg-amber-100 dark:bg-amber-950/80',
      badge: `Text: ${fontSize.toUpperCase()}`,
      badgeColor: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    },
    {
      id: 'voice' as SubsectionType,
      title: 'Voice & Security',
      subtitle: 'Biometric voice profiles, PIN locks & Android app intents',
      icon: <Mic className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bgIcon: 'bg-emerald-100 dark:bg-emerald-950/80',
      badge: voiceSecConfig.profile ? 'Voice Lock Active' : 'Configure',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'data' as SubsectionType,
      title: 'Data & Support',
      subtitle: 'View/edit data, export logs, feedback, terms & about app',
      icon: <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      bgIcon: 'bg-purple-100 dark:bg-purple-950/80',
      badge: 'Data Control',
      badgeColor: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
    },
  ];

  // ----------------------------------------------------
  // MAIN SETTINGS MENU LIST (When no sub-section selected)
  // ----------------------------------------------------
  if (activeSubsection === null) {
    return (
      <div className="space-y-4">
        {/* Compact User Header Overview */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-md flex items-center justify-between border border-indigo-800/40">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name || userProfile.name}
                className="w-12 h-12 rounded-2xl border-2 border-indigo-400 object-cover shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                {(user?.name || userProfile.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-white">{user?.name || userProfile.name}</h3>
                <BadgeCheck className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
              </div>
              <p className="text-xs text-indigo-200/80 truncate max-w-[180px] sm:max-w-xs">{user?.email || 'user@example.com'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveSubsection('account')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-100 text-xs font-bold transition cursor-pointer backdrop-blur-xs"
          >
            Manage
          </button>
        </div>

        <div className="px-1">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Settings & Categories
          </h2>
        </div>

        {/* 5 Main Sub-Section Category Cards */}
        <div className="space-y-2.5">
          {menuSections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSubsection(sec.id)}
              className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-xs transition cursor-pointer flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-3 rounded-2xl ${sec.bgIcon} shrink-0 transition-transform group-hover:scale-105`}>
                  {sec.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {sec.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{sec.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60 hidden sm:inline-block ${sec.badgeColor}`}>
                  {sec.badge}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SUB-SECTION DETAILS VIEW (With Back Button)
  // ----------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Back Button to main menu */}
      <button
        type="button"
        onClick={() => setActiveSubsection(null)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>Back to Settings Menu</span>
      </button>

      {/* =========================================
          SUB-SECTION 1: MY ACCOUNT
         ========================================= */}
      {activeSubsection === 'account' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Account</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">User credentials & session authentication</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name || userProfile.name}
                className="w-16 h-16 rounded-2xl border-2 border-indigo-500 object-cover shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                {(user?.name || userProfile.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {user?.name || userProfile.name}
                </h3>
                <BadgeCheck className="w-4 h-4 text-indigo-500 fill-indigo-500/10" />
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email || 'user@example.com'}</span>
              </p>

              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {user?.provider === 'google' ? 'Google Account Connected' : 'Verified Ferio Member'}
              </span>
            </div>
          </div>

          {/* Session Status & Logout Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span className="font-medium text-slate-500 dark:text-slate-400">Authentication Session:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active & Secure
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200/60 dark:border-rose-900/60 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Account</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================
          SUB-SECTION 2: SAFETY & EMERGENCY
         ========================================= */}
      {activeSubsection === 'safety' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-900/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                <LifeBuoy className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Emergency & Crisis Safety
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Crisis helplines, regional setup & emergency contacts
                </p>
              </div>
            </div>

            {onOpenCrisisHelp && (
              <button
                type="button"
                onClick={onOpenCrisisHelp}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Get Help Now</span>
              </button>
            )}
          </div>

          {/* Regional Helplines Location Dropdown */}
          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-rose-500" />
                <span>Crisis Helpline Region:</span>
              </span>

              <select
                value={selectedRegion}
                onChange={(e) => onUpdateCountryRegion?.(e.target.value)}
                className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 cursor-pointer"
              >
                {Object.values(INTERNATIONAL_CRISIS_HELPLINES).map((reg) => (
                  <option key={reg.countryCode} value={reg.countryCode}>
                    {reg.flag} {reg.countryName}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Aria automatically adapts helpline suggestions to your region if you express distress or crisis thoughts.
            </p>
          </div>

          {/* Emergency Contact Setup / View Section with Native Contact Picker */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <EmergencyContactsManager
              contacts={userProfile.emergencyContacts || (userProfile.emergencyContact ? [userProfile.emergencyContact] : [])}
              primaryContact={userProfile.emergencyContact}
              onUpdateContacts={(updatedContacts) => {
                const primary = updatedContacts.find((c) => c.isPrimary) || updatedContacts[0];
                if (onUpdateEmergencyContacts) {
                  onUpdateEmergencyContacts(updatedContacts);
                } else if (onUpdateEmergencyContact && primary) {
                  onUpdateEmergencyContact(primary);
                }
              }}
            />
          </div>

          {/* Emergency Location Share Widget */}
          <EmergencyLocationShare
            emergencyContact={userProfile.emergencyContact}
            userName={userProfile.name}
          />
        </div>
      )}

      {/* =========================================
          SUB-SECTION 3: ACCESSIBILITY & DISPLAY
         ========================================= */}
      {activeSubsection === 'accessibility' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Display & Accessibility</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Font size scaling for optimum legibility</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Customize font sizing across all chat messages, check-ins, and prompts:
          </p>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {(['small', 'normal', 'large'] as const).map((size) => {
              const isSelected = fontSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onUpdateFontSize?.(size)}
                  className={`py-3 px-3 rounded-2xl border text-xs font-bold capitalize transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className={size === 'small' ? 'text-xs' : size === 'normal' ? 'text-sm' : 'text-base font-extrabold'}>
                    {size}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================
          SUB-SECTION 4: VOICE & SECURITY
         ========================================= */}
      {activeSubsection === 'voice' && (
        <div className="space-y-4 animate-fade-in">
          {/* Account Technical Safeguards & Defense in Depth */}
          <SecuritySafeguardsCard />

          {/* Biometric Voice Security Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Voice Recognition Security
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Biometric voice identification & PIN security
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceSecConfig.enabled && Boolean(voiceSecConfig.profile)}
                  onChange={handleToggleVoiceSecurity}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Enrollment Status Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500 dark:text-slate-400">Status:</span>
                {voiceSecConfig.profile ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Voice profile: Set up
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="w-3.5 h-3.5" /> Not set up yet, tap to enroll
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Your voice sample is used only to recognize you and protect your privacy. It is never shared with anyone.
              </p>
            </div>

            {securityToast && (
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 animate-fade-in px-1">
                {securityToast}
              </p>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowVoiceEnrollModal(true)}
                className="p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Mic className="w-4 h-4" />
                <span>{voiceSecConfig.profile ? 'Re-enroll Voice' : 'Enroll Voice Profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPinModal(true)}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-4 h-4 text-indigo-500" />
                <span>{hasSecurityPin() ? 'Change PIN' : 'Set Fallback PIN'}</span>
              </button>

              {voiceSecConfig.profile && (
                <button
                  type="button"
                  onClick={handleDeleteVoiceProfile}
                  className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Voice App Controls & Intent System */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Voice App Controls (Android Intents)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Launch & control installed apps via spoken voice
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceHelpModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Commands</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>Platform Integration Notice</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Uses Android Intent system to launch apps & queries.
              </p>
            </div>

            {/* Test Commands Examples */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tap an Example Command to Test:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cmd = parseVoiceCommand("Open YouTube and search coding tutorials");
                    if (cmd) setTestedAppCommand(cmd);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 text-left transition cursor-pointer flex items-center gap-2 group"
                >
                  <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-red-600">YouTube Search</p>
                    <p className="text-[10px] text-slate-500">"YouTube pe coding search karo"</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cmd = parseVoiceCommand("Open Maps and find pizza near me");
                    if (cmd) setTestedAppCommand(cmd);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 text-left transition cursor-pointer flex items-center gap-2 group"
                >
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">Google Maps</p>
                    <p className="text-[10px] text-slate-500">"Maps pe pizza dhundo"</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cmd = parseVoiceCommand("Send hello to Rahul on WhatsApp");
                    if (cmd) setTestedAppCommand(cmd);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 text-left transition cursor-pointer flex items-center gap-2 group"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">WhatsApp Message</p>
                    <p className="text-[10px] text-slate-500">"Rahul ko WhatsApp pe message bhejo"</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cmd = parseVoiceCommand("Play Arijit Singh gaana bajao");
                    if (cmd) setTestedAppCommand(cmd);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-50 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-700 text-left transition cursor-pointer flex items-center gap-2 group"
                >
                  <Music className="w-4 h-4 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600">Play Music/Video</p>
                    <p className="text-[10px] text-slate-500">"[song name] gaana bajao"</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Command Test Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!testCommandInput.trim()) return;
                const cmd = parseVoiceCommand(testCommandInput);
                if (cmd) {
                  setTestedAppCommand(cmd);
                } else {
                  alert("Could not detect app intent. Try phrasing like: 'Open YouTube and search [topic]', 'Play [song]', or 'Open Maps and find [place]'.");
                }
              }}
              className="flex gap-2 pt-1"
            >
              <input
                type="text"
                value={testCommandInput}
                onChange={(e) => setTestCommandInput(e.target.value)}
                placeholder="Type custom voice command to test..."
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                type="submit"
                className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                Test Intent
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          SUB-SECTION 5: DATA & SUPPORT
         ========================================= */}
      {activeSubsection === 'data' && (
        <div className="space-y-4 animate-fade-in">
          {/* Account & Data Management Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Account & Privacy Data Control</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                Encrypted
              </span>
            </div>

            {/* Primary Data Management Hub Button */}
            {onOpenDataManager && (
              <button
                type="button"
                onClick={onOpenDataManager}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block font-extrabold text-sm text-white">View, Edit & Delete Stored Data</span>
                    <span className="block text-[11px] text-indigo-100 font-medium">
                      Inspect chat logs, check-ins, reflections & memories
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-white/20 text-white text-[11px] font-extrabold group-hover:bg-white/30 transition">
                  Manage Data
                </span>
              </button>
            )}

            {/* Live Explicit Feature Consent Toggles */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Explicit Feature Consents</span>
              </p>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Voice Recognition & Mic</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Hands-free microphone speech input</span>
                </div>
                <input
                  type="checkbox"
                  checked={privacyConsentState.voiceRecognitionConsent}
                  onChange={(e) => handleUpdatePrivacyToggle('voiceRecognitionConsent', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-indigo-400 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">AI Memory & Customization</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Adapt responses using saved memories</span>
                </div>
                <input
                  type="checkbox"
                  checked={privacyConsentState.aiPersonalizationConsent}
                  onChange={(e) => handleUpdatePrivacyToggle('aiPersonalizationConsent', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-indigo-400 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Mood Trends & Analytics</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Calculate streak counts & weekly insights</span>
                </div>
                <input
                  type="checkbox"
                  checked={privacyConsentState.analyticsAndTrendConsent}
                  onChange={(e) => handleUpdatePrivacyToggle('analyticsAndTrendConsent', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-indigo-400 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                />
              </label>
            </div>

            <div className="space-y-2">
              {onOpenFeedback && (
                <button
                  type="button"
                  onClick={onOpenFeedback}
                  className="w-full p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200/80 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition cursor-pointer flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>Send Feedback & Rate App</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-200/60 dark:bg-indigo-800/60 text-indigo-800 dark:text-indigo-200">
                    Share Thoughts
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportData}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>Export Personal Data (JSON)</span>
                </div>
              </button>

              {exportMessage && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2">
                  {exportMessage}
                </p>
              )}

              <button
                type="button"
                onClick={onReplaySplash}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-indigo-500" />
                  <span>Replay Intro Splash Screen</span>
                </div>
              </button>

              {onReplayOnboarding && (
                <button
                  type="button"
                  onClick={onReplayOnboarding}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Replay Onboarding Tour (3 Screens)</span>
                  </div>
                </button>
              )}
            </div>

            {/* Account Deletion & Danger Zone */}
            <div className="pt-3 border-t border-rose-200/50 dark:border-rose-900/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Danger Zone</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Permanently delete your account and destroy all associated mood check-ins, chat logs, goals, and reflections.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account Permanently</span>
              </button>
            </div>

            {/* Clear Data Action */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all local check-ins, chat history, and goals?')) {
                    onClearAllData();
                  }
                }}
                className="w-full py-2 px-3 text-slate-400 hover:text-rose-500 text-xs font-medium transition cursor-pointer text-center block"
              >
                Reset All Local Data
              </button>
            </div>
          </div>

          {/* About App & Trust Section */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    About Ferio Heart AI
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Version 1.0.0 (Official Release)
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold border border-indigo-200 dark:border-indigo-800">
                v1.0.0
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500 dark:text-slate-400">Engine:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Google Gemini AI Studio</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500 dark:text-slate-400">Version:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500 dark:text-slate-400">Data Privacy:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">100% On-Device Isolation</span>
              </div>
            </div>

            {/* Legal & Trust Buttons Section */}
            <div className="pt-1 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Legal & Trust Guidelines
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>Terms of Service</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span>Privacy Policy</span>
                </button>
              </div>
            </div>

            {/* Action Buttons: Contact Us, Rate Us, Share App */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Mail className="w-4 h-4 text-indigo-500" />
                <span>Contact Us</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenFeedback) onOpenFeedback();
                }}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-950/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Rate Us</span>
              </button>

              <button
                type="button"
                onClick={handleShareApp}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4 text-emerald-500" />
                <span>Share App</span>
              </button>
            </div>

            {shareToast && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold px-2 animate-fade-in">
                {shareToast}
              </p>
            )}
            {contactToast && (
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold px-2 animate-fade-in">
                {contactToast}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

