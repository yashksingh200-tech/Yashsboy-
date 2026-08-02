export type AppCommandType =
  | 'youtube_search'
  | 'google_search'
  | 'maps_search'
  | 'play_music'
  | 'whatsapp_message'
  | 'unknown';

export interface ParsedAppCommand {
  type: AppCommandType;
  appName: string;
  query?: string;
  contact?: string;
  message?: string;
  spokenConfirmation: string;
  intentUrl: string;
  fallbackUrl: string;
  packageName?: string;
  originalTranscript: string;
}

/**
 * Parses user voice transcript to detect app control intent (English & Hindi/Hinglish)
 */
export function parseVoiceCommand(transcript: string): ParsedAppCommand | null {
  if (!transcript || !transcript.trim()) return null;

  const raw = transcript.trim();
  const lower = raw.toLowerCase();

  // Guard: Strictly block any financial/payment or system tampering voice commands from app control intents
  const prohibitedKeywords = [
    'send money', 'transfer money', 'pay money', 'process payment', 'refund',
    'unlock premium for free', 'free premium', 'bypass login', 'admin access',
    'change code', 'modify system', 'root access', 'system override', 'grant permission'
  ];
  if (prohibitedKeywords.some((kw) => lower.includes(kw))) {
    return null; // Defer to Aria's strict conversational safety boundaries
  }

  // 1. WhatsApp Message
  // English: "send [message] to [contact] on whatsapp", "whatsapp [contact] [message]"
  // Hindi: "[contact] ko whatsapp pe [message] bhejo"
  const waEnRegex1 = /send\s+(.+?)\s+to\s+(.+?)\s+on\s+whatsapp/i;
  const waEnRegex2 = /whatsapp\s+(.+?)\s+(?:saying|message|that)?\s*(.+)/i;
  const waHiRegex1 = /(.+?)\s+ko\s+whatsapp\s+(?:pe|par|me|p)\s+(.+?)(?:\s+bhejo|\s+send karo|\s+message karo|\s+karo)?$/i;
  const waHiRegex2 = /whatsapp\s+(?:pe|par)\s+(.+?)\s+ko\s+(.+?)(?:\s+bhejo|\s+send karo|\s+karo)?$/i;

  let match = lower.match(waHiRegex1) || lower.match(waHiRegex2);
  if (match) {
    const contact = cleanText(match[1]);
    const message = cleanText(match[2]);
    if (contact && message) {
      const encodedMsg = encodeURIComponent(message);
      return {
        type: 'whatsapp_message',
        appName: 'WhatsApp',
        contact,
        message,
        spokenConfirmation: `Opening WhatsApp to send "${message}" to ${contact}`,
        intentUrl: `intent://send?text=${encodedMsg}#Intent;package=com.whatsapp;scheme=whatsapp;end;`,
        fallbackUrl: `https://api.whatsapp.com/send?text=${encodedMsg}`,
        packageName: 'com.whatsapp',
        originalTranscript: raw,
      };
    }
  }

  match = lower.match(waEnRegex1);
  if (match) {
    const message = cleanText(match[1]);
    const contact = cleanText(match[2]);
    if (contact && message) {
      const encodedMsg = encodeURIComponent(message);
      return {
        type: 'whatsapp_message',
        appName: 'WhatsApp',
        contact,
        message,
        spokenConfirmation: `Opening WhatsApp to send "${message}" to ${contact}`,
        intentUrl: `intent://send?text=${encodedMsg}#Intent;package=com.whatsapp;scheme=whatsapp;end;`,
        fallbackUrl: `https://api.whatsapp.com/send?text=${encodedMsg}`,
        packageName: 'com.whatsapp',
        originalTranscript: raw,
      };
    }
  }

  // 2. YouTube Search
  // English: "open youtube and search [topic]", "search [topic] on youtube"
  // Hindi: "youtube pe [topic] search karo", "youtube par [topic] dhundo"
  const ytEn1 = /(?:open\s+youtube\s+(?:and|to)\s+(?:search|find|play)|search\s+(?:for\s+)?(.+?)\s+on\s+youtube)/i;
  const ytEn2 = /open\s+youtube\s+and\s+search\s+(.+)/i;
  const ytHi1 = /youtube\s+(?:pe|par|p|me)\s+(.+?)(?:\s+search|\s+dhundo|\s+dekho|\s+chalao|\s+karo)?$/i;
  const ytHi2 = /youtube\s+(?:kholo|open karo)\s+(?:aur|and)?\s*(.+?)(?:\s+search|\s+dhundo|\s+karo)?$/i;

  if (lower.includes('youtube')) {
    let topic = '';
    const mEn = lower.match(ytEn2) || lower.match(/search\s+(.+?)\s+on\s+youtube/i) || lower.match(/find\s+(.+?)\s+on\s+youtube/i);
    const mHi = lower.match(ytHi1) || lower.match(ytHi2);

    if (mEn) topic = mEn[1];
    else if (mHi) topic = mHi[1];
    else {
      // Fallback extract whatever is after "youtube"
      topic = lower.replace(/.*youtube\s*(?:pe|par|open|search|kholo|and)?\s*/i, '');
    }

    topic = cleanText(topic);
    if (!topic || topic === 'youtube') topic = 'trending videos';

    const encQuery = encodeURIComponent(topic);
    return {
      type: 'youtube_search',
      appName: 'YouTube',
      query: topic,
      spokenConfirmation: `Opening YouTube to search for ${topic}`,
      intentUrl: `intent://www.youtube.com/results?search_query=${encQuery}#Intent;package=com.google.android.youtube;scheme=https;end;`,
      fallbackUrl: `https://www.youtube.com/results?search_query=${encQuery}`,
      packageName: 'com.google.android.youtube',
      originalTranscript: raw,
    };
  }

  // 3. Google Maps Search
  // English: "open maps and find [place]", "find [place] on maps", "open google maps"
  // Hindi: "maps pe [place] dhundo", "maps par [place] search karo"
  if (lower.includes('map') || lower.includes('location') || lower.includes('route')) {
    let place = '';
    const mEn = lower.match(/(?:open\s+maps?\s+(?:and|to)\s+(?:find|search)|find\s+(.+?)\s+on\s+maps?|search\s+(.+?)\s+on\s+maps?)/i);
    const mHi = lower.match(/maps?\s+(?:pe|par|p|me)\s+(.+?)(?:\s+dhundo|\s+search|\s+karo)?$/i) || lower.match(/maps?\s+(?:kholo|open karo)\s+(?:aur)?\s*(.+)/i);

    if (mEn) place = mEn[1] || mEn[2];
    else if (mHi) place = mHi[1];
    else place = lower.replace(/.*maps?\s*(?:pe|par|open|find|search|kholo)?\s*/i, '');

    place = cleanText(place);
    if (!place || place === 'maps') place = 'restaurants near me';

    const encPlace = encodeURIComponent(place);
    return {
      type: 'maps_search',
      appName: 'Google Maps',
      query: place,
      spokenConfirmation: `Opening Google Maps to locate ${place}`,
      intentUrl: `intent://maps.google.com/?q=${encPlace}#Intent;package=com.google.android.apps.maps;scheme=https;end;`,
      fallbackUrl: `https://www.google.com/maps/search/?api=1&query=${encPlace}`,
      packageName: 'com.google.android.apps.maps',
      originalTranscript: raw,
    };
  }

  // 4. Play Music / Video
  // English: "play [song name] on spotify", "play [song name]"
  // Hindi: "[song name] gaana bajao", "[song name] play karo"
  const playEn = /^play\s+(.+?)(?:\s+on\s+(spotify|youtube))?$/i;
  const playHi = /(.+?)\s+(?:gaana|song|music)\s+(?:bajao|chalao|play karo|play)$/i;

  const mPlayHi = lower.match(playHi);
  const mPlayEn = lower.match(playEn);

  if (mPlayHi || mPlayEn) {
    let song = mPlayHi ? mPlayHi[1] : (mPlayEn ? mPlayEn[1] : '');
    song = cleanText(song);

    if (song) {
      const isSpotify = lower.includes('spotify');
      const targetApp = isSpotify ? 'Spotify' : 'YouTube';
      const encSong = encodeURIComponent(song);

      const intentUrl = isSpotify
        ? `intent://open.spotify.com/search/${encSong}#Intent;package=com.spotify.music;scheme=https;end;`
        : `intent://www.youtube.com/results?search_query=${encSong}#Intent;package=com.google.android.youtube;scheme=https;end;`;

      const fallbackUrl = isSpotify
        ? `https://open.spotify.com/search/${encSong}`
        : `https://www.youtube.com/results?search_query=${encSong}`;

      return {
        type: 'play_music',
        appName: targetApp,
        query: song,
        spokenConfirmation: `Opening ${targetApp} to play ${song}`,
        intentUrl,
        fallbackUrl,
        packageName: isSpotify ? 'com.spotify.music' : 'com.google.android.youtube',
        originalTranscript: raw,
      };
    }
  }

  // 5. Google Search
  // English: "open google and search for [topic]", "search google for [topic]"
  // Hindi: "google pe [topic] search karo", "google par [topic] dhundo"
  if (lower.includes('google') || lower.startsWith('search ')) {
    let topic = '';
    const mEn = lower.match(/(?:open\s+google\s+(?:and|to)\s+search\s+(?:for\s+)?(.+)|search\s+google\s+for\s+(.+)|search\s+(.+))/i);
    const mHi = lower.match(/google\s+(?:pe|par|p|me)\s+(.+?)(?:\s+search|\s+dhundo|\s+karo)?$/i) || lower.match(/google\s+(?:kholo|open karo)\s+(?:aur)?\s*(.+)/i);

    if (mHi) topic = mHi[1];
    else if (mEn) topic = mEn[1] || mEn[2] || mEn[3];
    else topic = lower.replace(/.*google\s*(?:pe|par|search|open)?\s*/i, '');

    topic = cleanText(topic);
    if (!topic || topic === 'google') topic = 'latest news';

    const encQuery = encodeURIComponent(topic);
    return {
      type: 'google_search',
      appName: 'Google',
      query: topic,
      spokenConfirmation: `Opening Google to search for ${topic}`,
      intentUrl: `intent://www.google.com/search?q=${encQuery}#Intent;scheme=https;end;`,
      fallbackUrl: `https://www.google.com/search?q=${encQuery}`,
      packageName: 'com.google.android.googlequicksearchbox',
      originalTranscript: raw,
    };
  }

  return null;
}

/**
 * Clean up extra text / filler words from parsed queries
 */
function cleanText(str?: string): string {
  if (!str) return '';
  return str
    .replace(/^(for|about|to|and|the|a|an)\s+/i, '')
    .replace(/\s+(karo|bhejo|dhundo|dekho|bajao|chalao|kholo|please|send|message|search)$/i, '')
    .trim();
}

/**
 * Attempts to launch intent or web fallback URL
 */
export function executeAppCommand(command: ParsedAppCommand): void {
  if (typeof window === 'undefined') return;

  try {
    // Try opening Android intent link or web link
    const isAndroid = /android/i.test(navigator.userAgent);

    if (isAndroid && command.intentUrl) {
      window.location.href = command.intentUrl;
      // Fallback if app not installed
      setTimeout(() => {
        window.open(command.fallbackUrl, '_blank', 'noopener,noreferrer');
      }, 1200);
    } else {
      window.open(command.fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    window.open(command.fallbackUrl, '_blank', 'noopener,noreferrer');
  }
}
