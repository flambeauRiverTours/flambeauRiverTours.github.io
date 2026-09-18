import React from 'react';
import { motion } from 'framer-motion';
import { Mail, FileText, MapPin, Sparkles } from 'lucide-react';
import { personalInfo } from '../../datamodel/portfolioData';
import { GithubIcon, LinkedinIcon } from '../UI/SocialIcons';
import { AvatarSpeechBubble } from '../UI/AvatarSpeechBubble';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  tabs: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  isAIOpen: boolean;
  setIsAIOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, tabs, isAIOpen, setIsAIOpen }) => {
  return (
    <aside className="relative w-full flex flex-col justify-between p-6 glass-panel rounded-2xl">
      {/* Profile Header */}
      <div>
        <div className="flex flex-col items-center text-center pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="relative mb-4">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsAIOpen((prev) => !prev);
              }}
              className="relative group cursor-pointer"
              title="Click to Chat with Jack's AI Assistant (⌘K)"
            >
              <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-500 via-amber-400 to-emerald-500 rounded-full blur opacity-30 group-hover:opacity-100 group-hover:animate-spin transition duration-1000"></div>
              <motion.img
                whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
                transition={{ duration: 0.4 }}
                src={personalInfo.avatarUrl}
                alt={personalInfo.name}
                className="relative w-28 h-28 rounded-full object-cover border-2 border-white/80 dark:border-slate-700/80 shadow-md"
              />
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white shadow-md border border-teal-400/40 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                <span>Ask AI ✦</span>
              </span>
            </div>

            {/* AI Speech Bubble Anchored directly to the right of the desktop sidebar headshot */}
            <AvatarSpeechBubble
              isOpen={isAIOpen}
              onClose={() => setIsAIOpen(false)}
              setActiveTab={setActiveTab}
              variant="sidebar"
            />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {personalInfo.name}
          </h1>
          <p className="text-xs text-teal-700 dark:text-teal-300 font-medium mt-1">
            {personalInfo.title}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{personalInfo.location}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-6 flex flex-col space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-teal-700 dark:text-teal-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className="absolute inset-0 bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 dark:border-teal-500/30 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Quick Actions */}
      <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 space-y-3">
        <a
          href={personalInfo.cvUrl}
          download="CV - Jack Treadwell.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Download CV</span>
        </a>

        <div className="flex items-center justify-center gap-2 pt-2 text-slate-500 dark:text-slate-400">
          <a
            href={`mailto:${personalInfo.email}`}
            title="Email"
            className="icon-btn hover:text-teal-600 dark:hover:text-teal-400"
          >
            <Mail className="w-4 h-4" />
          </a>
          <a
            href={personalInfo.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            className="icon-btn hover:text-slate-900 dark:hover:text-slate-100"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
          <a
            href={personalInfo.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            className="icon-btn hover:text-teal-600 dark:hover:text-teal-400"
          >
            <LinkedinIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </aside>
  );
};
