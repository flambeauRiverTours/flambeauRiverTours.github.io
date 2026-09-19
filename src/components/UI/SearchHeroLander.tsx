import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Bot, ArrowRight, User, Briefcase, Layers } from 'lucide-react';
import { QUICK_PROMPTS, queryAIAssistant, AIResponse } from '../../datamodel/aiContext';
import { streamAIChat } from '../../services/aiStreamService';
import { personalInfo } from '../../datamodel/portfolioData';

interface SearchHeroLanderProps {
  setActiveTab: (tabId: string) => void;
}

export const SearchHeroLander: React.FC<SearchHeroLanderProps> = ({ setActiveTab }) => {
  const [query, setQuery] = useState('');
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleAsk = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;
    setIsTyping(true);
    setQuery(userPrompt);
    setStreamedText('');
    setCurrentResponse(null);

    let accumulatedText = '';

    await streamAIChat(
      userPrompt,
      (token) => {
        setIsTyping(false);
        accumulatedText += token;
        setStreamedText(accumulatedText);
      },
      () => {
        // Fallback to local context engine
        const fallbackRes = queryAIAssistant(userPrompt);
        setCurrentResponse(fallbackRes);
        setIsTyping(false);
      }
    );

    if (accumulatedText) {
      setCurrentResponse({
        answer: accumulatedText,
        sourceTab: 'about',
        sourceTitle: 'System Specification'
      });
    }
  };

  return (
    <div className="w-full space-y-6 pt-4 sm:pt-8 pb-4 border-b border-stone-200 dark:border-stone-800">
      {/* Search Engine Header Title */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-700/10 text-emerald-800 dark:text-emerald-300 border border-emerald-700/20">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Interactive Career Intelligence & Search Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          Ask anything about {personalInfo.name}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-light max-w-xl mx-auto leading-relaxed">
          Explore Jack's 6+ years of engineering leadership, 3M+ transaction scaling at Epic Systems, technical architecture, and cloud certifications.
        </p>
      </div>

      {/* Prominent Search Bar (Edge AI Lander Style) */}
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="relative flex items-center shadow-lg rounded-2xl bg-white dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 focus-within:border-emerald-600 transition-all p-1.5"
        >
          <div className="pl-3.5 pr-2 text-stone-400">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about team leadership, 3M+ transaction billing engine, or AWS certs..."
            aria-label="Ask AI Assistant a question"
            className="w-full py-3 bg-transparent text-stone-900 dark:text-stone-100 text-sm font-medium placeholder-stone-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim() || isTyping}
            aria-label="Send Query"
            className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-mono font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
          >
            <span>Search</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Prominent Quick-Prompt Chips Under Search Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <span className="text-xs font-mono text-stone-400 dark:text-stone-500">Quick queries:</span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(prompt)}
              className="px-3 py-1.5 rounded-full text-xs font-mono bg-stone-100 dark:bg-stone-800/80 hover:bg-emerald-700/10 hover:text-emerald-800 dark:hover:text-emerald-300 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-all cursor-pointer shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Search Answer / Result Card */}
      {(isTyping || streamedText || currentResponse) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto glass-panel rounded-2xl p-6 space-y-3 border border-emerald-600/30 dark:border-emerald-500/30 shadow-xl"
        >
          {isTyping && (
            <div className="flex items-center gap-2 font-mono text-xs text-emerald-700 dark:text-emerald-400 py-2">
              <Bot className="w-4 h-4 animate-spin" />
              <span>Analyzing Jack's career history & system specifications...</span>
            </div>
          )}

          {!isTyping && (
            <>
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2 text-xs font-mono text-stone-500">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>AI Career Intelligence Answer</span>
                </span>
                <span>Synthesized Result</span>
              </div>
              <p className="text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed font-light">
                {streamedText || currentResponse?.answer}
              </p>

              {currentResponse?.sourceTab && (
                <div className="pt-3 flex items-center justify-between border-t border-stone-200 dark:border-stone-800 text-xs">
                  <span className="text-stone-500 font-mono">
                    Referenced Context: <strong className="text-stone-800 dark:text-stone-200 font-serif">{currentResponse.sourceTitle}</strong>
                  </span>
                  <button
                    onClick={() => setActiveTab(currentResponse.sourceTab!)}
                    className="inline-flex items-center gap-1.5 font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer text-xs"
                  >
                    <span>Explore Section</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Quick Direct Navigation Links */}
      <div className="flex items-center justify-center gap-4 pt-2 text-xs font-mono text-stone-500">
        <button onClick={() => setActiveTab('about')} className="hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer">
          <User className="w-3.5 h-3.5" /> <span>Executive Overview</span>
        </button>
        <span>•</span>
        <button onClick={() => setActiveTab('career')} className="hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer">
          <Briefcase className="w-3.5 h-3.5" /> <span>Career Timeline</span>
        </button>
        <span>•</span>
        <button onClick={() => setActiveTab('projects')} className="hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer">
          <Layers className="w-3.5 h-3.5" /> <span>Case Studies</span>
        </button>
      </div>
    </div>
  );
};
