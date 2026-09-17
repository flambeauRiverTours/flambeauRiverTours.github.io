import React from 'react';
import { motion } from 'framer-motion';
import { Mail, FileText, MapPin } from 'lucide-react';
import { personalInfo } from '../../datamodel/portfolioData';
import { GithubIcon, LinkedinIcon } from '../UI/SocialIcons';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  tabs: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <aside className="w-full flex flex-col justify-between p-6 glass-panel rounded-2xl">
      {/* Profile Header */}
      <div>
        <div className="flex flex-col items-center text-center pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="relative group mb-4">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
            <img
              src={personalInfo.avatarUrl}
              alt={personalInfo.name}
              className="relative w-28 h-28 rounded-full object-cover border-2 border-white/80 dark:border-slate-700/80 shadow-md"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Open to Opportunities"></span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {personalInfo.name}
          </h1>
          <p className="text-xs text-blue-600 dark:text-sky-400 font-medium mt-1">
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
                    ? 'text-blue-600 dark:text-sky-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className="absolute inset-0 bg-blue-500/10 dark:bg-sky-500/15 border border-blue-500/20 dark:border-sky-500/30 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-blue-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
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
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-slate-50 dark:text-slate-900 font-medium text-xs hover:bg-slate-800 dark:hover:bg-white transition-all shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Download CV</span>
        </a>

        <div className="flex items-center justify-center gap-2 pt-2 text-slate-500 dark:text-slate-400">
          <a
            href={`mailto:${personalInfo.email}`}
            title="Email"
            className="p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
          >
            <Mail className="w-4 h-4" />
          </a>
          <a
            href={personalInfo.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            className="p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
          <a
            href={personalInfo.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            className="p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
          >
            <LinkedinIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </aside>
  );
};
