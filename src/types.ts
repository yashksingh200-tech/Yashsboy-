export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  provider: 'email' | 'google';
  createdAt: string;
  token?: string;
}

export type TabType = 'home' | 'chat' | 'progress' | 'profile';

export type MoodType = 'happy' | 'neutral' | 'sad' | 'stressed' | 'excited' | 'calm' | 'thoughtful' | 'anxious' | 'tired' | 'energetic';

export interface MoodCheckin {
  id: string;
  timestamp: string; // ISO date
  dateStr: string;   // YYYY-MM-DD
  mood: MoodType;
  energyLevel: number; // 1 to 5
  note?: string;
  aiInsight?: string;
}

export interface ReflectionEntry {
  id: string;
  dateStr: string;
  prompt: string;
  userResponse: string;
  aiResponse?: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  title: string;
  icon?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChatMode = 'quick' | 'studio';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  threadId?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  isVoiceNote?: boolean;
  isStarred?: boolean;
  isPinned?: boolean;
  richWidget?: {
    type: 'mood_chart' | 'checklist' | 'breathing_guide';
    data?: any;
  };
  emotion?: string;
  isError?: boolean;
  failedUserMessage?: string;
  reactions?: string[];
  suggestions?: string[];
  isEdited?: boolean;
}

export interface ScheduledFollowUp {
  id: string;
  threadId?: string;
  note: string;
  scheduledTime: string;
  completed: boolean;
  createdAt: string;
}

export type PersonaMode = 'adaptive' | 'empathetic' | 'coach' | 'mindful' | 'creative' | 'calm';

export type AvatarStyle = 'cosmic' | 'emerald' | 'amber' | 'rose' | 'ocean' | 'amethyst';

export interface CompanionConfig {
  name: string;
  avatarStyle: AvatarStyle;
  personaMode: PersonaMode;
  responseLength: 'concise' | 'balanced' | 'detailed';
  voiceEnabled: boolean;
  adaptiveBlending?: boolean;
}

export interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface UserProfile {
  name: string;
  joinedDate: string;
  streakDays: number;
  lastCheckinDate: string;
  darkMode: boolean;
  memories: string[];
  goals: string[];
  emergencyContact?: EmergencyContact;
  emergencyContacts?: EmergencyContact[];
  countryRegion?: string;
  scheduledFollowUps?: ScheduledFollowUp[];
}

export interface DailyAffirmation {
  id: string;
  quote: string;
  author?: string;
  category: 'mindfulness' | 'resilience' | 'growth' | 'peace';
}
