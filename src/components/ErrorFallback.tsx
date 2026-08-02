import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error connecting to the service. Please check your connection and tap to retry.',
  onRetry,
}) => {
  return (
    <div className="w-full p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center space-y-3 shadow-sm">
      <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-rose-200">{title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-xs mx-auto">
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tap to Retry</span>
        </button>
      )}
    </div>
  );
};
