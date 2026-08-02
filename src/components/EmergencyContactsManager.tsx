import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCheck,
  Plus,
  Phone,
  PhoneCall,
  Pencil,
  Trash2,
  Star,
  ShieldCheck,
  Lock,
  Smartphone,
  Check,
  X,
  AlertCircle,
  Users,
  Heart,
  Sparkles,
} from 'lucide-react';
import { EmergencyContact } from '../types';
import { requestDeviceContact, isContactPickerSupported } from '../utils/contactPicker';

interface EmergencyContactsManagerProps {
  contacts?: EmergencyContact[];
  primaryContact?: EmergencyContact;
  onUpdateContacts: (contacts: EmergencyContact[]) => void;
  className?: string;
}

export const EmergencyContactsManager: React.FC<EmergencyContactsManagerProps> = ({
  contacts = [],
  primaryContact,
  onUpdateContacts,
  className = '',
}) => {
  // Combine primaryContact into contacts array if contacts array is empty
  const activeContactsList: EmergencyContact[] = React.useMemo(() => {
    if (contacts && contacts.length > 0) {
      return contacts;
    }
    if (primaryContact && primaryContact.phone) {
      return [{ id: 'contact-primary', ...primaryContact, isPrimary: true }];
    }
    return [];
  }, [contacts, primaryContact]);

  // Modal / Form state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    phone: string;
    relationship: string;
    isPrimary: boolean;
  }>({
    name: '',
    phone: '',
    relationship: '',
    isPrimary: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pickerStatusNote, setPickerStatusNote] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open "Add Contact" workflow
  const handleStartAddContact = () => {
    setPickerStatusNote(null);
    setShowPermissionModal(true);
  };

  // User confirmed "Pick from Phone" in permission modal
  const handlePickFromPhone = async () => {
    setShowPermissionModal(false);
    
    const result = await requestDeviceContact();

    if (result.success && result.contact) {
      // Auto-fill form and open modal to let user add relationship or confirm
      setFormData({
        id: `contact-${Date.now()}`,
        name: result.contact.name,
        phone: result.contact.phone,
        relationship: 'Trusted Contact',
        isPrimary: activeContactsList.length === 0,
      });
      setEditingContact(null);
      setShowEditModal(true);
      showToast(`Selected contact "${result.contact.name}". Review and save below.`);
    } else {
      // Fallback if not supported, denied, or canceled
      let note = 'You can enter contact details manually below.';
      if (result.error === 'unsupported') {
        note = 'Native contact picker is unavailable on this browser/device. Switched to manual entry.';
      } else if (result.error === 'denied') {
        note = 'Contact permission was denied. Switched to manual entry.';
      }
      setPickerStatusNote(note);
      
      // Open manual entry directly
      setFormData({
        id: `contact-${Date.now()}`,
        name: '',
        phone: '',
        relationship: 'Emergency Contact',
        isPrimary: activeContactsList.length === 0,
      });
      setEditingContact(null);
      setShowEditModal(true);
    }
  };

  // User selected "Manual Entry"
  const handleOpenManualEntry = () => {
    setShowPermissionModal(false);
    setPickerStatusNote(null);
    setFormData({
      id: `contact-${Date.now()}`,
      name: '',
      phone: '',
      relationship: '',
      isPrimary: activeContactsList.length === 0,
    });
    setEditingContact(null);
    setShowEditModal(true);
  };

  // Open Edit for an existing contact
  const handleEditContactItem = (c: EmergencyContact) => {
    setEditingContact(c);
    setFormData({
      id: c.id || `contact-${Date.now()}`,
      name: c.name,
      phone: c.phone,
      relationship: c.relationship || '',
      isPrimary: !!c.isPrimary,
    });
    setShowEditModal(true);
  };

  // Save Contact (Add or Update)
  const handleSaveContactForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    const newContact: EmergencyContact = {
      id: formData.id || `contact-${Date.now()}`,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      relationship: formData.relationship.trim() || 'Trusted Contact',
      isPrimary: formData.isPrimary,
    };

    let updatedList: EmergencyContact[];

    if (editingContact) {
      // Replace existing
      updatedList = activeContactsList.map((item) =>
        item.id === newContact.id || (item.name === editingContact.name && item.phone === editingContact.phone)
          ? newContact
          : item
      );
    } else {
      // Append new
      updatedList = [...activeContactsList, newContact];
    }

    // Ensure at least one is primary if list not empty
    if (newContact.isPrimary || updatedList.length === 1) {
      updatedList = updatedList.map((item) => ({
        ...item,
        isPrimary: item.id === newContact.id,
      }));
    }

    onUpdateContacts(updatedList);
    setShowEditModal(false);
    showToast(editingContact ? 'Contact updated successfully' : 'Added to emergency contacts!');
  };

  // Remove Contact
  const handleDeleteContactItem = (targetIdOrPhone: string) => {
    const updated = activeContactsList.filter(
      (c) => (c.id && c.id !== targetIdOrPhone) && c.phone !== targetIdOrPhone
    );

    // If we removed the primary contact, make the first remaining contact primary
    if (updated.length > 0 && !updated.some((c) => c.isPrimary)) {
      updated[0].isPrimary = true;
    }

    onUpdateContacts(updated);
    showToast('Contact removed');
  };

  // Set as Primary Contact
  const handleSetPrimary = (targetContact: EmergencyContact) => {
    const updated = activeContactsList.map((c) => ({
      ...c,
      isPrimary: (c.id && c.id === targetContact.id) || (c.name === targetContact.name && c.phone === targetContact.phone),
    }));
    onUpdateContacts(updated);
    showToast(`${targetContact.name} set as primary emergency contact`);
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Header & Main Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Personal Emergency Contacts</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {activeContactsList.length}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Trusted people to reach out to in moments of distress or crisis
            </p>
          </div>
        </div>

        {/* Add Contact Button */}
        <button
          type="button"
          onClick={handleStartAddContact}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact List */}
      {activeContactsList.length === 0 ? (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
          <Users className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            No emergency contacts added yet.
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Select a contact from your phone or type manually so Aria can help you reach out when needed.
          </p>
          <button
            type="button"
            onClick={handleStartAddContact}
            className="mt-1 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 transition inline-flex items-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>+ Add First Emergency Contact</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {activeContactsList.map((contact, idx) => {
            const isPrimary = contact.isPrimary || (idx === 0 && !activeContactsList.some((c) => c.isPrimary));

            return (
              <div
                key={contact.id || idx}
                className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border transition flex items-center justify-between gap-3 shadow-2xs ${
                  isPrimary
                    ? 'border-indigo-200 dark:border-indigo-800/80 ring-1 ring-indigo-500/10'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Contact Avatar Circle */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-2xs ${
                      isPrimary
                        ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {contact.name}
                      </span>
                      {contact.relationship && (
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {contact.relationship}
                        </span>
                      )}
                      {isPrimary && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400" />
                          Primary
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold truncate">
                      {contact.phone}
                    </p>
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Call Button */}
                  <a
                    href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                    title="Call Contact"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>

                  {/* Toggle Primary Star */}
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(contact)}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-400 hover:text-amber-500 transition cursor-pointer"
                      title="Set as Primary Contact"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleEditContactItem(contact)}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Edit Contact"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteContactItem(contact.id || contact.phone)}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/80 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Privacy Notice Card */}
      <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
        <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Privacy Guarantee</p>
          <p className="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5 leading-relaxed">
            Ferio only accesses the specific contact you select. Your contact list is never scanned, imported, or shared with third parties.
          </p>
        </div>
      </div>

      {/* ONE-TIME PERMISSION REQUEST & EXPLANATION MODAL */}
      <AnimatePresence>
        {showPermissionModal && (
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
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Add Trusted Contact
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPermissionModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Explicit requirement message */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
                <p className="font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Contact Access Request</span>
                </p>
                <p className="leading-relaxed text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  "We need contact access so you can easily add a trusted person as your emergency contact."
                </p>
              </div>

              <div className="text-slate-600 dark:text-slate-400 text-xs space-y-2">
                <div className="flex items-start gap-2 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Only the single contact you pick will be retrieved. No address book scans.</span>
                </div>
                <div className="flex items-start gap-2 text-[11px]">
                  <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>Contact data is stored encrypted on your local device for safety.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handlePickFromPhone}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Select Contact from Phone</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenManualEntry}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4 text-slate-500" />
                  <span>Enter Details Manually</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT / ADD CONTACT FORM MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{editingContact ? 'Edit Contact' : 'Save Emergency Contact'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {pickerStatusNote && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{pickerStatusNote}</span>
                </div>
              )}

              <form onSubmit={handleSaveContactForm} className="space-y-3">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Mom, Dr. Sarah, Best Friend"
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +1 (555) 019-2834 or +91 98765 43210"
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mt-1 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Relationship / Tag
                  </label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    placeholder="e.g. Parent, Partner, Counselor, Sibling"
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />

                  {/* Relationship quick chips */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['Mom', 'Dad', 'Partner', 'Therapist', 'Best Friend', 'Doctor', 'Sibling'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setFormData({ ...formData, relationship: tag })}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                          formData.relationship === tag
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary toggle */}
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Set as Primary Emergency Contact
                  </span>
                </label>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="w-1/2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Contact</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
