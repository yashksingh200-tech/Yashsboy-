import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Target, Bot, Heart, Zap, Compass, Sparkles, Smile, X, AlertTriangle, Trash2 } from 'lucide-react';
import { CompanionConfig, PersonaMode, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { secureFetch } from '../utils/apiClient';
import { TermsModal, PrivacyModal, ContactModal } from './LegalModals';
import { getVoiceLanguageSetting, setVoiceLanguageSetting, VoiceLanguageSetting } from '../utils/speech';
import { parseVoiceCommand, ParsedAppCommand } from '../utils/appControl';
import { VoiceCommandsHelpModal } from './VoiceCommandsHelpModal';
import { VoiceEnrollmentModal } from './VoiceEnrollmentModal';
import { PinSecurityModal } from './PinSecurityModal';
import {
  getVoiceSecurityConfig,
  setVoiceSecurityEnabled,
  deleteVoiceProfile,
  hasSecurityPin,
} from '../utils/voiceSecurity';
import { ProfileSubTab } from './profile/ProfileSubTab';
import { GoalsSubTab } from './profile/GoalsSubTab';
import { CompanionSubTab } from './profile/CompanionSubTab';
import { DataManagerModal } from './DataManagerModal';

interface ProfileTabProps {
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  companion: CompanionConfig;
  onUpdateCompanion: (config: CompanionConfig) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  fontSize?: 'small' | 'normal' | 'large';
  onUpdateFontSize?: (size: 'small' | 'normal' | 'large') => void;
  onReplaySplash: () => void;
  onReplayOnboarding?: () => void;
  onOpenFeedback?: () => void;
  onClearAllData: () => void;
  onOpenCrisisHelp?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  userProfile,
  onUpdateUserProfile,
  companion,
  onUpdateCompanion,
  darkMode,
  onToggleDarkMode,
  fontSize = 'normal',
  onUpdateFontSize,
  onReplaySplash,
  onReplayOnboarding,
  onOpenFeedback,
  onClearAllData,
  onOpenCrisisHelp,
}) => {
  const { user, logout, deleteAccount, getAuthToken } = useAuth();

  // Internal Sub-tab Navigation
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'goals' | 'companion'>('profile');

  // Modal & Toast States
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDataManagerModal, setShowDataManagerModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [contactToast, setContactToast] = useState<string | null>(null);

  const handleShareApp = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Ferio Heart AI',
          text: 'Try Ferio Heart AI for your daily mood tracking and wellness support!',
          url: window.location.href,
        });
        setShareToast('Thank you for sharing Ferio Heart AI!');
        setTimeout(() => setShareToast(null), 3000);
      } catch (err) {
        copyShareLink();
      }
    } else {
      copyShareLink();
    }
  };

  const copyShareLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareToast('App link copied to clipboard!');
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  const [editingUserName, setEditingUserName] = useState(userProfile.name);
  const [editingCompanionName, setEditingCompanionName] = useState(companion.name);

  // Editable Goals state
  const [goalsText, setGoalsText] = useState(() => (userProfile.goals || []).join('\n'));
  const [goalsSavedSuccess, setGoalsSavedSuccess] = useState(false);

  // Notification Preference state
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('daily_companion_notifications');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Voice Language Preference state
  const [voiceLang, setVoiceLang] = useState<VoiceLanguageSetting>(getVoiceLanguageSetting);

  const handleVoiceLangChange = (newLang: VoiceLanguageSetting) => {
    setVoiceLang(newLang);
    setVoiceLanguageSetting(newLang);
  };

  // Memory manager state
  const [newMemoryText, setNewMemoryText] = useState('');

  // Voice Recognition Security state
  const [voiceSecConfig, setVoiceSecConfig] = useState(getVoiceSecurityConfig);
  const [showVoiceEnrollModal, setShowVoiceEnrollModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [securityToast, setSecurityToast] = useState<string | null>(null);

  const refreshVoiceSecConfig = () => {
    setVoiceSecConfig(getVoiceSecurityConfig());
  };

  const handleToggleVoiceSecurity = () => {
    if (!voiceSecConfig.profile) {
      setShowVoiceEnrollModal(true);
      return;
    }
    const nextVal = !voiceSecConfig.enabled;
    setVoiceSecurityEnabled(nextVal);
    refreshVoiceSecConfig();
    setSecurityToast(nextVal ? 'Voice Recognition Security enabled!' : 'Voice Recognition Security disabled.');
    setTimeout(() => setSecurityToast(null), 3000);
  };

  const handleDeleteVoiceProfile = () => {
    deleteVoiceProfile();
    refreshVoiceSecConfig();
    setSecurityToast('Voice profile deleted successfully.');
    setTimeout(() => setSecurityToast(null), 3000);
  };

  // App Control Test State
  const [testCommandInput, setTestCommandInput] = useState('');
  const [testedAppCommand, setTestedAppCommand] = useState<ParsedAppCommand | null>(null);
  const [showVoiceHelpModal, setShowVoiceHelpModal] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleToggleNotifications = () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    localStorage.setItem('daily_companion_notifications', JSON.stringify(nextVal));
  };

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedGoals = goalsText
      .split('\n')
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    onUpdateUserProfile({ ...userProfile, goals: updatedGoals });
    setGoalsSavedSuccess(true);
    setTimeout(() => setGoalsSavedSuccess(false), 2500);
  };

  const handleSaveNames = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile({ ...userProfile, name: editingUserName });
    onUpdateCompanion({ ...companion, name: editingCompanionName });
  };

  const [editingMemoryIdx, setEditingMemoryIdx] = useState<number | null>(null);
  const [editingMemoryValue, setEditingMemoryValue] = useState<string>('');

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    const updated = [...userProfile.memories, newMemoryText.trim()];
    onUpdateUserProfile({ ...userProfile, memories: updated });
    setNewMemoryText('');
  };

  const handleRemoveMemory = (index: number) => {
    const updated = userProfile.memories.filter((_, i) => i !== index);
    onUpdateUserProfile({ ...userProfile, memories: updated });
    if (editingMemoryIdx === index) setEditingMemoryIdx(null);
  };

  const handleStartEditMemory = (index: number, text: string) => {
    setEditingMemoryIdx(index);
    setEditingMemoryValue(text);
  };

  const handleSaveEditMemory = (index: number) => {
    if (!editingMemoryValue.trim()) return;
    const updated = [...userProfile.memories];
    updated[index] = editingMemoryValue.trim();
    onUpdateUserProfile({ ...userProfile, memories: updated });
    setEditingMemoryIdx(null);
  };

  const handleExportData = () => {
    const dataObj = {
      userProfile,
      companion,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ferio-heart-ai-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setExportMessage('Data exported successfully!');
    setTimeout(() => setExportMessage(null), 3000);
  };

  const personasList: { id: PersonaMode; label: string; desc: string; icon: any }[] = [
    { id: 'adaptive', label: 'Smart Adaptive Blend', desc: 'Auto-blends tones based on context, emotions & time of day', icon: Sparkles },
    { id: 'empathetic', label: 'Empathetic Friend', desc: 'Warm, supportive, active listener', icon: Heart },
    { id: 'coach', label: 'Life Coach', desc: 'Motivating, clear, goal-oriented', icon: Zap },
    { id: 'mindful', label: 'Mindful Guide', desc: 'Peaceful, grounding, meditative', icon: Compass },
    { id: 'creative', label: 'Creative Partner', desc: 'Imaginative, curious, inspiring', icon: Sparkles },
    { id: 'calm', label: 'Calm Sounding Board', desc: 'Balanced, reassuring, neutral', icon: Smile },
  ];

  return (
    <div className="space-y-5 pb-24 max-w-md mx-auto px-4 pt-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Profile & Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          Manage your profile details, personal goals, and companion settings.
        </p>
      </div>

      {/* Segmented Sub-tab Navigation Bar */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('goals')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'goals'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Goals & Prefs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('companion')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'companion'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>{companion.name || 'Aria'} Settings</span>
        </button>
      </div>

      {/* Tab 1: Profile SubTab */}
      {activeSubTab === 'profile' && (
        <ProfileSubTab
          user={user}
          userProfile={userProfile}
          fontSize={fontSize}
          onUpdateFontSize={onUpdateFontSize}
          voiceSecConfig={voiceSecConfig}
          handleToggleVoiceSecurity={handleToggleVoiceSecurity}
          securityToast={securityToast}
          setShowVoiceEnrollModal={setShowVoiceEnrollModal}
          setShowPinModal={setShowPinModal}
          hasSecurityPin={hasSecurityPin}
          handleDeleteVoiceProfile={handleDeleteVoiceProfile}
          parseVoiceCommand={parseVoiceCommand}
          setTestedAppCommand={setTestedAppCommand}
          testCommandInput={testCommandInput}
          setTestCommandInput={setTestCommandInput}
          setShowVoiceHelpModal={setShowVoiceHelpModal}
          onOpenFeedback={onOpenFeedback}
          handleExportData={handleExportData}
          exportMessage={exportMessage}
          onReplaySplash={onReplaySplash}
          onReplayOnboarding={onReplayOnboarding}
          setShowLogoutConfirm={setShowLogoutConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          onClearAllData={onClearAllData}
          setShowTermsModal={setShowTermsModal}
          setShowPrivacyModal={setShowPrivacyModal}
          setShowContactModal={setShowContactModal}
          handleShareApp={handleShareApp}
          shareToast={shareToast}
          contactToast={contactToast}
          onUpdateEmergencyContact={(emergencyContact) =>
            onUpdateUserProfile({ ...userProfile, emergencyContact })
          }
          onUpdateEmergencyContacts={(emergencyContacts) => {
            const primary = emergencyContacts.find((c) => c.isPrimary) || emergencyContacts[0];
            onUpdateUserProfile({
              ...userProfile,
              emergencyContacts,
              emergencyContact: primary,
            });
          }}
          onUpdateCountryRegion={(countryRegion) =>
            onUpdateUserProfile({ ...userProfile, countryRegion })
          }
          onOpenCrisisHelp={onOpenCrisisHelp}
          onOpenDataManager={() => setShowDataManagerModal(true)}
        />
      )}

      {/* Tab 2: Goals & Preferences SubTab */}
      {activeSubTab === 'goals' && (
        <GoalsSubTab
          goalsText={goalsText}
          setGoalsText={setGoalsText}
          handleSaveGoals={handleSaveGoals}
          goalsSavedSuccess={goalsSavedSuccess}
          notificationsEnabled={notificationsEnabled}
          handleToggleNotifications={handleToggleNotifications}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
          voiceLang={voiceLang}
          handleVoiceLangChange={handleVoiceLangChange}
        />
      )}

      {/* Tab 3: Companion Settings SubTab */}
      {activeSubTab === 'companion' && (
        <CompanionSubTab
          companion={companion}
          onUpdateCompanion={onUpdateCompanion}
          userProfile={userProfile}
          editingCompanionName={editingCompanionName}
          setEditingCompanionName={setEditingCompanionName}
          editingUserName={editingUserName}
          setEditingUserName={setEditingUserName}
          handleSaveNames={handleSaveNames}
          personasList={personasList}
          editingMemoryIdx={editingMemoryIdx}
          setEditingMemoryIdx={setEditingMemoryIdx}
          editingMemoryValue={editingMemoryValue}
          setEditingMemoryValue={setEditingMemoryValue}
          handleStartEditMemory={handleStartEditMemory}
          handleSaveEditMemory={handleSaveEditMemory}
          handleRemoveMemory={handleRemoveMemory}
          handleAddMemory={handleAddMemory}
          newMemoryText={newMemoryText}
          setNewMemoryText={setNewMemoryText}
        />
      )}

      {/* Logout Confirmation Dialog Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4 relative"
            >
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Logout</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Are you sure you want to log out of your session, <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.name || userProfile.name}</span>? You can log back in anytime.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-sm"
                >
                  Yes, Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation Dialog Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 shadow-2xl text-center space-y-4 relative"
            >
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Permanently Delete Account?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Are you sure you want to permanently delete your account (<span className="font-bold text-slate-900 dark:text-white">{user?.email || userProfile.name}</span>)?
                </p>
                <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/80 text-[11px] text-rose-800 dark:text-rose-300 text-left font-medium">
                  ⚠️ This will permanently destroy all your mood history, chat logs, goals, and reflections. <strong>This action cannot be undone.</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      if (user?.uid) {
                        await secureFetch('/api/user/delete-data', {
                          method: 'POST',
                          userId: user.uid,
                          token: getAuthToken(),
                          body: JSON.stringify({ userId: user.uid, confirmUserDeletion: true }),
                        }).catch(() => {});
                      }
                      await deleteAccount();
                      onClearAllData();
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsDeleting(false);
                      setShowDeleteConfirm(false);
                    }
                  }}
                  className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Voice Commands Directory Help Screen */}
      <VoiceCommandsHelpModal
        isOpen={showVoiceHelpModal}
        onClose={() => setShowVoiceHelpModal(false)}
      />

      {/* Voice Recognition Enrollment Modal */}
      <VoiceEnrollmentModal
        isOpen={showVoiceEnrollModal}
        onClose={() => setShowVoiceEnrollModal(false)}
        onComplete={() => {
          refreshVoiceSecConfig();
          setSecurityToast("Voice profile set up successfully!");
          setTimeout(() => setSecurityToast(null), 3000);
        }}
      />

      {/* Security PIN Modal */}
      <PinSecurityModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setSecurityToast("Security verification passed.");
          setTimeout(() => setSecurityToast(null), 3000);
        }}
      />

      {/* Legal & Trust Modals */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />

      {/* Full Privacy Data Manager Modal (View, Edit, Delete, Account Purge) */}
      <DataManagerModal
        isOpen={showDataManagerModal}
        onClose={() => setShowDataManagerModal(false)}
        userProfile={userProfile}
        companion={companion}
        onClearAllData={onClearAllData}
      />
    </div>
  );
};
