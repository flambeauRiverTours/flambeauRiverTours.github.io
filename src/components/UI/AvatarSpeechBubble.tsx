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
      const target = event.target as Node;
      if (bubbleRef.current && bubbleRef.current.contains(target)) {
        return;
      }
      onClose();
    };
    if (isOpen) {
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 50);
      setTimeout(() => inputRef.current?.focus(), 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
      };
    } else {
      setQuery('');
      setCurrentResponse(null);
    }
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
        initial={{ opacity: 0, scale: 0.95, x: isSidebar ? -10 : 0, y: isSidebar ? 0 : -10 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: isSidebar ? -10 : 0, y: isSidebar ? 0 : -10 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className={`absolute z-50 text-left bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border-2 border-teal-500/40 dark:border-teal-400/40 ${
          isSidebar
            ? 'left-full top-0 ml-4 w-[19rem] sm:w-[22rem] lg:w-[24rem]'
            : 'top-full left-0 mt-3 w-[calc(100vw-2rem)] max-w-sm'
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

        {/* 1. Compact Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src={personalInfo.avatarUrl}
                alt={personalInfo.name}
                className="w-6 h-6 rounded-full object-cover border border-teal-500 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-teal-500 text-white text-[8px]">
                <Sparkles className="w-2 h-2" />
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <span>Jack's AI Assistant</span>
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            aria-label="Close Speech Bubble"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Sleek Input Entry Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="pt-2 flex items-center gap-1.5"
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about Jack's scale..."
            aria-label="Ask AI Assistant a question"
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 text-[11px] font-medium placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={!query.trim() || isTyping}
            aria-label="Send Query"
            className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-[11px] transition-all flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </form>

        {/* 3. Fully-responsive rounded Prompt Chips */}
        <div className="pt-2 space-y-1">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Quick prompts:</p>
          <div className="flex flex-col gap-1">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(prompt)}
                className="text-left px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-teal-500/15 hover:text-teal-700 dark:hover:text-teal-300 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer leading-snug break-words"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Output Answer Area */}
        <div className="pt-2">
          {isTyping && (
            <div className="flex items-center gap-2 text-[11px] font-semibold text-teal-600 dark:text-teal-400 py-1">
              <Bot className="w-3.5 h-3.5 animate-spin" />
              <span>Searching Jack's details...</span>
            </div>
          )}

          {!isTyping && currentResponse && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 p-2.5 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs leading-relaxed"
            >
              <p>{currentResponse.answer}</p>

              {currentResponse.sourceTab && (
                <div className="pt-1.5 flex items-center justify-between border-t border-teal-500/20 text-[10px]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[12rem]">
                    Source: <strong className="text-teal-700 dark:text-teal-300">{currentResponse.sourceTitle}</strong>
                  </span>
                  <button
                    onClick={() => {
                      if (currentResponse.sourceTab) {
                        setActiveTab(currentResponse.sourceTab);
                        onClose();
                      }
                    }}
                    className="inline-flex items-center gap-1 font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer shrink-0"
                  >
                    <span>Jump</span>
                    <ArrowRight className="w-2.5 h-2.5" />
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
