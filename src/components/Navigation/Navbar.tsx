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
    <header className="lg:hidden sticky top-0 z-40 w-full px-4 py-3 glass-panel border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={personalInfo.avatarUrl}
            alt={personalInfo.name}
            className="w-10 h-10 rounded-full object-cover border border-white/80 dark:border-slate-700/80 shadow-sm"
          />
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">{personalInfo.name}</h1>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">{activeTabObj?.label}</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-xl glass-panel text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
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
            className="overflow-hidden mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50"
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold border border-teal-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
              <a
                href={personalInfo.cvUrl}
                download="CV - Jack Treadwell.pdf"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-slate-50 dark:text-slate-900 font-medium text-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download CV</span>
              </a>

              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <a href={`mailto:${personalInfo.email}`} className="p-1.5 hover:text-teal-600"><Mail className="w-4 h-4" /></a>
                <a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:text-slate-900 dark:hover:text-white"><GithubIcon className="w-4 h-4" /></a>
                <a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:text-teal-600"><LinkedinIcon className="w-4 h-4" /></a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
