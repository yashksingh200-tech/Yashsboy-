import { EmergencyContact } from '../types';

export interface HelplineInfo {
  name: string;
  number: string;
  hours?: string;
  description?: string;
  type: 'call' | 'text' | 'both';
}

export interface CrisisHelplineRegion {
  countryCode: string;
  countryName: string;
  flag: string;
  helplines: HelplineInfo[];
  webLink: string;
}

// Comprehensive database of international crisis helplines
export const INTERNATIONAL_CRISIS_HELPLINES: Record<string, CrisisHelplineRegion> = {
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    helplines: [
      {
        name: 'Vandrevala Foundation Helpline',
        number: '9999-666-555',
        hours: '24/7 Free & Confidential',
        description: '24x7 Mental Health & Suicide Prevention Support in Hindi, English, and regional languages.',
        type: 'call',
      },
      {
        name: 'iCall (TISS Helpline)',
        number: '9152987821',
        hours: 'Mon-Sat: 10:00 AM - 8:00 PM',
        description: 'Psychosocial helpline run by Tata Institute of Social Sciences.',
        type: 'call',
      },
      {
        name: 'KIRAN Mental Health Helpline',
        number: '1800-599-0019',
        hours: '24/7 Government Toll-Free',
        description: 'Ministry of Social Justice & Empowerment mental health helpline.',
        type: 'call',
      },
      {
        name: 'Tele-MANAS',
        number: '14416',
        hours: '24/7 National Mental Health Helpline',
        description: 'Government of India Tele Mental Health Assistance and Networking Across States.',
        type: 'call',
      },
    ],
    webLink: 'https://findahelpline.com/i/in',
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    helplines: [
      {
        name: '988 Suicide & Crisis Lifeline',
        number: '988',
        hours: '24/7 Free & Confidential',
        description: 'Call or text 988 anytime across the US for free crisis support.',
        type: 'both',
      },
      {
        name: 'Crisis Text Line',
        number: '741741',
        hours: '24/7 Text Support',
        description: 'Text HOME to 741741 to connect with a crisis counselor.',
        type: 'text',
      },
      {
        name: 'The Trevor Project (LGBTQ Youth)',
        number: '1-866-488-7386',
        hours: '24/7 Youth Support',
        description: 'Crisis intervention and suicide prevention for LGBTQ young people. Text START to 678-678.',
        type: 'both',
      },
    ],
    webLink: 'https://988lifeline.org/',
  },
  UK: {
    countryCode: 'UK',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    helplines: [
      {
        name: 'Samaritans',
        number: '116123',
        hours: '24/7 Free Helpline',
        description: 'Whatever you are going through, call 116 123 anytime for free emotional support.',
        type: 'call',
      },
      {
        name: 'NHS Mental Health Crisis Line',
        number: '111',
        hours: '24/7 Urgent Care',
        description: 'Call 111 for urgent NHS mental health services in England, Wales, and Scotland.',
        type: 'call',
      },
      {
        name: 'National Suicide Prevention Helpline UK',
        number: '0800-689-5652',
        hours: '6:00 PM - 3:30 AM Daily',
        description: 'Support for anyone experiencing thoughts of suicide.',
        type: 'call',
      },
    ],
    webLink: 'https://www.samaritans.org/',
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    helplines: [
      {
        name: '988 Suicide Crisis Helpline',
        number: '988',
        hours: '24/7 Free & Confidential',
        description: 'Call or text 988 toll-free anywhere in Canada.',
        type: 'both',
      },
      {
        name: 'Talk Suicide Canada',
        number: '1-833-456-4566',
        hours: '24/7 Toll-Free Call',
        description: 'NATIONWIDE distress and suicide prevention support.',
        type: 'call',
      },
      {
        name: 'Kids Help Phone (Youth)',
        number: '1-800-668-6868',
        hours: '24/7 Youth & Young Adult',
        description: 'Text CONNECT to 686868 or call for youth support.',
        type: 'both',
      },
    ],
    webLink: 'https://988.ca/',
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    helplines: [
      {
        name: 'Lifeline Australia',
        number: '131114',
        hours: '24/7 Crisis Support',
        description: 'Short-term support for people overwhelmed or having difficulty coping.',
        type: 'call',
      },
      {
        name: 'Beyond Blue',
        number: '1300-22-4636',
        hours: '24/7 Mental Health',
        description: 'Mental health information and advice from trained counselors.',
        type: 'call',
      },
      {
        name: 'Suicide Call Back Service',
        number: '1300-659-467',
        hours: '24/7 Nationwide',
        description: 'Free professional telephone counseling for people affected by suicide.',
        type: 'call',
      },
    ],
    webLink: 'https://www.lifeline.org.au/',
  },
  INTERNATIONAL: {
    countryCode: 'INTERNATIONAL',
    countryName: 'International / Other Region',
    flag: '🌐',
    helplines: [
      {
        name: 'Find A Helpline (Global Directory)',
        number: 'https://findahelpline.com/',
        hours: '130+ Countries Worldwide',
        description: 'Search free, confidential support from local crisis centers anywhere in the world.',
        type: 'both',
      },
      {
        name: 'IASP Crisis Centres Directory',
        number: 'https://www.iasp.info/resources/Crisis_Centres/',
        hours: 'Global Resources Directory',
        description: 'Official directory of international suicide prevention centers and hotlines.',
        type: 'both',
      },
      {
        name: 'Befrienders Worldwide',
        number: 'https://www.befrienders.org/',
        hours: 'Global Emotional Support',
        description: 'International network of crisis centers providing confidential support.',
        type: 'both',
      },
    ],
    webLink: 'https://findahelpline.com/',
  },
};

