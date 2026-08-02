import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, ShieldCheck, CheckCircle2, AlertCircle, Lock, X, RefreshCw, KeyRound } from 'lucide-react';
import { VoiceProfile, saveVoiceProfile, extractAudioFeatures, setSecurityPin } from '../utils/voiceSecurity';

interface VoiceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const VoiceEnrollmentModal: React.FC<VoiceEnrollmentModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1); // 1, 2, 3 samples, or 4 (Pin setup)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [samplesRecorded, setSamplesRecorded] = useState<number>(0);
  const [recordedFeatures, setRecordedFeatures] = useState<{ pitch: number; energyBands: number[]; volume: number }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [enrollmentComplete, setEnrollmentComplete] = useState<boolean>(false);

  // Fallback PIN state
  const [pinInput, setPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const targetPhrase = "My voice is my identity";

  useEffect(() => {
    if (!isOpen) {
      cleanupAudio();
      setCurrentStep(1);
      setSamplesRecorded(0);
      setRecordedFeatures([]);
      setEnrollmentComplete(false);
      setErrorMsg(null);
      setPinInput('');
      setConfirmPinInput('');
      setPinError(null);
      setPinSuccess(false);
    }
  }, [isOpen]);

  const cleanupAudio = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsRecording(false);
  };

  const startSampleRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsRecording(true);

      const collectedBandsList: number[][] = [];
      const collectedPitches: number[] = [];
      const collectedVolumes: number[] = [];

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let recordCount = 0;
      const processAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        const extracted = extractAudioFeatures(dataArray, audioCtx.sampleRate);
        if (extracted.volume > 0.05) {
          collectedBandsList.push(extracted.energyBands);
          collectedPitches.push(extracted.pitch);
          collectedVolumes.push(extracted.volume);
        }

        recordCount++;
        if (recordCount < 60) { // ~2.5 to 3 seconds of recording
          animFrameRef.current = requestAnimationFrame(processAudio);
        } else {
          // Finished recording sample
          cleanupAudio();
          if (collectedPitches.length === 0) {
            setErrorMsg("No speech detected. Please speak clearly and try again.");
            return;
          }

          // Calculate average features for this sample
          const avgPitch = Math.round(collectedPitches.reduce((a, b) => a + b, 0) / collectedPitches.length);
          const avgVolume = Math.round((collectedVolumes.reduce((a, b) => a + b, 0) / collectedVolumes.length) * 100) / 100;

          const avgBands: number[] = new Array(16).fill(0);
          for (let i = 0; i < 16; i++) {
            let sum = 0;
            for (const bands of collectedBandsList) {
              sum += bands[i] || 0;
            }
            avgBands[i] = Math.round((sum / collectedBandsList.length) * 1000) / 1000;
          }

          const newFeatures = [...recordedFeatures, { pitch: avgPitch, energyBands: avgBands, volume: avgVolume }];
          setRecordedFeatures(newFeatures);

          const nextSample = samplesRecorded + 1;
          setSamplesRecorded(nextSample);

          if (nextSample >= 3) {
            // Compute combined average voice profile
            const finalAvgPitch = Math.round(newFeatures.reduce((acc, curr) => acc + curr.pitch, 0) / 3);
            const finalAvgVolume = Math.round((newFeatures.reduce((acc, curr) => acc + curr.volume, 0) / 3) * 100) / 100;
            const finalEnergyBands: number[] = new Array(16).fill(0);

            for (let i = 0; i < 16; i++) {
              let sum = 0;
              for (const feat of newFeatures) {
                sum += feat.energyBands[i] || 0;
              }
              finalEnergyBands[i] = Math.round((sum / 3) * 1000) / 1000;
            }

            const profile: VoiceProfile = {
              avgPitch: finalAvgPitch,
              energyBands: finalEnergyBands,
              avgVolume: finalAvgVolume,
              sampleCount: 3,
              enrolledAt: new Date().toISOString(),
            };

            saveVoiceProfile(profile);
            setEnrollmentComplete(true);
            setCurrentStep(4); // Move to PIN setup option
          } else {
            setCurrentStep(nextSample + 1);
          }
        }
      };

      animFrameRef.current = requestAnimationFrame(processAudio);
    } catch (err) {
      cleanupAudio();
      setErrorMsg("Microphone access is required to enroll your voice profile. Please enable mic permissions.");
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (!/^\d{4}$/.test(pinInput)) {
      setPinError("PIN must be exactly 4 digits.");
      return;
    }
    if (pinInput !== confirmPinInput) {
      setPinError("PINs do not match. Please try again.");
      return;
    }

    setSecurityPin(pinInput);
    setPinSuccess(true);
    setTimeout(() => {
      onComplete();
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-5"
        >
          {/* Close button */}
          <button
            onClick={() => {
              cleanupAudio();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Voice Profile Enrollment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Biometric voice security for Ferio Heart AI
              </p>
            </div>
          </div>

          {/* Step 1-3: Recording Samples */}
          {!enrollmentComplete && (
            <div className="space-y-4">
              {/* Privacy Notice */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy Guarantee:</strong> Your voice sample is used only to recognize you and protect your privacy. It is never shared with anyone.
                </span>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 px-1">
                <span>Sample {currentStep} of 3</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`w-6 h-2 rounded-full transition-all ${
                        s <= samplesRecorded
                          ? 'bg-emerald-500'
                          : s === currentStep
                          ? 'bg-indigo-600'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Target Phrase Box */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Say the following phrase clearly:
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white italic">
                  "{targetPhrase}"
                </p>
              </div>

              {/* Visualizer / Mic Button */}
              <div className="flex flex-col items-center justify-center py-3 space-y-3">
                <div className="relative">
                  {isRecording && (
                    <motion.div
                      animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.2, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="absolute -inset-3 rounded-full bg-indigo-500/30 dark:bg-indigo-400/20"
                    />
                  )}

                  <button
                    type="button"
                    onClick={startSampleRecording}
                    disabled={isRecording}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition transform cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500 text-white scale-105'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'
                    }`}
                  >
                    <Mic className={`w-8 h-8 ${isRecording ? 'animate-pulse' : ''}`} />
                  </button>
                </div>

                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {isRecording ? "Listening... Please speak the phrase now." : "Tap the mic to record sample"}
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Enrollment Complete & Fallback Security PIN */}
          {enrollmentComplete && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Voice Profile Enrolled Successfully!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Your unique 3-sample voice signature is stored on your device and enabled for Voice Recognition Security.
                </p>
              </div>

              {/* Set up Fallback Security PIN */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <KeyRound className="w-4 h-4 text-indigo-500" />
                  <span>Setup Fallback Security PIN (Optional)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  If voice verification ever fails or background noise is high, you can unlock with this 4-digit PIN.
                </p>

                <form onSubmit={handleSavePin} className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="4-digit PIN"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Confirm PIN"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {pinError && (
                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{pinError}</p>
                  )}

                  {pinSuccess && (
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      Fallback Security PIN saved!
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={!pinInput || pinInput.length < 4}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Save PIN & Finish
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onComplete();
                        onClose();
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                    >
                      Skip PIN
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
