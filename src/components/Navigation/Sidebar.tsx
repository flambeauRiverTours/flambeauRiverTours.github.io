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
    <aside className="relative w-full flex flex-col justify-between p-6 glass-panel rounded-3xl border border-purple-200/40 dark:border-purple-500/20">
      {/* Profile Header */}
      <div>
        <div className="flex flex-col items-center text-center pb-6 border-b border-purple-200/30 dark:border-purple-900/30">
          <div className="relative mb-5">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsAIOpen((prev) => !prev);
              }}
              className="relative group cursor-pointer"
              title="Click to Chat with Jack's AI Assistant (⌘K)"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-400 rounded-full blur-md opacity-40 group-hover:opacity-100 group-hover:animate-spin transition duration-1000"></div>
              <motion.img
                whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
                transition={{ duration: 0.5 }}
                src={personalInfo.avatarUrl}
                alt={personalInfo.name}
                className="relative w-28 h-28 rounded-full object-cover border-2 border-white/90 dark:border-purple-300/30 shadow-xl"
              />
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-medium bg-purple-700/90 text-purple-100 shadow-lg border border-purple-400/40 backdrop-blur-md flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Sparkles className="w-2.5 h-2.5 text-purple-200 animate-pulse" />
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

          <h1 className="text-2xl font-serif tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            {personalInfo.name}
          </h1>
          <p className="text-xs text-purple-800 dark:text-purple-300 font-medium mt-1">
            {personalInfo.title}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-purple-900/60 dark:text-purple-300/60 mt-2 font-light">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            <span>{personalInfo.location}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-6 flex flex-col space-y-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'text-purple-900 dark:text-purple-200 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-purple-500/5 dark:hover:bg-purple-400/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className="absolute inset-0 bg-purple-500/10 dark:bg-purple-400/15 border border-purple-500/20 dark:border-purple-400/30 rounded-2xl backdrop-blur-md"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-purple-400/70 dark:text-purple-500/70'}`} />
                <span className="relative z-10 font-serif tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Quick Actions */}
      <div className="pt-6 border-t border-purple-200/30 dark:border-purple-900/30 space-y-3">
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

        <div className="flex items-center justify-center gap-2 pt-1 text-slate-500 dark:text-slate-400">
          <a
            href={`mailto:${personalInfo.email}`}
            title="Email"
            className="icon-btn hover:text-purple-600 dark:hover:text-purple-300"
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
            className="icon-btn hover:text-purple-600 dark:hover:text-purple-300"
          >
            <LinkedinIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </aside>
  );
};
