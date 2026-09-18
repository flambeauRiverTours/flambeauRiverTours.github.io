import React from 'react';
import { motion } from 'framer-motion';
import { Code2, ExternalLink, GitPullRequest } from 'lucide-react';
import { projectsData, sectionHeaderImages } from '../../datamodel/portfolioData';
import { SectionHeader } from '../UI/SectionHeader';
import { GithubIcon } from '../UI/SocialIcons';

export const ProjectsSection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <SectionHeader
      title="My Projects"
      subtitle="Open-source packages, side applications, and full-stack engineering experiments."
      icon={Code2}
      imageSrc={sectionHeaderImages.projects}
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {projectsData.map((project) => (
        <div key={project.id} className="glass-panel rounded-2xl p-6 space-y-4 glass-panel-hover flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{project.title}</h3>
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">{project.subtitle}</p>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                {project.period}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {project.description}
            </p>

            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {project.highlights.map((h, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-200/40 dark:border-slate-800/40">
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((tech, idx) => (
                <span key={idx} className="badge-tag">
                  {tech}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>Code</span>
                </a>
              )}
              {project.prUrl && (
                <a
                  href={project.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>View PR</span>
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Demo</span>
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);
