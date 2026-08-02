import { TabType, MoodType, UserProfile, MoodCheckin } from '../types';
import { parseVoiceCommand, ParsedAppCommand } from './appControl';

export type InAppActionType =
  | 'navigate'
  | 'start_checkin'
  | 'set_mood'
  | 'read_goals'
  | 'add_goal'
  | 'toggle_dark_mode'
  | 'toggle_notifications'
  | 'logout'
  | 'external_app'
  | 'unknown';

export interface VoiceCommandResult {
  actionType: InAppActionType;
  targetTab?: TabType;
  mood?: MoodType;
  goalText?: string;
  darkModeState?: boolean;
  notificationState?: boolean;
  externalCommand?: ParsedAppCommand;
  spokenConfirmation: string;
  matchedPhrase: string;
}

/**
 * Parses user spoken transcript and returns an in-app action or external app command
 */
export function processVoiceCommand(
  transcript: string,
  currentProfile: UserProfile,
  isDarkMode: boolean
): VoiceCommandResult {
  const raw = transcript.trim();
  const lower = raw.toLowerCase();

  // 1. NAVIGATION COMMANDS
  // Home: "go to home", "home dikhao", "home screen", "open home", "ghar"
  if (
    /^(go to home|open home|home screen|home dikhao|home tab|ghar|ghar dikhao)$/i.test(lower) ||
    lower.includes('home dikhao') ||
    lower.includes('go to home') ||
    lower.includes('open home') ||
    lower.includes('ghar jao')
  ) {
    return {
      actionType: 'navigate',
      targetTab: 'home',
      spokenConfirmation: 'Navigating to your Home screen.',
      matchedPhrase: raw,
    };
  }

  // Chat: "open chat", "chat kholo", "go to chat", "baat karo", "message companion"
  if (
    /^(open chat|chat kholo|go to chat|chat screen|baat karo|talk to companion)$/i.test(lower) ||
    lower.includes('chat kholo') ||
    lower.includes('open chat') ||
    lower.includes('go to chat') ||
    lower.includes('baat karo')
  ) {
    return {
      actionType: 'navigate',
      targetTab: 'chat',
      spokenConfirmation: 'Opening chat screen.',
      matchedPhrase: raw,
    };
  }

  // Progress: "show my progress", "progress dikhao", "open progress", "analytics", "stats"
  if (
    /^(show my progress|progress dikhao|open progress|analytics|stats|show progress|progress tab)$/i.test(lower) ||
    lower.includes('progress dikhao') ||
    lower.includes('show my progress') ||
    lower.includes('open progress') ||
    lower.includes('my analytics')
  ) {
    return {
      actionType: 'navigate',
      targetTab: 'progress',
      spokenConfirmation: 'Navigating to your progress and mood analytics.',
      matchedPhrase: raw,
    };
  }

  // Profile / Settings: "open profile", "profile kholo", "open settings", "settings kholo"
  if (
    /^(open profile|profile kholo|go to profile|open settings|settings kholo|settings|profile)$/i.test(lower) ||
    lower.includes('profile kholo') ||
    lower.includes('open profile') ||
    lower.includes('settings kholo') ||
    lower.includes('open settings')
  ) {
    return {
      actionType: 'navigate',
      targetTab: 'profile',
      spokenConfirmation: 'Opening your profile and settings.',
      matchedPhrase: raw,
    };
  }

  // 2. ACTION COMMANDS
  // Start Checkin: "start check-in", "check-in karo", "check in"
  if (
    lower.includes('start check-in') ||
    lower.includes('start checkin') ||
    lower.includes('check-in karo') ||
    lower.includes('check in karo') ||
    lower.includes('check in')
  ) {
    return {
      actionType: 'start_checkin',
      spokenConfirmation: "Opening daily check-in. Tell me how you're feeling today!",
      matchedPhrase: raw,
    };
  }

  // Feeling Mood: "i'm feeling happy", "mujhe khushi ho rahi hai", "feeling sad"
  const feelingMatch =
    lower.match(/(?:i'm feeling|i feel|feeling|mujhe)\s+(.+?)(?:\s+ho rahi hai|\s+lag raha hai|\s+feel ho raha hai)?$/i) ||
    lower.match(/^(happy|sad|stressed|calm|anxious|excited|tired|energetic)$/i);

  if (feelingMatch) {
    const moodStr = feelingMatch[1] || feelingMatch[0];
    let detectedMood: MoodType | null = null;

    if (/happy|khush|khushi|joyful|great|awesome|good/i.test(moodStr)) detectedMood = 'happy';
    else if (/sad|udas|udaasi|down|blue|upset/i.test(moodStr)) detectedMood = 'sad';
    else if (/stress|stressed|tanaav|tension|overwhelmed/i.test(moodStr)) detectedMood = 'stressed';
    else if (/calm|shant|shanti|peaceful|relaxed/i.test(moodStr)) detectedMood = 'calm';
    else if (/anxious|anxiety|chinta|nervous|scared/i.test(moodStr)) detectedMood = 'anxious';
    else if (/excited|utsaah|eager|thrilled/i.test(moodStr)) detectedMood = 'excited';
    else if (/tired|thaka|thakawat|exhausted|sleepy/i.test(moodStr)) detectedMood = 'tired';
    else if (/energetic|energy|active|hyper/i.test(moodStr)) detectedMood = 'energetic';

    if (detectedMood) {
      const moodName = detectedMood.charAt(0).toUpperCase() + detectedMood.slice(1);
      return {
        actionType: 'set_mood',
        mood: detectedMood,
        spokenConfirmation: `Logging your mood as ${moodName}. Thank you for checking in!`,
        matchedPhrase: raw,
      };
    }
  }

  // Read Goals: "read my goals", "mere goals padho", "goals dikhao"
  if (
    lower.includes('read my goals') ||
    lower.includes('read goals') ||
    lower.includes('mere goals padho') ||
    lower.includes('my goals') ||
    lower.includes('goals padho')
  ) {
    const userGoals = currentProfile.goals || [];
    let textToSpeak = '';
    if (userGoals.length === 0) {
      textToSpeak = "You haven't added any goals yet. You can say 'Add a goal: drink 2 liters of water daily'.";
    } else {
      textToSpeak = `Here are your saved goals: ${userGoals.map((g, i) => `${i + 1}, ${g}`).join('. ')}.`;
    }
    return {
      actionType: 'read_goals',
      spokenConfirmation: textToSpeak,
      matchedPhrase: raw,
    };
  }

  // Add Goal: "add a goal: drink water", "goal add karo meditate", "add goal drink water"
  const addGoalMatch =
    lower.match(/(?:add\s+(?:a\s+)?goal\s*:\s*|add\s+goal\s+|goal\s+add\s+karo\s*:\s*|goal\s+add\s+karo\s+|set\s+goal\s+)(.+)/i);

  if (addGoalMatch && addGoalMatch[1]) {
    const goalText = addGoalMatch[1].trim();
    return {
      actionType: 'add_goal',
      goalText,
      spokenConfirmation: `Saved new goal: "${goalText}". You can track it in your profile!`,
      matchedPhrase: raw,
    };
  }

  // Dark Mode: "turn on dark mode", "dark mode on", "turn off dark mode", "light mode"
  if (
    lower.includes('turn on dark mode') ||
    lower.includes('dark mode on') ||
    lower.includes('enable dark mode') ||
    lower.includes('raat ka mode')
  ) {
    return {
      actionType: 'toggle_dark_mode',
      darkModeState: true,
      spokenConfirmation: 'Dark mode turned on.',
      matchedPhrase: raw,
    };
  }

  if (
    lower.includes('turn off dark mode') ||
    lower.includes('dark mode off') ||
    lower.includes('light mode') ||
    lower.includes('disable dark mode')
  ) {
    return {
      actionType: 'toggle_dark_mode',
      darkModeState: false,
      spokenConfirmation: 'Dark mode turned off. Switched to light theme.',
      matchedPhrase: raw,
    };
  }

  // Notifications: "turn off notifications", "notification band karo", "turn on notifications"
  if (
    lower.includes('turn off notification') ||
    lower.includes('notification band karo') ||
    lower.includes('disable notification')
  ) {
    return {
      actionType: 'toggle_notifications',
      notificationState: false,
      spokenConfirmation: 'Notifications turned off.',
      matchedPhrase: raw,
    };
  }

  if (
    lower.includes('turn on notification') ||
    lower.includes('notification chalu karo') ||
    lower.includes('enable notification')
  ) {
    return {
      actionType: 'toggle_notifications',
      notificationState: true,
      spokenConfirmation: 'Notifications turned on for daily morning check-ins.',
      matchedPhrase: raw,
    };
  }

  // Logout: "log me out", "logout karo", "log out"
  if (
    lower.includes('log me out') ||
    lower.includes('logout karo') ||
    lower.includes('log out') ||
    lower.includes('sign out')
  ) {
    return {
      actionType: 'logout',
      spokenConfirmation: 'Logging out of your account now. Take care!',
      matchedPhrase: raw,
    };
  }

  // 3. EXTERNAL APP INTENT COMMANDS (YouTube, Maps, WhatsApp, Spotify/Music, Google)
  const externalAppCmd = parseVoiceCommand(raw);
  if (externalAppCmd) {
    return {
      actionType: 'external_app',
      externalCommand: externalAppCmd,
      spokenConfirmation: externalAppCmd.spokenConfirmation,
      matchedPhrase: raw,
    };
  }

  // 4. UNKNOWN / UNRECOGNIZED COMMAND
  return {
    actionType: 'unknown',
    spokenConfirmation: "Sorry, I didn't understand that command. Try saying 'Open chat', 'Show my progress', 'Turn on dark mode', or 'I feel happy'.",
    matchedPhrase: raw,
  };
}
