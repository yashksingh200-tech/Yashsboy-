import React from 'react';
import { AvatarStyle } from '../types';

interface AppIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: AvatarStyle;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ size = 'md', style = 'cosmic', className = '' }) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const styleMap: Record<AvatarStyle, { bg: string; fill: string }> = {
    cosmic: {
      bg: 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500',
      fill: '#4f46e5',
    },
    emerald: {
      bg: 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500',
      fill: '#059669',
    },
    amber: {
      bg: 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500',
      fill: '#d97706',
    },
    rose: {
      bg: 'bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-500',
      fill: '#e11d48',
    },
    ocean: {
      bg: 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500',
      fill: '#2563eb',
    },
    amethyst: {
      bg: 'bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-indigo-500',
      fill: '#9333ea',
    },
  };

  const currentStyle = styleMap[style] || styleMap.cosmic;

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl ${currentStyle.bg} shadow-md transition-all duration-300 ${sizeMap[size]} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-3/4 h-3/4 text-white drop-shadow-sm"
      >
        <defs>
          <linearGradient id={`ferioGradient-${style}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0abfc" />
          </linearGradient>
        </defs>
        {/* Chat bubble outline */}
        <path
          d="M20 50 C20 30, 35 20, 50 20 C65 20, 80 30, 80 50 C80 65, 68 76, 52 78 C46 84, 34 88, 26 88 C29 82, 33 76, 32 72 C25 67, 20 59, 20 50 Z"
          fill={`url(#ferioGradient-${style})`}
          opacity="0.95"
        />
        {/* Heart emblem inside */}
        <path
          d="M50 63 L44.5 58 C32 46.5 28 42 28 35.5 C28 30 32.5 25.5 38 25.5 C41.5 25.5 45 27.5 47 30 C49 27.5 52.5 25.5 56 25.5 C61.5 25.5 66 30 66 35.5 C66 42 62 46.5 49.5 58 L50 63 Z"
          fill={currentStyle.fill}
        />
      </svg>
    </div>
  );
};
