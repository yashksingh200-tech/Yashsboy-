import { CompanionConfig, DailyAffirmation, MoodCheckin, ReflectionEntry, UserProfile } from '../types';

export const DEFAULT_COMPANION: CompanionConfig = {
  name: 'Aria',
  avatarStyle: 'cosmic',
  personaMode: 'adaptive',
  responseLength: 'balanced',
  voiceEnabled: true,
  adaptiveBlending: true,
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Alex',
  joinedDate: '2026-07-01',
  streakDays: 5,
  lastCheckinDate: new Date().toISOString().split('T')[0],
  darkMode: false,
  memories: [
    'Enjoys morning tea and light mindfulness meditation',
    'Working on balancing work deadlines with rest',
    'Values thoughtful, supportive encouraging feedback',
  ],
  goals: [
    'Practice 5 minutes of daily reflection',
    'Maintain a 7-day mood check-in streak',
    'Build healthy evening wind-down habits',
  ],
};

export const DAILY_AFFIRMATIONS: DailyAffirmation[] = [
  {
    id: '1',
    quote: 'You do not have to control your thoughts. You just have to stop letting them control you.',
    author: 'Dan Millman',
    category: 'mindfulness',
  },
  {
    id: '2',
    quote: 'Peace comes from within. Do not seek it without.',
    author: 'Buddha',
    category: 'peace',
  },
  {
    id: '3',
    quote: 'Small daily improvements over time lead to stunning results.',
    author: 'Robin Sharma',
    category: 'growth',
  },
  {
    id: '4',
    quote: 'Breathe in peace, breathe out tension. You are capable of handling today.',
    category: 'resilience',
  },
];

export const REFLECTION_PROMPTS = [
  'What is one thing that brought you genuine calm or joy today?',
  'What is a challenge you navigated recently, and what did it teach you?',
  'What are three things you feel grateful for in this moment?',
  'How can you show yourself extra kindness and compassion tonight?',
  'What is one focus or intention you want to set for tomorrow?',
];

export const INITIAL_CHECKINS: MoodCheckin[] = [
  {
    id: 'm1',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    dateStr: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    mood: 'calm',
    energyLevel: 4,
    note: 'Took a peaceful 20-minute walk in the park.',
    aiInsight: 'Great job prioritizing rest. Fresh air and movement consistently boost your tranquility.',
  },
  {
    id: 'm2',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    dateStr: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    mood: 'happy',
    energyLevel: 5,
    note: 'Finished a major project milestone on time!',
    aiInsight: 'A well-deserved win! Celebrating progress strengthens your sense of self-efficacy.',
  },
  {
    id: 'm3',
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    dateStr: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    mood: 'thoughtful',
    energyLevel: 3,
    note: 'Reflecting on personal goals for the upcoming month.',
    aiInsight: 'Taking structured time to align with your personal vision keeps your path clear and meaningful.',
  },
];

export const INITIAL_REFLECTIONS: ReflectionEntry[] = [
  {
    id: 'r1',
    dateStr: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    prompt: 'What are three things you feel grateful for in this moment?',
    userResponse: 'Quiet morning coffee, a productive focus session, and supportive friends.',
    aiResponse: 'Expressing gratitude for simple daily moments creates a resilient foundation for long-term emotional wellbeing.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];
