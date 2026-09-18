import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, ArrowRight, Bot } from 'lucide-react';
import { QUICK_PROMPTS, queryAIAssistant, AIResponse } from '../../datamodel/aiContext';
import { personalInfo } from '../../datamodel/portfolioData';

interface AvatarSpeechBubbleProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tabId: string) => void;
  variant?: 'sidebar' | 'navbar';
}

export const AvatarSpeechBubble: React.FC<AvatarSpeechBubbleProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  variant = 'sidebar'
}) => {
  const [query, setQuery] = useState('');
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the speech bubble
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setCurrentResponse(null);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Escape key and ⌘K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAsk = (userPrompt: string) => {
    if (!userPrompt.trim()) return;
    setIsTyping(true);
    setQuery(userPrompt);

    setTimeout(() => {
      const res = queryAIAssistant(userPrompt);
      setCurrentResponse(res);
      setIsTyping(false);
    }, 300);
  };

  if (!isOpen) return null;

  const isSidebar = variant === 'sidebar';

  return (
    <AnimatePresence>
      <motion.div
        ref={bubbleRef}
        initial={{ opacity: 0, scale: 0.9, x: isSidebar ? -10 : 0, y: isSidebar ? 0 : -10 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: isSidebar ? -10 : 0, y: isSidebar ? 0 : -10 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className={`absolute z-50 text-left bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-5 shadow-2xl border-2 border-teal-500/40 dark:border-teal-400/40 ${
          isSidebar
            ? 'left-full top-0 ml-5 w-[22rem] sm:w-[26rem] lg:w-[28rem]'
            : 'top-full left-0 mt-3 w-[calc(100vw-2rem)] max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Jack's AI Career Assistant Speech Bubble"
      >
        {/* Pointer Arrow pointing LEFT directly at the sidebar portrait face */}
        {isSidebar && (
          <>
            <div className="absolute -left-3 top-8 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-teal-500/40" />
            <div className="absolute -left-[10px] top-[33px] w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[7px] border-r-white dark:border-r-slate-900" />
          </>
        )}

        {/* Pointer Arrow pointing UP directly at the navbar avatar photo */}
        {!isSidebar && (
          <>
            <div className="absolute -top-3 left-5 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-teal-500/40" />
            <div className="absolute -top-[10px] left-[21px] w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[7px] border-b-white dark:border-b-slate-900" />
          </>
        )}

        {/* 1. Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={personalInfo.avatarUrl}
                alt={personalInfo.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-teal-500 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-teal-500 text-white text-[9px]">
                <Sparkles className="w-2 h-2" />
              </span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Jack's AI Assistant</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-teal-500/15 text-teal-700 dark:text-teal-300">
                  Live
                </span>
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Ask about team leadership, 3M+ transaction billing engine, or cloud certs.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            aria-label="Close Speech Bubble"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Primary Entry Field (Immediately at eye/mouse level under header) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="pt-3 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about Jack's background..."
            aria-label="Ask AI Assistant a question"
            className="flex-1 px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 text-xs font-medium placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={!query.trim() || isTyping}
            aria-label="Send Query"
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center gap-1 shadow-md shadow-teal-500/20 cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </form>

        {/* 3. Quick-Prompt Chips (Under Entry Field) */}
        <div className="pt-3 space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Suggested Questions:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(prompt)}
                className="text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-teal-500/10 dark:hover:bg-teal-500/20 hover:text-teal-700 dark:hover:text-teal-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Output Answer Area (Surfaced at the Bottom) */}
        <div className="pt-3">
          {isTyping && (
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 py-2">
              <Bot className="w-4 h-4 animate-spin" />
              <span>Searching Jack's career & architecture details...</span>
            </div>
          )}

          {!isTyping && currentResponse && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2.5 p-3.5 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed"
            >
              <p>{currentResponse.answer}</p>

              {currentResponse.sourceTab && (
                <div className="pt-2 flex items-center justify-between border-t border-teal-500/20 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Source: <strong className="text-teal-700 dark:text-teal-300">{currentResponse.sourceTitle}</strong>
                  </span>
                  <button
                    onClick={() => {
                      if (currentResponse.sourceTab) {
                        setActiveTab(currentResponse.sourceTab);
                        onClose();
                      }
                    }}
                    className="inline-flex items-center gap-1 font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                  >
                    <span>Jump to View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
