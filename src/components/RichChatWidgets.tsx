import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  CheckSquare,
  Square,
  Wind,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

// 1. Interactive Checklist Widget Component
interface ChecklistWidgetProps {
  items: string[];
  title?: string;
}

export const ChecklistWidget: React.FC<ChecklistWidgetProps> = ({
  items,
  title = 'Action Steps & Checklist',
}) => {
  const [checkedState, setCheckedState] = useState<boolean[]>(
    items.map(() => false)
  );

  const toggleCheck = (idx: number) => {
    setCheckedState((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const completedCount = checkedState.filter(Boolean).length;
  const percent = Math.round((completedCount / items.length) * 100);

  return (
    <div className="my-2.5 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {title}
          </span>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-mono">
          {completedCount}/{items.length} ({percent}%)
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="space-y-1.5 pt-1">
        {items.map((item, idx) => {
          const isDone = checkedState[idx];
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggleCheck(idx)}
              className={`w-full p-2 rounded-xl text-left text-xs font-medium flex items-start gap-2.5 transition cursor-pointer ${
                isDone
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-500 dark:text-slate-400 line-through'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{item}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 2. Visual Breathing Exercise Guide Component
export const BreathingGuideWidget: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev > 1) return prev - 1;

          // Transition phase
          if (phase === 'Inhale') {
            setPhase('Hold');
            return 4;
          } else if (phase === 'Hold') {
            setPhase('Exhale');
            return 4;
          } else if (phase === 'Exhale') {
            setPhase('Pause');
            return 2;
          } else {
            setPhase('Inhale');
            setCyclesCompleted((c) => c + 1);
            return 4;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, phase]);

  const handleReset = () => {
    setIsActive(false);
    setPhase('Inhale');
    setSecondsLeft(4);
    setCyclesCompleted(0);
  };

  return (
    <div className="my-2.5 p-4 rounded-2xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-purple-950 border border-indigo-500/30 text-white shadow-md space-y-3 text-center">
      <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-cyan-400" />
          <span className="font-bold tracking-wide">Box Breathing Guide (4-4-4-2)</span>
        </div>
        <span className="text-[10px] text-cyan-300 font-mono">
          Cycles: {cyclesCompleted}
        </span>
      </div>

      {/* Visual Pulsating Orb */}
      <div className="py-2 flex flex-col items-center justify-center">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <motion.div
            animate={{
              scale: phase === 'Inhale' ? 1.25 : phase === 'Exhale' ? 0.75 : 1.0,
              opacity: phase === 'Hold' ? 0.9 : 0.7,
            }}
            transition={{ duration: 3.8, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 blur-sm opacity-60"
          />
          <div className="relative z-10 w-20 h-20 rounded-full bg-slate-950/80 border border-cyan-400/50 flex flex-col items-center justify-center shadow-inner">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              {phase}
            </span>
            <span className="text-lg font-black font-mono text-white">
              {secondsLeft}s
            </span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
        >
          {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isActive ? 'Pause' : 'Start Breathing'}</span>
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs transition cursor-pointer"
          title="Reset Breathing Timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// 3. Mini Mood Chart Visualizer Widget
export const MoodChartWidget: React.FC = () => {
  const mockDays = [
    { day: 'Mon', mood: 'Calm', val: 75, color: 'bg-emerald-500' },
    { day: 'Tue', mood: 'Stressed', val: 45, color: 'bg-amber-500' },
    { day: 'Wed', mood: 'Thoughtful', val: 65, color: 'bg-indigo-500' },
    { day: 'Thu', mood: 'Energetic', val: 85, color: 'bg-purple-500' },
    { day: 'Fri', mood: 'Peaceful', val: 90, color: 'bg-cyan-500' },
  ];

  return (
    <div className="my-2.5 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <span className="font-bold text-slate-900 dark:text-white">
            Weekly Emotional Flow
          </span>
        </div>
        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
          Positive Trajectory
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 items-end h-20 pt-2 px-1">
        {mockDays.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1 group">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg h-16 flex items-end p-0.5 relative">
              <div
                className={`w-full rounded-md ${d.color} transition-all duration-500 group-hover:brightness-110`}
                style={{ height: `${d.val}%` }}
              />
            </div>
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
              {d.day}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center italic">
        Aria Insight: "You've shown steady emotional bounce-back this week!"
      </p>
    </div>
  );
};
