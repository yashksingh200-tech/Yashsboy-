import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Bot, Mic, Volume2 } from 'lucide-react';

interface AriaAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'speaking' | 'listening' | 'thinking' | 'idle';
  avatarUrl?: string;
  onClick?: () => void;
  className?: string;
}

export const AriaAvatar: React.FC<AriaAvatarProps> = ({
  size = 'md',
  status = 'idle',
  avatarUrl,
  onClick,
  className = '',
}) => {
  const dimensions = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', ring: '-inset-1' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5', ring: '-inset-1.5' },
    lg: { container: 'w-16 h-16', icon: 'w-8 h-8', ring: '-inset-2' },
    xl: { container: 'w-24 h-24', icon: 'w-12 h-12', ring: '-inset-3' },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 cursor-pointer group ${dimensions.container} ${className}`}
    >
      {/* Outer Reactive Glow Rings */}
      {status === 'speaking' && (
        <>
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className={`absolute ${dimensions.ring} rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-sm opacity-70`}
          />
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
            className={`absolute ${dimensions.ring} rounded-full bg-purple-400 blur-md opacity-40`}
          />
        </>
      )}

      {status === 'listening' && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.3, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className={`absolute ${dimensions.ring} rounded-full bg-emerald-400 blur-sm opacity-60`}
        />
      )}

      {status === 'thinking' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          className={`absolute ${dimensions.ring} rounded-full bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-500 blur-xs opacity-75`}
        />
      )}

      {status === 'idle' && (
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          className={`absolute ${dimensions.ring} rounded-full bg-indigo-400/30 blur-xs group-hover:opacity-80 transition`}
        />
      )}

      {/* Main Inner Sphere */}
      <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 p-0.5 shadow-md flex items-center justify-center overflow-hidden transform-gpu transition-transform group-hover:scale-105">
        <div className="w-full h-full rounded-full bg-slate-900/90 flex items-center justify-center border border-white/20 relative overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Aria" className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="relative flex items-center justify-center text-indigo-200">
              {status === 'speaking' ? (
                <Volume2 className={`${dimensions.icon} text-purple-300 animate-pulse`} />
              ) : status === 'listening' ? (
                <Mic className={`${dimensions.icon} text-emerald-300 animate-pulse`} />
              ) : status === 'thinking' ? (
                <Sparkles className={`${dimensions.icon} text-amber-300 animate-spin`} />
              ) : (
                <Bot className={`${dimensions.icon} text-indigo-300 group-hover:text-white transition`} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
