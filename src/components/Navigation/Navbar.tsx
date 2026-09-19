import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, FileText, Mail } from 'lucide-react';
import { personalInfo } from '../../datamodel/portfolioData';
import { GithubIcon, LinkedinIcon } from '../UI/SocialIcons';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  tabs: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, tabs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeTabObj = tabs.find((t) => t.id === activeTab);

  return (
    <header className="lg:hidden sticky top-0 z-40 w-full px-4 py-3 glass-panel border border-stone-200 dark:border-stone-800 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={personalInfo.avatarUrl}
            alt={personalInfo.name}
            className="w-10 h-10 rounded-full object-cover border border-stone-300 dark:border-stone-700 shadow-sm"
          />
          <div>
            <h1 className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100">{personalInfo.name}</h1>
            <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">{activeTabObj?.label}</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg glass-panel text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3 pt-3 border-t border-stone-200 dark:border-stone-800"
          >
            <nav className="flex flex-col space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-stone-200/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 font-semibold border border-stone-300/60 dark:border-stone-700/60'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-400'}`} />
                    <span className="font-serif">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <a
                href={personalInfo.cvUrl}
                download="CV - Jack Treadwell.pdf"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-mono text-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download CV.pdf</span>
              </a>

              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                <a href={`mailto:${personalInfo.email}`} className="p-1.5 hover:text-emerald-700"><Mail className="w-4 h-4" /></a>
                <a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:text-stone-900 dark:hover:text-white"><GithubIcon className="w-4 h-4" /></a>
                <a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:text-emerald-700"><LinkedinIcon className="w-4 h-4" /></a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
