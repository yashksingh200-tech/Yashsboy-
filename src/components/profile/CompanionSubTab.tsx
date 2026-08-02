import React from 'react';
import { Bot, CheckCircle2, Brain, Edit3, Trash2, Plus, Palette } from 'lucide-react';
import { CompanionConfig, UserProfile, PersonaMode, AvatarStyle } from '../../types';
import { AppIcon } from '../AppIcon';

interface CompanionSubTabProps {
  companion: CompanionConfig;
  onUpdateCompanion: (settings: CompanionConfig) => void;
  userProfile: UserProfile;
  editingCompanionName: string;
  setEditingCompanionName: (val: string) => void;
  editingUserName: string;
  setEditingUserName: (val: string) => void;
  handleSaveNames: (e: React.FormEvent) => void;
  personasList: Array<{ id: PersonaMode; label: string; desc: string; icon: any }>;
  editingMemoryIdx: number | null;
  setEditingMemoryIdx: (idx: number | null) => void;
  editingMemoryValue: string;
  setEditingMemoryValue: (val: string) => void;
  handleStartEditMemory: (idx: number, mem: string) => void;
  handleSaveEditMemory: (idx: number) => void;
  handleRemoveMemory: (idx: number) => void;
  handleAddMemory: (e: React.FormEvent) => void;
  newMemoryText: string;
  setNewMemoryText: (val: string) => void;
}

export const CompanionSubTab: React.FC<CompanionSubTabProps> = ({
  companion,
  onUpdateCompanion,
  userProfile,
  editingCompanionName,
  setEditingCompanionName,
  editingUserName,
  setEditingUserName,
  handleSaveNames,
  personasList,
  editingMemoryIdx,
  setEditingMemoryIdx,
  editingMemoryValue,
  setEditingMemoryValue,
  handleStartEditMemory,
  handleSaveEditMemory,
  handleRemoveMemory,
  handleAddMemory,
  newMemoryText,
  setNewMemoryText,
}) => {
  return (
    <div className="space-y-5">
      {/* Companion Identity & Persona Mode Selector */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Companion Settings</h3>
        </div>

        <form onSubmit={handleSaveNames} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Companion Name
            </label>
            <input
              type="text"
              value={editingCompanionName}
              onChange={(e) => setEditingCompanionName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Your Display Name
            </label>
            <input
              type="text"
              value={editingUserName}
              onChange={(e) => setEditingUserName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
          >
            Update Names
          </button>
        </form>

        {/* Custom Avatar Visual Theme Picker */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Companion Visual Avatar Theme
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'cosmic', label: 'Cosmic Violet' },
                { id: 'emerald', label: 'Emerald Sage' },
                { id: 'amber', label: 'Sunset Amber' },
                { id: 'rose', label: 'Rose Pink' },
                { id: 'ocean', label: 'Ocean Blue' },
                { id: 'amethyst', label: 'Amethyst Glow' },
              ] as Array<{ id: AvatarStyle; label: string }>
            ).map((av) => {
              const isSelected = companion.avatarStyle === av.id;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => onUpdateCompanion({ ...companion, avatarStyle: av.id })}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-600 dark:border-purple-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <AppIcon size="md" style={av.id} />
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'}`}>
                    {av.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Persona Mode Selector */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Persona Tone Selection
          </label>
          <div className="space-y-2">
            {personasList.map((p) => {
              const Icon = p.icon;
              const isSelected = companion.personaMode === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onUpdateCompanion({ ...companion, personaMode: p.id })}
                  className={`w-full p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{p.label}</p>
                      <p className="text-[10px] opacity-75">{p.desc}</p>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Memory Context Manager */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            What {companion.name || 'Aria'} Remembers About You
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {companion.name || 'Aria'} automatically remembers key personal facts, goals, preferences, and important events you share to give personalized, context-aware responses across conversations. You can edit or delete any detail anytime.
        </p>

        {userProfile.memories.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No memories stored yet
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              As you chat, key preferences and facts will be remembered automatically, or you can add them below.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {userProfile.memories.map((mem, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
              >
                {editingMemoryIdx === idx ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingMemoryValue}
                      onChange={(e) => setEditingMemoryValue(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEditMemory(idx)}
                      className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMemoryIdx(null)}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1 leading-snug">{mem}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditMemory(idx, mem)}
                        title="Edit detail"
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMemory(idx)}
                        title="Delete detail"
                        className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddMemory} className="flex gap-2 pt-1">
          <input
            type="text"
            value={newMemoryText}
            onChange={(e) => setNewMemoryText(e.target.value)}
            placeholder="Add custom detail (e.g., Preference, Hobby, Event)..."
            className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transition flex items-center justify-center shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
