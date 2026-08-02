export interface VoiceProfile {
  avgPitch: number;         // Average fundamental frequency in Hz
  energyBands: number[];    // Normalized 16-band spectral energy profile
  avgVolume: number;        // Normalized volume level
  sampleCount: number;
  enrolledAt: string;
}

export interface VoiceSecurityConfig {
  enabled: boolean;
  profile: VoiceProfile | null;
  pinSet: boolean;
}

const STORAGE_CONFIG_KEY = 'daily_companion_voice_sec_enabled';
const STORAGE_PROFILE_KEY = 'daily_companion_voice_profile';
const STORAGE_PIN_KEY = 'daily_companion_security_pin';

export function getVoiceSecurityConfig(): VoiceSecurityConfig {
  if (typeof window === 'undefined') {
    return { enabled: false, profile: null, pinSet: false };
  }
  const enabled = localStorage.getItem(STORAGE_CONFIG_KEY) === 'true';
  const profileRaw = localStorage.getItem(STORAGE_PROFILE_KEY);
  let profile: VoiceProfile | null = null;
  if (profileRaw) {
    try {
      profile = JSON.parse(profileRaw);
    } catch {
      profile = null;
    }
  }
  const pinSet = Boolean(localStorage.getItem(STORAGE_PIN_KEY));
  return { enabled, profile, pinSet };
}

export function setVoiceSecurityEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_CONFIG_KEY, enabled ? 'true' : 'false');
  }
}

export function getVoiceProfile(): VoiceProfile | null {
  return getVoiceSecurityConfig().profile;
}

export function saveVoiceProfile(profile: VoiceProfile): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    setVoiceSecurityEnabled(true);
  }
}

export function deleteVoiceProfile(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_PROFILE_KEY);
    localStorage.setItem(STORAGE_CONFIG_KEY, 'false');
  }
}

export function setSecurityPin(pin: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_PIN_KEY, pin);
  }
}

export function verifySecurityPin(pin: string): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(STORAGE_PIN_KEY);
  return stored === pin;
}

export function hasSecurityPin(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(STORAGE_PIN_KEY));
}

export function clearSecurityPin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_PIN_KEY);
  }
}

/**
 * Extract audio features from a Float32Array audio buffer or frequency data
 */
export function extractAudioFeatures(analyserData: Uint8Array, sampleRate: number = 44100): { pitch: number; energyBands: number[]; volume: number } {
  const binCount = analyserData.length;
  if (binCount === 0) {
    return { pitch: 150, energyBands: new Array(16).fill(0), volume: 0 };
  }

  // 1. Calculate average volume/energy
  let sum = 0;
  for (let i = 0; i < binCount; i++) {
    sum += analyserData[i];
  }
  const avgVolume = sum / binCount / 255;

  // 2. Compute 16 frequency bands
  const bandSize = Math.floor(binCount / 16);
  const energyBands: number[] = [];
  for (let b = 0; b < 16; b++) {
    let bandSum = 0;
    const start = b * bandSize;
    const end = Math.min(start + bandSize, binCount);
    for (let i = start; i < end; i++) {
      bandSum += analyserData[i];
    }
    const bandAvg = (end > start) ? (bandSum / (end - start)) / 255 : 0;
    energyBands.push(Math.round(bandAvg * 1000) / 1000);
  }

  // 3. Estimate fundamental pitch frequency (peak in 80Hz - 400Hz range)
  const nyquist = sampleRate / 2;
  const hzPerBin = nyquist / binCount;
  const minBin = Math.max(1, Math.floor(80 / hzPerBin));
  const maxBin = Math.min(binCount - 1, Math.floor(400 / hzPerBin));

  let maxVal = -1;
  let maxIndex = minBin;
  for (let i = minBin; i <= maxBin; i++) {
    if (analyserData[i] > maxVal) {
      maxVal = analyserData[i];
      maxIndex = i;
    }
  }
  const estimatedPitch = Math.round(maxIndex * hzPerBin);

  return {
    pitch: estimatedPitch > 0 ? estimatedPitch : 160,
    energyBands,
    volume: Math.round(avgVolume * 100) / 100,
  };
}

/**
 * Verifies live audio features against enrolled VoiceProfile
 */
export function verifyVoiceMatch(
  liveFeatures: { pitch: number; energyBands: number[]; volume: number },
  enrolledProfile: VoiceProfile
): { verified: boolean; confidence: number } {
  if (!enrolledProfile) {
    return { verified: false, confidence: 0 };
  }

  // 1. Compare pitch similarity (tolerance +/- 45 Hz)
  const pitchDiff = Math.abs(liveFeatures.pitch - enrolledProfile.avgPitch);
  const pitchScore = Math.max(0, 100 - (pitchDiff / 45) * 100);

  // 2. Compare spectral energy profile (cosine similarity / Euclidean distance)
  let bandDistSum = 0;
  for (let i = 0; i < 16; i++) {
    const liveVal = liveFeatures.energyBands[i] || 0;
    const enrolledVal = enrolledProfile.energyBands[i] || 0;
    bandDistSum += Math.pow(liveVal - enrolledVal, 2);
  }
  const bandDistance = Math.sqrt(bandDistSum / 16);
  const bandScore = Math.max(0, 100 - bandDistance * 300);

  // Overall confidence weighted score
  const confidence = Math.round(pitchScore * 0.4 + bandScore * 0.6);

  // Verification threshold: 60% confidence
  const verified = confidence >= 60;

  return { verified, confidence };
}
