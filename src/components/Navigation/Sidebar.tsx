import React from 'react';
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
    <aside className="w-full flex flex-col justify-between p-6 glass-panel rounded-xl">
      {/* Profile Header */}
      <div>
        <div className="flex flex-col items-center text-center pb-6 border-b border-stone-200 dark:border-stone-800">
          <img
            src={personalInfo.avatarUrl}
            alt={personalInfo.name}
            className="w-28 h-28 rounded-full object-cover border border-stone-300 dark:border-stone-700 shadow-sm mb-4"
          />

          <h1 className="text-xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {personalInfo.name}
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-medium mt-1">
            {personalInfo.title}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mt-2 font-mono">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-stone-200/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 font-semibold border border-stone-300/60 dark:border-stone-700/60'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-400'}`} />
                <span className="font-serif">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Quick Actions */}
      <div className="pt-6 border-t border-stone-200 dark:border-stone-800 space-y-3">
        <a
          href={personalInfo.cvUrl}
          download="CV - Jack Treadwell.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="font-mono text-xs">Download CV.pdf</span>
        </a>

        <div className="flex items-center justify-center gap-2 pt-1 text-stone-500 dark:text-stone-400">
          <a
            href={`mailto:${personalInfo.email}`}
            title="Email"
            className="icon-btn hover:text-emerald-700 dark:hover:text-emerald-400"
          >
            <Mail className="w-4 h-4" />
          </a>
          <a
            href={personalInfo.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            className="icon-btn hover:text-stone-900 dark:hover:text-stone-100"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
          <a
            href={personalInfo.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            className="icon-btn hover:text-emerald-700 dark:hover:text-emerald-400"
          >
            <LinkedinIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </aside>
  );
};
