import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  Download,
  Trash2,
  Edit3,
  ShieldCheck,
  X,
  Eye,
  Check,
  AlertTriangle,
  FileText,
  MessageSquare,
  Heart,
  Sparkles,
  Lock,
  User,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { ChatMessage, MoodCheckin, ReflectionEntry, UserProfile, CompanionConfig } from '../types';
import { AppButton } from './AppButton';
import { useAuth } from '../context/AuthContext';
import { secureFetch } from '../utils/apiClient';

interface DataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  companion?: CompanionConfig;
  checkins?: MoodCheckin[];
  reflections?: ReflectionEntry[];
  messages?: ChatMessage[];
  onUpdateUserProfile?: (profile: UserProfile) => void;
  onUpdateCheckins?: (checkins: MoodCheckin[]) => void;
  onUpdateReflections?: (reflections: ReflectionEntry[]) => void;
  onUpdateMessages?: (messages: ChatMessage[]) => void;
  onClearAllData: () => void;
}

export const DataManagerModal: React.FC<DataManagerModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  companion,
  checkins = [],
  reflections = [],
  messages = [],
  onUpdateUserProfile,
  onUpdateCheckins,
  onUpdateReflections,
  onUpdateMessages,
  onClearAllData,
}) => {
  const { user, deleteAccount, getAuthToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'chats' | 'moods' | 'reflections' | 'memories'>('overview');

  // Deletion States
  const [showConfirmAccountDelete, setShowConfirmAccountDelete] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Edit Memory State
  const [editingMemoryIdx, setEditingMemoryIdx] = useState<number | null>(null);
  const [memoryEditValue, setMemoryEditValue] = useState('');

  if (!isOpen) return null;

  const triggerSuccessNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Export Complete Data Archive JSON
  const handleExportDataArchive = () => {
    const fullData = {
      app: 'Ferio Heart AI',
      exportedAt: new Date().toISOString(),
      user: {
        uid: user?.uid || 'guest',
        name: userProfile.name,
        email: user?.email,
      },
      profile: userProfile,
      companionConfig: companion,
      checkinsCount: checkins.length,
      reflectionsCount: reflections.length,
      chatMessagesCount: messages.length,
      checkins,
      reflections,
      chatHistory: messages,
    };

    const jsonString = JSON.stringify(fullData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ferio-privacy-archive-${userProfile.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerSuccessNotification('Exported complete data archive (JSON)');
  };

  // Individual Deletions
  const handleDeleteChatMessage = (id: string) => {
    const updated = messages.filter((m) => m.id !== id);
    onUpdateMessages(updated);
    triggerSuccessNotification('Deleted chat message');
  };

  const handleDeleteCheckin = (id: string) => {
    const updated = checkins.filter((c) => c.id !== id);
    onUpdateCheckins(updated);
    triggerSuccessNotification('Deleted mood check-in');
  };

  const handleDeleteReflection = (id: string) => {
    const updated = reflections.filter((r) => r.id !== id);
    onUpdateReflections(updated);
    triggerSuccessNotification('Deleted reflection entry');
  };

  const handleDeleteMemory = (index: number) => {
    const updatedMemories = userProfile.memories.filter((_, i) => i !== index);
    onUpdateUserProfile({ ...userProfile, memories: updatedMemories });
    triggerSuccessNotification('Deleted AI memory');
  };

  const handleSaveEditedMemory = (index: number) => {
    if (!memoryEditValue.trim()) return;
    const updated = [...userProfile.memories];
    updated[index] = memoryEditValue.trim();
    onUpdateUserProfile({ ...userProfile, memories: updated });
    setEditingMemoryIdx(null);
    triggerSuccessNotification('Updated memory entry');
  };

  // Granular Category Purges
  const handlePurgeChats = () => {
    if (confirm('Are you sure you want to clear your entire chat history?')) {
      onUpdateMessages([
        {
          id: 'msg-welcome-fresh',
          sender: 'ai',
          text: `Hi ${userProfile.name}! Chat history cleared. How can I support you today?`,
          timestamp: new Date().toISOString(),
        },
      ]);
      triggerSuccessNotification('Cleared all chat messages');
    }
  };

  const handlePurgeMoods = () => {
    if (confirm('Are you sure you want to clear all mood check-in logs?')) {
      onUpdateCheckins([]);
      triggerSuccessNotification('Cleared all mood check-ins');
    }
  };

  const handlePurgeReflections = () => {
    if (confirm('Are you sure you want to clear all reflection journal entries?')) {
      onUpdateReflections([]);
      triggerSuccessNotification('Cleared all journal reflections');
    }
  };

  const handlePurgeMemories = () => {
    if (confirm('Are you sure you want to clear all stored AI memories?')) {
      onUpdateUserProfile({ ...userProfile, memories: [] });
      triggerSuccessNotification('Cleared all AI memories');
    }
  };

  // Permanent Full Account & Data Deletion
  const handlePermanentAccountDeletion = async () => {
    setIsDeletingAccount(true);
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
      onClose();
    } catch (e) {
      console.error('Account deletion error:', e);
      alert('An error occurred while deleting your account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Privacy & Data Management Control</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    AES-256 Encrypted
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  View, edit, export, or permanently delete your stored data anytime.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast Notification Banner */}
          <AnimatePresence>
            {actionSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionSuccessMsg}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Data Category Navigation Tabs */}
          <div className="flex items-center gap-1 p-2 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Overview & Export</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'chats'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chats ({messages.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('moods')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'moods'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Mood Logs ({checkins.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reflections')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'reflections'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reflections ({reflections.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('memories')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'memories'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Memories ({userProfile.memories.length})</span>
            </button>
          </div>

          {/* Main Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300">
            {/* OVERVIEW & EXPORT TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Zero Third-Party Sharing Guarantee */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
                    <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Plain-Language Data Guarantee</span>
                  </div>
                  <p className="text-xs text-indigo-950/80 dark:text-indigo-200/90 leading-relaxed">
                    We <strong>NEVER</strong> sell or share your personal data, mood history, or chat logs with third parties or advertisers. All AI model calls are run server-side over HTTPS to Gemini AI and are never used for global public model training.
                  </p>
                </div>

                {/* Stored Data Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white block">{messages.length}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Chat Messages</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white block">{checkins.length}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Mood Check-ins</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white block">{reflections.length}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Journal Entries</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white block">{userProfile.memories.length}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">AI Memories</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Data Control Actions</h4>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-indigo-500" />
                        <span>Export Full Data Archive</span>
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Download a structured JSON archive containing your chat history, reflections, goals, and mood logs.
                      </p>
                    </div>
                    <AppButton
                      variant="primary"
                      size="sm"
                      onClick={handleExportDataArchive}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Archive</span>
                    </AppButton>
                  </div>

                  {/* Selective Purge Category Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handlePurgeChats}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-950/30 border border-slate-200 hover:border-rose-300 dark:border-slate-700 dark:hover:border-rose-800 text-left transition flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-rose-600 dark:text-slate-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                          Clear Chat History
                        </span>
                      </div>
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
                    </button>

                    <button
                      type="button"
                      onClick={handlePurgeMoods}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-950/30 border border-slate-200 hover:border-rose-300 dark:border-slate-700 dark:hover:border-rose-800 text-left transition flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-slate-500 group-hover:text-rose-600 dark:text-slate-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                          Clear Mood Check-ins
                        </span>
                      </div>
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
                    </button>

                    <button
                      type="button"
                      onClick={handlePurgeReflections}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-950/30 border border-slate-200 hover:border-rose-300 dark:border-slate-700 dark:hover:border-rose-800 text-left transition flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500 group-hover:text-rose-600 dark:text-slate-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                          Clear Journal Reflections
                        </span>
                      </div>
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
                    </button>

                    <button
                      type="button"
                      onClick={handlePurgeMemories}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-950/30 border border-slate-200 hover:border-rose-300 dark:border-slate-700 dark:hover:border-rose-800 text-left transition flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-rose-600 dark:text-slate-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                          Reset AI Memories
                        </span>
                      </div>
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
                    </button>
                  </div>
                </div>

                {/* Permanent Full Account & Data Deletion Box */}
                <div className="mt-6 p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-rose-900 dark:text-rose-300 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Permanent Account & Data Eradication</span>
                    </h5>
                    <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-0.5">
                      Permanently delete your account, session keys, and all server/local data. This action is irreversible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmAccountDelete(true)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Full Account</span>
                  </button>
                </div>
              </div>
            )}

            {/* CHAT MESSAGES MANAGEMENT TAB */}
            {activeTab === 'chats' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Stored Chat History ({messages.length} messages)
                  </span>
                  <button
                    type="button"
                    onClick={handlePurgeChats}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Messages</span>
                  </button>
                </div>

                {messages.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No chat messages stored.</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                m.sender === 'user'
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              }`}
                            >
                              {m.sender === 'user' ? 'USER' : companion.name.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2">{m.text}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteChatMessage(m.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer shrink-0"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MOOD CHECK-INS MANAGEMENT TAB */}
            {activeTab === 'moods' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Stored Mood Check-ins ({checkins.length} logs)
                  </span>
                  <button
                    type="button"
                    onClick={handlePurgeMoods}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Moods</span>
                  </button>
                </div>

                {checkins.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No mood check-ins logged yet.</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {checkins.map((c) => {
                      const emojiMap: Record<string, string> = {
                        happy: '😊', neutral: '😐', sad: '😔', stressed: '😫', excited: '🤩', calm: '🧘', thoughtful: '🤔', anxious: '😰', tired: '😴', energetic: '⚡'
                      };
                      return (
                        <div
                          key={c.id}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl p-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
                              {emojiMap[c.mood] || '😊'}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white capitalize">{c.mood}</span>
                                <span className="text-[10px] text-slate-400">{c.dateStr}</span>
                              </div>
                              {c.note && <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{c.note}</p>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCheckin(c.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer shrink-0"
                            title="Delete check-in"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* REFLECTIONS MANAGEMENT TAB */}
            {activeTab === 'reflections' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Stored Reflection Entries ({reflections.length} entries)
                  </span>
                  <button
                    type="button"
                    onClick={handlePurgeReflections}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Reflections</span>
                  </button>
                </div>

                {reflections.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No reflection entries stored.</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {reflections.map((r) => (
                      <div
                        key={r.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">{r.prompt}</span>
                            <span className="text-[10px] text-slate-400">{r.dateStr}</span>
                          </div>
                          <p className="text-xs text-slate-800 dark:text-slate-200">{r.userResponse}</p>
                          {r.aiResponse && (
                            <p className="text-[11px] text-purple-600 dark:text-purple-300 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                              Insight: {r.aiResponse}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteReflection(r.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer shrink-0"
                          title="Delete reflection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI MEMORIES MANAGEMENT TAB */}
            {activeTab === 'memories' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Stored AI Memories ({userProfile.memories.length})
                  </span>
                  <button
                    type="button"
                    onClick={handlePurgeMemories}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset All Memories</span>
                  </button>
                </div>

                {userProfile.memories.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No AI memories stored.</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {userProfile.memories.map((mem, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3"
                      >
                        {editingMemoryIdx === idx ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={memoryEditValue}
                              onChange={(e) => setMemoryEditValue(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditedMemory(idx)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">{mem}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMemoryIdx(idx);
                                  setMemoryEditValue(mem);
                                }}
                                className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                                title="Edit memory"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMemory(idx)}
                                className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="Delete memory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero third-party data broker sharing</span>
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>

      {/* Full Account Deletion Confirmation Overlay */}
      {showConfirmAccountDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/80 rounded-3xl p-6 text-center space-y-4 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                This will immediately purge your user profile, encryption keys, chat logs, reflections, and mood history from our server and your browser. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmAccountDelete(false)}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentAccountDeletion}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeletingAccount ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete All</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
