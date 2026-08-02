import React from 'react';
import Markdown from 'react-markdown';

interface FormattedMessageProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, className = '', isUser = false }) => {
  return (
    <div
      className={`markdown-body text-xs leading-relaxed space-y-1.5 ${
        isUser ? 'text-white' : 'text-slate-800 dark:text-slate-100'
      } ${className}`}
    >
      <Markdown
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className={`font-bold ${isUser ? 'text-white underline decoration-indigo-300' : 'text-indigo-900 dark:text-indigo-200'}`}>
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => (
            <h1 className={`text-sm font-bold my-1 ${isUser ? 'text-white' : 'text-indigo-900 dark:text-indigo-200'}`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={`text-xs font-bold my-1 ${isUser ? 'text-white' : 'text-indigo-900 dark:text-indigo-200'}`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-xs font-semibold my-1 ${isUser ? 'text-white' : 'text-indigo-900 dark:text-indigo-200'}`}>
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-indigo-400 pl-2 my-1 text-slate-600 dark:text-slate-300 italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-[11px] font-mono border border-slate-200 dark:border-slate-700">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
