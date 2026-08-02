import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
    </div>
    <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
    <div className="flex items-center gap-2 pt-1">
      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
    </div>
  </div>
);

export const HomeSkeleton: React.FC = () => (
  <div className="p-4 max-w-md mx-auto space-y-4 animate-pulse">
    {/* Welcome Banner Skeleton */}
    <div className="p-4 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 space-y-2">
      <div className="h-5 w-44 bg-slate-300 dark:bg-slate-700 rounded-lg" />
      <div className="h-3 w-60 bg-slate-300/70 dark:bg-slate-700/70 rounded-md" />
    </div>

    {/* Today's Checkin Status Card */}
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="h-16 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
    </div>

    {/* Quick Action Grid Skeleton */}
    <div className="grid grid-cols-2 gap-2.5">
      <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>

    {/* Aria Status Card */}
    <div className="h-32 rounded-2xl bg-indigo-950/20 dark:bg-indigo-950/40 border border-indigo-500/20" />
  </div>
);

export const ChatSkeleton: React.FC = () => (
  <div className="p-4 max-w-md mx-auto space-y-4 animate-pulse">
    <div className="flex justify-start">
      <div className="h-14 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
    <div className="flex justify-end">
      <div className="h-10 w-2/3 bg-indigo-500/30 dark:bg-indigo-900/40 rounded-2xl" />
    </div>
    <div className="flex justify-start">
      <div className="h-16 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
    <div className="flex justify-end">
      <div className="h-12 w-1/2 bg-indigo-500/30 dark:bg-indigo-900/40 rounded-2xl" />
    </div>
  </div>
);

export const ProgressSkeleton: React.FC = () => (
  <div className="p-4 max-w-md mx-auto space-y-4 animate-pulse">
    {/* Top Streak Header */}
    <div className="h-28 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    {/* Charts Placeholder */}
    <div className="h-44 w-full bg-slate-100 dark:bg-slate-800/80 rounded-2xl" />
    {/* Grid Metrics */}
    <div className="grid grid-cols-3 gap-2">
      <div className="h-20 bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
      <div className="h-20 bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
      <div className="h-20 bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="p-4 max-w-md mx-auto space-y-4 animate-pulse">
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>
    </div>
    <div className="h-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
    <div className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
  </div>
);

export const CheckinSkeleton: React.FC = () => (
  <div className="p-4 max-w-md mx-auto space-y-4 animate-pulse">
    <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      ))}
    </div>
    <div className="h-24 bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
    <div className="h-10 bg-indigo-500/30 rounded-xl" />
  </div>
);

export const ReflectionSkeleton: React.FC = () => (
  <div className="p-4 max-w-md mx-auto space-y-4 animate-pulse">
    <div className="h-12 bg-purple-100 dark:bg-purple-950/40 rounded-xl" />
    <div className="h-28 bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
    <div className="h-10 bg-purple-500/30 rounded-xl" />
  </div>
);
