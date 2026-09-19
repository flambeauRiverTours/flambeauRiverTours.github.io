import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Send, Bot, ArrowRight } from 'lucide-react';
import { QUICK_PROMPTS, queryAIAssistant, AIResponse } from '../../datamodel/aiContext';
import { streamAIChat } from '../../services/aiStreamService';

interface SpecQueryAssistantProps {
  setActiveTab: (tabId: string) => void;
}

export const SpecQueryAssistant: React.FC<SpecQueryAssistantProps> = ({ setActiveTab }) => {
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
    <div className="glass-panel rounded-xl p-6 space-y-4 border border-stone-200 dark:border-stone-800">
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
            System Specification Query Tool
          </h3>
        </div>
        <span className="text-xs font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-700">
          CLI / AI Query Mode
        </span>
      </div>

      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-light">
        Query Jack's career specifications, team management metrics, software architecture experience, or credentials:
      </p>

      {/* Input Query Line */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(query);
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 font-mono text-xs text-stone-400">$</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. query --topic='team leadership'"
            className="w-full pl-7 pr-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs font-mono placeholder-stone-400 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-emerald-600"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim() || isTyping}
          className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-stone-50 dark:text-stone-900 font-mono font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <span>Query</span>
          <Send className="w-3 h-3" />
        </button>
      </form>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(prompt)}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-stone-100 dark:bg-stone-800/60 hover:bg-emerald-600/10 hover:text-emerald-800 dark:hover:text-emerald-300 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-all cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Answer Output Block */}
      {(isTyping || streamedText || currentResponse) && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-lg bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-2 text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-light"
        >
          {isTyping && (
            <div className="flex items-center gap-2 font-mono text-xs text-emerald-700 dark:text-emerald-400">
              <Bot className="w-4 h-4 animate-spin" />
              <span>Querying system specification engine...</span>
            </div>
          )}

          {!isTyping && (
            <>
              <p className="font-mono text-[11px] text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800 pb-1.5">
                Specification Result:
              </p>
              <p>{streamedText || currentResponse?.answer}</p>

              {currentResponse?.sourceTab && (
                <div className="pt-2 flex items-center justify-between border-t border-stone-200 dark:border-stone-800 text-xs">
                  <span className="text-stone-500 font-mono text-[10px]">
                    Reference: <strong className="text-stone-700 dark:text-stone-300 font-sans">{currentResponse.sourceTitle}</strong>
                  </span>
                  <button
                    onClick={() => setActiveTab(currentResponse.sourceTab!)}
                    className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer text-xs"
                  >
                    <span>View Section</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};
