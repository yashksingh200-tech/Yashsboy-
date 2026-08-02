import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus,
  Smartphone,
  ShieldCheck,
  Lock,
  X,
  Check,
  Share2,
  UserCheck,
  Pencil,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Phone,
  ShieldAlert,
  Send,
  Copy,
} from 'lucide-react';
import { EmergencyContact, UserProfile, ChatMessage } from '../types';
import { requestDeviceContact, PickedContactResult } from '../utils/contactPicker';

interface ChatContactPickerProps {
  userProfile?: UserProfile;
  onUpdateEmergencyContacts?: (contacts: EmergencyContact[]) => void;
  onUpdateUserProfile?: (profile: UserProfile) => void;
  messages?: ChatMessage[];
  threadTitle?: string;
  onInsertText: (text: string) => void;
  className?: string;
  buttonStyle?: 'icon' | 'labeled';
}

export const ChatContactPicker: React.FC<ChatContactPickerProps> = ({
  userProfile,
  onUpdateEmergencyContacts,
  onUpdateUserProfile,
  messages = [],
  threadTitle = 'Aria Chat',
  onInsertText,
  className = '',
  buttonStyle = 'icon',
}) => {
  // Attached Contact state
  const [selectedContact, setSelectedContact] = useState<PickedContactResult | null>(null);

  // Modal / Sheet States
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showShareOptionsModal, setShowShareOptionsModal] = useState(false);
  const [pickerStatusNote, setPickerStatusNote] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Contact Form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualRel, setManualRel] = useState('Trusted Contact');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open the contact selection flow
  const handleOpenPicker = () => {
    setPickerStatusNote(null);
    setShowManualForm(false);
    setShowPickerModal(true);
  };

  // Handle native select from phone contacts
  const handleSelectFromPhone = async () => {
    setShowPickerModal(false);
    const result = await requestDeviceContact();

    if (result.success && result.contact) {
      setSelectedContact(result.contact);
      showToast(`Selected contact "${result.contact.name}"`);
    } else {
      let note = 'Could not access phone contacts. Enter details manually below.';
      if (result.error === 'unsupported') {
        note = 'Native contact picker is unsupported on this browser. Please enter manually.';
      } else if (result.error === 'denied') {
        note = 'Contact access permission was denied. Switched to manual entry.';
      }
      setPickerStatusNote(note);
      setShowManualForm(true);
      setShowPickerModal(true);
    }
  };

  // Save manual contact
  const handleSaveManualContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPhone.trim()) return;

    setSelectedContact({
      name: manualName.trim(),
      phone: manualPhone.trim(),
      relationship: manualRel.trim() || 'Trusted Contact',
    });

    setShowPickerModal(false);
    setShowManualForm(false);
    showToast(`Added "${manualName.trim()}" as referenced contact`);
  };

  // Add selected contact as Emergency Contact
  const handleSetAsEmergencyContact = () => {
    if (!selectedContact) return;

    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      name: selectedContact.name,
      phone: selectedContact.phone,
      relationship: selectedContact.relationship || 'Trusted Contact',
      isPrimary: false,
    };

    if (userProfile && onUpdateUserProfile) {
      const existingList = userProfile.emergencyContacts || (userProfile.emergencyContact ? [userProfile.emergencyContact] : []);
      const isAlreadyAdded = existingList.some(
        (c) => c.phone.replace(/[^0-9]/g, '') === selectedContact.phone.replace(/[^0-9]/g, '')
      );

      if (isAlreadyAdded) {
        showToast(`"${selectedContact.name}" is already in your emergency contacts!`);
        return;
      }

      const updatedList = [...existingList, newContact];
      if (updatedList.length === 1) {
        updatedList[0].isPrimary = true;
      }

      const primary = updatedList.find((c) => c.isPrimary) || updatedList[0];
      onUpdateUserProfile({
        ...userProfile,
        emergencyContacts: updatedList,
        emergencyContact: primary,
      });

      showToast(`Saved "${selectedContact.name}" directly to Emergency Contacts!`);
    } else if (onUpdateEmergencyContacts) {
      onUpdateEmergencyContacts([newContact]);
      showToast(`Saved "${selectedContact.name}" directly to Emergency Contacts!`);
    }
  };

  // Mention Contact in prompt input
  const handleMentionInChat = () => {
    if (!selectedContact) return;
    onInsertText(`I want to share this conversation with ${selectedContact.name} (${selectedContact.phone})`);
    showToast(`Inserted reference into prompt input`);
  };

  // Format conversation summary for sharing
  const getShareableText = () => {
    const recent = messages.slice(-5).filter((m) => !m.isError);
    if (recent.length === 0) {
      return `Hi ${selectedContact?.name || ''}, I'm using Ferio Heart AI for well-being support! Check it out.`;
    }

    const formatted = recent
      .map((m) => `${m.sender === 'user' ? 'Me' : 'Aria'}: ${m.text}`)
      .join('\n\n');

    return `Conversation Summary from Ferio Heart AI (${threadTitle}):\n\n${formatted}\n\nShared via Ferio Heart AI`;
  };

  // Share conversation via Web Share API, SMS, or WhatsApp
  const handleShareViaWebShare = async () => {
    const shareText = getShareableText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ferio Heart AI - ${threadTitle}`,
          text: shareText,
        });
        showToast('Shared successfully!');
        setShowShareOptionsModal(false);
        return;
      } catch (err) {
        console.warn('Web Share canceled or failed:', err);
      }
    }
    // Fallback modal
    setShowShareOptionsModal(true);
  };

  const handleShareViaSMS = () => {
    if (!selectedContact) return;
    const cleanPhone = selectedContact.phone.replace(/[^0-9+]/g, '');
    const body = encodeURIComponent(getShareableText());
    window.open(`sms:${cleanPhone}?body=${body}`, '_blank');
    setShowShareOptionsModal(false);
  };

  const handleShareViaWhatsApp = () => {
    if (!selectedContact) return;
    const cleanPhone = selectedContact.phone.replace(/[^0-9]/g, '');
    const body = encodeURIComponent(getShareableText());
    window.open(`https://wa.me/${cleanPhone}?text=${body}`, '_blank');
    setShowShareOptionsModal(false);
  };

  const handleCopyShareText = () => {
    navigator.clipboard.writeText(getShareableText());
    showToast('Copied summary to clipboard!');
    setShowShareOptionsModal(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-2xl bg-indigo-950/90 border border-indigo-700 text-white text-xs font-bold shadow-xl flex items-center gap-2 backdrop-blur-md"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button inside Chat Input Bar */}
      {buttonStyle === 'labeled' ? (
        <button
          type="button"
          onClick={handleOpenPicker}
          className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          title="Add or reference a contact"
        >
          <UserPlus className="w-3.5 h-3.5 text-indigo-500" />
          <span>Contact</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpenPicker}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          title="Add or reference a phone contact"
        >
          <UserPlus className="w-4 h-4 text-indigo-500" />
        </button>
      )}

      {/* REFERENCED CONTACT CHIP BAR (When a contact is attached) */}
      <AnimatePresence>
        {selectedContact && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 5 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 5 }}
            className="my-2 p-2 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-indigo-50/90 dark:from-indigo-950/80 dark:via-purple-950/80 dark:to-indigo-950/80 border border-indigo-200 dark:border-indigo-800 shadow-sm flex flex-wrap items-center justify-between gap-2 overflow-hidden"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-2xs">
                {selectedContact.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                  <span>{selectedContact.name}</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 font-mono">
                    ({selectedContact.phone})
                  </span>
                </p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  Referenced Contact Chip
                </p>
              </div>
            </div>

            {/* Actions for Attached Contact */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Insert Mention */}
              <button
                type="button"
                onClick={handleMentionInChat}
                className="px-2 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-100 dark:border-indigo-800 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                title="Insert contact reference into prompt"
              >
                <MessageSquare className="w-3 h-3 text-indigo-500" />
                <span>Mention</span>
              </button>

              {/* Share Chat with Contact */}
              <button
                type="button"
                onClick={handleShareViaWebShare}
                className="px-2 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                title="Share conversation with contact"
              >
                <Share2 className="w-3 h-3 text-purple-500" />
                <span>Share Chat</span>
              </button>

              {/* Set as Emergency Contact */}
              {(userProfile || onUpdateEmergencyContacts) && (
                <button
                  type="button"
                  onClick={handleSetAsEmergencyContact}
                  className="px-2 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  title="Add directly as Emergency Contact"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Set Emergency</span>
                </button>
              )}

              {/* Remove Chip */}
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Remove contact reference"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTACT PICKER MODAL */}
      <AnimatePresence>
        {showPickerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Select Contact for Chat
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPickerModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Requirement / Purpose explanation */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
                <p className="font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Contact Access Purpose</span>
                </p>
                <p className="leading-relaxed text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  Select a contact from your phone to share this conversation with them, add them as an Emergency Contact, or ask Aria to remind you to reach out.
                </p>
              </div>

              <div className="text-slate-600 dark:text-slate-400 text-xs space-y-2">
                <div className="flex items-start gap-2 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Only the single contact you pick will be retrieved. No address book scans.</span>
                </div>
                <div className="flex items-start gap-2 text-[11px]">
                  <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>Data stays private on your local device.</span>
                </div>
              </div>

              {pickerStatusNote && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{pickerStatusNote}</span>
                </div>
              )}

              {/* Manual Entry Form */}
              {showManualForm ? (
                <form onSubmit={handleSaveManualContact} className="space-y-3 pt-1">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="e.g. Sarah, Mom, Dr. Alex"
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 019-2834"
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowManualForm(false)}
                      className="w-1/2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm"
                    >
                      Attach Contact
                    </button>
                  </div>
                </form>
              ) : (
                /* Native Action Options */
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSelectFromPhone}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Select Contact from Phone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowManualForm(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4 text-slate-500" />
                    <span>Enter Details Manually</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARE OPTIONS MODAL */}
      <AnimatePresence>
        {showShareOptionsModal && selectedContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Share with {selectedContact.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {selectedContact.phone}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareOptionsModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleShareViaSMS}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-between cursor-pointer transition border border-slate-200/80 dark:border-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>Send via SMS</span>
                  </span>
                  <Send className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={handleShareViaWhatsApp}
                  className="w-full p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-200 font-bold text-xs flex items-center justify-between cursor-pointer transition border border-emerald-200 dark:border-emerald-800"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Send via WhatsApp</span>
                  </span>
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyShareText}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-between cursor-pointer transition border border-slate-200/80 dark:border-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-4 h-4 text-indigo-500" />
                    <span>Copy Summary to Clipboard</span>
                  </span>
                  <Check className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
