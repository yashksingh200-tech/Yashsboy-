import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Sparkles, MessageSquare, Radio, PhoneCall, AlertTriangle, RefreshCw } from 'lucide-react';
import { CompanionConfig, ChatMessage } from '../types';
import { speakMessage, stopSpeech } from '../utils/speech';
import { secureFetch } from '../utils/apiClient';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  companion: CompanionConfig;
  activeThreadId?: string;
  onAddMessage?: (message: ChatMessage) => void;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  companion,
  activeThreadId,
  onAddMessage,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [aiStatus, setAiStatus] = useState<'listening' | 'speaking' | 'thinking'>('speaking');
  const [userSpokenText, setUserSpokenText] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState<string>(
    `Hello! I'm ${companion.name}. I'm here to listen, support, and chat with you out loud. What's on your mind today?`
  );

  const recognitionRef = useRef<any>(null);
  const aiStatusRef = useRef<'listening' | 'speaking' | 'thinking'>('speaking');
  const isMutedRef = useRef(isMuted);
  const isOpenRef = useRef(isOpen);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to update aiStatus and aiStatusRef synchronously
  const updateAiStatus = (newStatus: 'listening' | 'speaking' | 'thinking') => {
    console.log(`[VoiceCall] Status transition: ${aiStatusRef.current} -> ${newStatus}`);
    aiStatusRef.current = newStatus;
    setAiStatus(newStatus);
  };

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Request microphone permission when call starts
  const checkAndRequestMicPermission = () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log('[VoiceCall] Requesting microphone permission...');
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          console.log('[VoiceCall] Microphone permission GRANTED');
          setHasMicPermission(true);
          // Stop track after permission verification so SpeechRecognition can access stream freely
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch((err) => {
          console.warn('[VoiceCall] Microphone permission DENIED or failed:', err);
          setHasMicPermission(false);
        });
    } else {
      setHasMicPermission(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkAndRequestMicPermission();
    } else {
      setHasMicPermission(null);
    }
  }, [isOpen]);

  // Call duration counter
  useEffect(() => {
    let timer: any;
    if (isOpen) {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen]);

  // Safely stop any active speech recognition instance
  const stopSpeechRecognitionInstance = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        console.log('[VoiceCall Mic] Stopped previous recognition instance');
      } catch (e) {}
      recognitionRef.current = null;
    }
  };

  // Start continuous speech recognition
  const startSpeechRecognition = () => {
    if (isMutedRef.current || !isOpenRef.current) {
      console.log(`[VoiceCall Mic] Cannot start mic: muted=${isMutedRef.current}, isOpen=${isOpenRef.current}`);
      return;
    }

    if (aiStatusRef.current === 'speaking' || aiStatusRef.current === 'thinking') {
      console.log(`[VoiceCall Mic] Skipping mic start while AI is ${aiStatusRef.current}`);
      return;
    }

    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[VoiceCall Mic] Web Speech API SpeechRecognition is not supported in this browser environment');
      return;
    }

    try {
      stopSpeechRecognitionInstance();

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';

      rec.onstart = () => {
        console.log('[VoiceCall Mic] Speech recognition is actively listening for user voice...');
      };

      rec.onresult = (e: any) => {
        if (!isOpenRef.current || isMutedRef.current) return;

        let interimText = '';
        let finalResult = '';

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalResult += e.results[i][0].transcript;
          } else {
            interimText += e.results[i][0].transcript;
          }
        }

        const spoken = (finalResult || interimText).trim();
        if (spoken) {
          setUserSpokenText(spoken);
          console.log(`[VoiceCall Mic] Heard input: "${spoken}"`);

          // Allow user barge-in if AI is somehow still speaking
          if (spoken.length > 2 && aiStatusRef.current === 'speaking') {
            console.log('[VoiceCall Mic] User spoke while AI was speaking -> stopping AI TTS');
            stopSpeech();
            updateAiStatus('listening');
          }
        }

        // If final transcript is produced, trigger message handling
        if (finalResult && finalResult.trim().length > 1) {
          console.log(`[VoiceCall Mic] Final transcript captured: "${finalResult.trim()}"`);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          handleUserSpokenMessage(finalResult.trim());
          return;
        }

        // Auto-send silence timer for interim speech pauses (1.3s pause after speaking)
        if (spoken.length > 2) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (isOpenRef.current && !isMutedRef.current && aiStatusRef.current === 'listening') {
              console.log(`[VoiceCall Mic] Silence pause detected. Auto-sending: "${spoken}"`);
              handleUserSpokenMessage(spoken);
            }
          }, 1300);
        }
      };

      rec.onerror = (e: any) => {
        console.warn('[VoiceCall Mic] Recognition error:', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setHasMicPermission(false);
          return;
        }

        // Auto restart for harmless non-fatal errors if in listening mode
        if (
          (e.error === 'no-speech' || e.error === 'network' || e.error === 'aborted') &&
          isOpenRef.current &&
          !isMutedRef.current &&
          aiStatusRef.current === 'listening'
        ) {
          setTimeout(() => {
            if (isOpenRef.current && !isMutedRef.current && aiStatusRef.current === 'listening') {
              startSpeechRecognition();
            }
          }, 350);
        }
      };

      rec.onend = () => {
        console.log(`[VoiceCall Mic] Session ended. Current status: ${aiStatusRef.current}`);
        if (isOpenRef.current && !isMutedRef.current && aiStatusRef.current === 'listening') {
          setTimeout(() => {
            if (isOpenRef.current && !isMutedRef.current && aiStatusRef.current === 'listening') {
              startSpeechRecognition();
            }
          }, 300);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('[VoiceCall Mic] Start exception:', err);
    }
  };

  // Process user spoken message and fetch Aria reply
  const handleUserSpokenMessage = async (userText: string) => {
    if (!userText || !userText.trim()) return;

    console.log('[VoiceCall] Processing user spoken input:', userText);
    stopSpeechRecognitionInstance();
    setUserSpokenText('');
    updateAiStatus('thinking');
    setTranscript(`"${userText.trim()}"...`);

    // Log to thread
    if (onAddMessage) {
      onAddMessage({
        id: `usr-vcall-${Date.now()}`,
        sender: 'user',
        text: userText.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        threadId: activeThreadId,
      });
    }

    try {
      const res = await secureFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userText.trim(),
          companionConfig: companion,
        }),
      });

      if (!isOpenRef.current) return;

      const data = await res.json();
      const aiReply = data.text || "I'm right here with you. Take your time.";
      console.log('[VoiceCall] AI response received:', aiReply);
      setTranscript(aiReply);

      // Log AI reply to thread
      if (onAddMessage) {
        onAddMessage({
          id: `ai-vcall-${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          threadId: activeThreadId,
        });
      }

      if (!isOpenRef.current) return;

      if (isSpeakerOn) {
        speakMessage(
          aiReply,
          'auto',
          () => {
            if (!isOpenRef.current) return;
            console.log('[VoiceCall TTS] Started speaking AI response');
            updateAiStatus('speaking');
          },
          () => {
            if (!isOpenRef.current) return;
            console.log('[VoiceCall TTS] Finished speaking -> Resuming microphone for user response');
            updateAiStatus('listening');
            startSpeechRecognition();
          },
          () => {
            if (!isOpenRef.current) return;
            console.log('[VoiceCall TTS] Speech error/cancelled -> Resuming microphone');
            updateAiStatus('listening');
            startSpeechRecognition();
          }
        );
      } else {
        updateAiStatus('listening');
        startSpeechRecognition();
      }
    } catch (err) {
      console.error('[VoiceCall] API response error:', err);
      if (!isOpenRef.current) return;
      setTranscript("I'm experiencing a brief connection delay, but I'm right here with you.");
      updateAiStatus('listening');
      startSpeechRecognition();
    }
  };

  // Initial call startup & greeting
  useEffect(() => {
    if (isOpen) {
      const initialGreeting = `Hello! I'm ${companion.name}. I'm here to listen, support, and chat with you out loud. What's on your mind today?`;
      setTranscript(initialGreeting);
      setUserSpokenText('');
      setTextInput('');
      updateAiStatus('speaking');
      if (isSpeakerOn) {
        speakMessage(
          initialGreeting,
          'auto',
          () => {
            if (!isOpenRef.current) return;
            console.log('[VoiceCall] Initial greeting started speaking');
            updateAiStatus('speaking');
          },
          () => {
            if (!isOpenRef.current) return;
            console.log('[VoiceCall] Initial greeting finished -> Activating microphone listening');
            updateAiStatus('listening');
            startSpeechRecognition();
          },
          () => {
            if (!isOpenRef.current) return;
            console.log('[VoiceCall] Initial greeting speech error/bypassed -> Activating microphone');
            updateAiStatus('listening');
            startSpeechRecognition();
          }
        );
      } else {
        updateAiStatus('listening');
        startSpeechRecognition();
      }
    } else {
      stopSpeech();
      stopSpeechRecognitionInstance();
    }
    return () => {
      stopSpeech();
      stopSpeechRecognitionInstance();
    };
  }, [isOpen]);

  const handleTopicSelect = (topic: string) => {
    handleUserSpokenMessage(topic);
  };

  const handleEndCall = () => {
    console.log('[VoiceCall] End Call triggered');
    stopSpeech();
    stopSpeechRecognitionInstance();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-6 text-white select-none"
      >
        {/* Call Header */}
        <div className="flex items-center justify-between pt-4 max-w-md mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Voice-To-Voice Call</span>
            </span>
          </div>
          <span className="text-xs font-mono font-medium text-slate-400 bg-white/10 px-3 py-1 rounded-full">
            {formatTime(callDuration)}
          </span>
        </div>

        {/* Center Companion Voice Orb & Status */}
        <div className="flex flex-col items-center text-center my-auto px-4 max-w-md mx-auto w-full">
          {/* Permission Warning Banner if mic is blocked */}
          {hasMicPermission === false && (
            <div className="mb-4 w-full bg-red-500/20 border border-red-500/40 rounded-2xl p-3 text-xs text-red-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Microphone access blocked. Please enable mic in browser settings.</span>
              </div>
              <button
                type="button"
                onClick={checkAndRequestMicPermission}
                className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-500 shrink-0 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          <div className="relative mb-8">
            {/* Pulsating Voice Rings */}
            {aiStatus === 'speaking' && (
              <>
                <div className="absolute -inset-4 rounded-full bg-indigo-500/30 animate-ping opacity-75" />
                <div className="absolute -inset-8 rounded-full bg-purple-500/20 animate-pulse" />
              </>
            )}

            {aiStatus === 'listening' && (
              <div className="absolute -inset-6 rounded-full bg-emerald-500/20 animate-pulse" />
            )}

            <div className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 p-1 shadow-2xl flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border border-white/20">
                <Sparkles className="w-14 h-14 text-indigo-400" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            {companion.name}
          </h2>
          <p className="text-xs font-bold text-indigo-300 mb-4 uppercase tracking-wider flex items-center gap-1.5">
            {aiStatus === 'speaking' ? (
              <span>Aria is Speaking...</span>
            ) : aiStatus === 'thinking' ? (
              <span>Aria is Thinking...</span>
            ) : isMuted ? (
              <span className="text-red-400">Microphone Muted</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Listening for your voice...</span>
              </span>
            )}
          </p>

          {/* User Spoken Text Realtime Preview */}
          {userSpokenText && (
            <p className="text-xs italic text-emerald-300 mb-3 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-full animate-fade-in">
              You: "{userSpokenText}"
            </p>
          )}

          {/* Real-time Subtitle/Transcript Box */}
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 font-light leading-relaxed min-h-[90px] flex items-center justify-center backdrop-blur-md shadow-inner">
            <p className="line-clamp-4">{transcript}</p>
          </div>

          {/* Quick Spoken Topic Shortcuts */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => handleTopicSelect('Guide a 1-minute deep breathing exercise')}
              className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition cursor-pointer flex items-center gap-1"
            >
              <MessageSquare className="w-3 h-3 text-indigo-400" />
              <span>Breathing exercise</span>
            </button>
            <button
              onClick={() => handleTopicSelect('Share an encouraging thought for my day')}
              className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition cursor-pointer flex items-center gap-1"
            >
              <MessageSquare className="w-3 h-3 text-purple-400" />
              <span>Encouragement</span>
            </button>
          </div>

          {/* Optional Text Input during Call */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textInput.trim()) {
                handleUserSpokenMessage(textInput.trim());
                setTextInput('');
              }
            }}
            className="mt-3.5 flex items-center gap-2 w-full"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type to speak with Aria..."
              className="flex-1 bg-white/10 text-white placeholder-slate-400 text-xs px-3 py-2 rounded-xl border border-white/15 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer shrink-0"
            >
              Send
            </button>
          </form>
        </div>

        {/* Call Action Controls */}
        <div className="w-full max-w-sm mx-auto pb-8 flex items-center justify-around">
          {/* Mute Button */}
          <button
            onClick={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              isMutedRef.current = nextMute;
              if (nextMute) {
                stopSpeechRecognitionInstance();
              } else if (aiStatusRef.current === 'listening') {
                startSpeechRecognition();
              }
            }}
            className={`p-4 rounded-2xl transition cursor-pointer flex flex-col items-center gap-1 ${
              isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            <span className="text-[10px] font-medium text-slate-400">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="p-5 rounded-3xl bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 transition cursor-pointer active:scale-95 flex items-center justify-center"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Speaker Button */}
          <button
            onClick={() => {
              const nextSpeaker = !isSpeakerOn;
              setIsSpeakerOn(nextSpeaker);
              if (!nextSpeaker) {
                stopSpeech();
                updateAiStatus('listening');
                startSpeechRecognition();
              }
            }}
            className={`p-4 rounded-2xl transition cursor-pointer flex flex-col items-center gap-1 ${
              !isSpeakerOn ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {!isSpeakerOn ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            <span className="text-[10px] font-medium text-slate-400">{isSpeakerOn ? 'Mute Speaker' : 'Speaker Off'}</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

