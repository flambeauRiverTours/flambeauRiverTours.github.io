import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, ArrowRight, Bot } from 'lucide-react';
import { QUICK_PROMPTS, queryAIAssistant, AIResponse } from '../../datamodel/aiContext';
import { personalInfo } from '../../datamodel/portfolioData';

interface AvatarSpeechModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tabId: string) => void;
}

export const AvatarSpeechModal: React.FC<AvatarSpeechModalProps> = ({ isOpen, onClose, setActiveTab }) => {
  const [query, setQuery] = useState('');
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lock background scrolling when speech bubble is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setCurrentResponse(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
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

  return (
    <AnimatePresence>
      {/* Non-blurred, subtle transparent backdrop so website behind remains 100% sharp & visible */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center lg:justify-start pt-16 sm:pt-20 lg:pt-24 lg:pl-[22rem] xl:pl-[25rem] px-4 bg-slate-950/20"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-speech-title"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="relative max-w-lg w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-teal-500/40 dark:border-teal-400/40"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pointer Arrow pointing directly left towards sidebar profile photo on desktop */}
          <div className="hidden lg:block absolute -left-3 top-10 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-teal-500/40" />
          <div className="hidden lg:block absolute -left-[10px] top-[41px] w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[7px] border-r-white dark:border-r-slate-900" />

          {/* Pointer Arrow pointing up towards mobile navbar avatar on smaller screens */}
          <div className="lg:hidden absolute -top-3 left-8 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-teal-500/40" />
          <div className="lg:hidden absolute -top-[10px] left-[33px] w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[7px] border-b-white dark:border-b-slate-900" />

          {/* Header / Avatar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={personalInfo.avatarUrl}
                  alt={personalInfo.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-teal-500 shadow-sm"
                />
                <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-teal-500 text-white text-[10px]">
                  <Sparkles className="w-2.5 h-2.5" />
                </span>
              </div>
              <div>
                <h3 id="ai-speech-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Jack's AI Career Assistant</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/15 text-teal-700 dark:text-teal-300">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Ask me anything about Jack's engineering background or scale.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              aria-label="Close Speech Bubble"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat / Speech Body */}
          <div className="py-4 space-y-3">
            {isTyping ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 py-3">
                <Bot className="w-4 h-4 animate-spin" />
                <span>Jack's AI is searching career & architecture details...</span>
              </div>
            ) : currentResponse ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 p-4 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed"
              >
                <p>{currentResponse.answer}</p>

                {currentResponse.sourceTab && (
                  <div className="pt-2 flex items-center justify-between border-t border-teal-500/20 text-xs">
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
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Suggested Questions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(prompt)}
                      className="text-left px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-teal-500/10 dark:hover:bg-teal-500/20 hover:text-teal-700 dark:hover:text-teal-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Speech Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="pt-1 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about Jack's background..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 text-xs font-medium placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={!query.trim() || isTyping}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
