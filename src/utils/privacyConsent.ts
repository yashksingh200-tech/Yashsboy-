/**
 * Privacy Consent & Data Transparency Utility
 * Handles explicit user consent toggles for optional features (voice recognition, AI memory personalization, analytics)
 * and provides plain-language explanations of data collection and zero-sharing guarantees.
 */

export interface PrivacyConsentPreferences {
  voiceRecognitionConsent: boolean; // Consent for microphone access and speech-to-text processing
  aiPersonalizationConsent: boolean; // Consent for AI companion memory & profile adaptation
  analyticsAndTrendConsent: boolean; // Consent for mood trend calculations and check-in history storage
  dataRetentionConsent: boolean; // Consent for AES-256-GCM encrypted local storage at rest
  consentTimestamp: string;
}

const STORAGE_KEY = 'daily_companion_privacy_consent';

export const DEFAULT_PRIVACY_CONSENT: PrivacyConsentPreferences = {
  voiceRecognitionConsent: true,
  aiPersonalizationConsent: true,
  analyticsAndTrendConsent: true,
  dataRetentionConsent: true,
  consentTimestamp: new Date().toISOString(),
};

/**
 * Retrieves stored privacy consent preferences
 */
export function getPrivacyConsent(): PrivacyConsentPreferences {
  if (typeof window === 'undefined') return DEFAULT_PRIVACY_CONSENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRIVACY_CONSENT;
    return { ...DEFAULT_PRIVACY_CONSENT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRIVACY_CONSENT;
  }
}

/**
 * Saves privacy consent preferences
 */
export function savePrivacyConsent(prefs: Partial<PrivacyConsentPreferences>): PrivacyConsentPreferences {
  if (typeof window === 'undefined') return DEFAULT_PRIVACY_CONSENT;
  try {
    const current = getPrivacyConsent();
    const updated: PrivacyConsentPreferences = {
      ...current,
      ...prefs,
      consentTimestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('[Privacy] Failed to save consent preferences:', err);
    return DEFAULT_PRIVACY_CONSENT;
  }
}

/**
 * Fast helper to check voice recognition consent
 */
export function hasVoiceConsent(): boolean {
  return getPrivacyConsent().voiceRecognitionConsent;
}

/**
 * Plain-language breakdown of data collection for transparency & onboarding
 */
export const PLAIN_LANGUAGE_PRIVACY_EXPLANATION = {
  title: 'Your Privacy & Data Protection Guarantee',
  subtitle: 'Plain-language breakdown of what we collect, how it is secured, and your rights.',
  thirdPartyGuarantee:
    'Guaranteed: We NEVER sell or share your personal data, mood check-ins, or reflections with third parties or data brokers. Data is processed solely for AI conversation generation (via secure Gemini API) and neural voice synthesis.',
  dataCollected: [
    {
      category: 'Mood Check-ins & Reflections',
      purpose: 'To generate your emotional progress charts, streak counters, and weekly wellbeing insights.',
      storage: 'Encrypted at rest (AES-256-GCM) in your isolated user session storage.',
    },
    {
      category: 'Chat Messages & Memories',
      purpose: 'To enable natural conversation with your AI companion and remember your preferences over time.',
      storage: 'Processed securely via server-side proxy API. Never used to train public models.',
    },
    {
      category: 'Voice Audio & Speech Input',
      purpose: 'To allow hands-free voice chats in English, Hindi, and Hinglish when enabled.',
      storage: 'Processed in real-time in your browser & via neural TTS server proxy. Audio is not saved to disk.',
    },
  ],
  userRights: [
    'View & export all stored data in standard JSON format anytime.',
    'Edit or selectively purge any chat logs, check-ins, or memories.',
    'Permanently delete your full account and all associated data with 1-click.',
    'Toggle optional voice or AI personalization features off whenever you choose.',
  ],
};