/**
 * Detect user's region/country automatically using browser locale & timezone
 */
export function detectUserCountry(): string {
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const lang = navigator.language.toUpperCase();
      if (lang.includes('-IN') || lang.includes('HI')) return 'IN';
      if (lang.includes('-US')) return 'US';
      if (lang.includes('-GB') || lang.includes('-UK')) return 'UK';
      if (lang.includes('-CA')) return 'CA';
      if (lang.includes('-AU')) return 'AU';
    }

    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (timeZone.includes('Kolkata') || timeZone.includes('Asia/Calcutta') || timeZone.includes('India')) return 'IN';
      if (timeZone.includes('America/New_York') || timeZone.includes('America/Los_Angeles') || timeZone.includes('America/Chicago') || timeZone.includes('US/')) return 'US';
      if (timeZone.includes('Europe/London') || timeZone.includes('GB')) return 'UK';
      if (timeZone.includes('America/Toronto') || timeZone.includes('America/Vancouver') || timeZone.includes('Canada')) return 'CA';
      if (timeZone.includes('Australia/') || timeZone.includes('Sydney') || timeZone.includes('Melbourne')) return 'AU';
    }
  } catch (err) {
    // fallback
  }

  return 'IN'; // Default to India as primary regional default or user can switch easily
}

/**
 * Detect thoughts of self-harm, suicide, or severe crisis in user input
 */
export function detectCrisis(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const text = input.toLowerCase().trim();

  // Keyword patterns in English and Hinglish
  const crisisPatterns = [
    // English keywords
    /\bsuicide\b/i,
    /\bsuicidal\b/i,
    /kill\s+myself/i,
    /end\s+my\s+life/i,
    /ending\s+my\s+life/i,
    /want\s+to\s+die/i,
    /wanna\s+die/i,
    /better\off\s+dead/i,
    /harm\s+myself/i,
    /self[- ]harm/i,
    /cut\s+myself/i,
    /cutting\s+myself/i,
    /hanging\s+myself/i,
    /take\s+my\s+own\s+life/i,
    /don'?t\s+want\s+to\s+live/i,
    /no\s+reason\s+to\s+live/i,
    /give\s+up\s+on\s+life/i,
    /goodbye\s+world/i,
    /finish\s+it\s+all/i,
    /nothing\s+left\s+to\s+live\s+for/i,
    /take\s+pills\s+to\s+die/i,
    /overdose\s+myself/i,

    // Hinglish & Hindi keywords
    /marna\s+chahta/i,
    /marna\s+chahti/i,
    /marne\s+ka\s+mann/i,
    /marne\s+chala/i,
    /zindagi\s+khatam/i,
    /jiya\s+nahi\s+jata/i,
    /mar\s+jau/i,
    /khud\s+ko\s+marna/i,
    /jaan\s+de\s+doon/i,
    /jaan\s+dena/i,
    /aatmhatya/i,
    /atmahatya/i,
    /aatm\s*hatya/i,
    /apni\s+jaan\s+le/i,
  ];

  return crisisPatterns.some((pattern) => pattern.test(text));
}

/**
 * Generate a calm, empathetic, safety-focused crisis response formatted with helpline information
 */
export function generateCrisisResponseText(
  userName: string,
  companionName: string,
  regionCode: string,
  emergencyContact?: EmergencyContact
): string {
  const region = INTERNATIONAL_CRISIS_HELPLINES[regionCode] || INTERNATIONAL_CRISIS_HELPLINES.IN;

  let text = `I'm really concerned about what you're sharing, and I want to make sure you're safe right now, ${userName || 'friend'}.\n\n`;
  text += `Please know that you are not alone and your life matters deeply. I strongly encourage you to connect with someone who can support you right away:\n\n`;

  // List main helplines
  region.helplines.slice(0, 3).forEach((h) => {
    if (h.number.startsWith('http')) {
      text += `• ${h.name}: ${h.number}\n  (${h.description})\n`;
    } else {
      text += `• ${h.name}: ${h.number} (${h.hours})\n  ${h.description}\n`;
    }
  });

  if (emergencyContact && emergencyContact.phone) {
    text += `\n❤️ Your Saved Emergency Contact:\n• ${emergencyContact.name}${emergencyContact.relationship ? ` (${emergencyContact.relationship})` : ''}: ${emergencyContact.phone}\n`;
  }

  text += `\nPlease reach out to one of these free, confidential helplines, or talk to a trusted friend, family member, or professional right now.\n\n`;
  
  const contactLabel = emergencyContact?.name || 'your emergency contact';
  text += `Would you like me to share your current location with ${contactLabel}, so they can reach you?`;

  return text;
}
