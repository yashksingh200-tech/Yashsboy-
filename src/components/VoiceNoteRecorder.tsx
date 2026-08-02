import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Trash2, Send, Volume2, AlertCircle } from 'lucide-react';
import { hasVoiceConsent, savePrivacyConsent } from '../utils/privacyConsent';

interface VoiceNoteRecorderProps {
  onSendVoiceNote: (audioBlobUrl: string, durationSeconds: number, transcriptText: string) => void;
  onCancel: () => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onSendVoiceNote,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [finalDuration, setFinalDuration] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
  };

  const startRecording = async () => {
    // Check consent
    if (!hasVoiceConsent()) {
      const grant = confirm(
        'Voice Recording Permission Required:\n\nTo send voice notes to Aria, please grant permission for voice input in your settings or click OK to grant now.'
      );
      if (grant) {
        savePrivacyConsent({ voiceRecognitionConsent: true });
      } else {
        onCancel();
        return;
      }
    }

    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const options = { mimeType: 'audio/webm' };
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        // Stop all tracks in stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      // Start timer
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Start Web Speech Recognition concurrently for transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';

          let liveTranscript = '';
          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              current += event.results[i][0].transcript;
            }
            liveTranscript = current;
            setTranscript(current);
          };

          recognition.onerror = () => {
            // Ignore non-fatal speech recognition errors
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn('[VoiceNote] Web Speech transcription not available:', e);
        }
      }
    } catch (err: any) {
      console.error('[VoiceNote] Microphone permission error:', err);
      setRecordingError('Microphone access denied or unsupported on this device.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setFinalDuration(recordingSeconds);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
  };

  const handleSend = () => {
    if (!recordedAudioUrl && !transcript) return;
    const sendText = transcript.trim() || `🎙️ [Voice Note - ${formatTime(finalDuration || recordingSeconds)}]`;
    onSendVoiceNote(
      recordedAudioUrl || '',
      finalDuration || recordingSeconds || 1,
      sendText
    );
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-3 bg-amber-50/90 dark:bg-slate-900 border-t border-amber-200/80 dark:border-slate-800 space-y-2.5">
      {recordingError ? (
        <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
          <span className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4" /> {recordingError}
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isRecording ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Recording Voice Note...
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-xs font-bold">Voice Note Ready</span>
                </div>
              )}
              <span className="text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-800 dark:text-slate-200">
                {formatTime(isRecording ? recordingSeconds : finalDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isRecording ? (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Voice Note</span>
                </button>
              )}

              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="Discard Voice Note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transcript Preview Box */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-200">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Live Transcript Preview:</p>
            <p className="italic text-slate-600 dark:text-slate-300 min-h-[1.25rem]">
              {transcript ? `"${transcript}"` : isRecording ? 'Listening...' : 'No transcript detected (audio message will still send)'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
