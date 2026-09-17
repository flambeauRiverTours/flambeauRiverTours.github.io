import React from 'react';
import { motion } from 'framer-motion';
import { Code2, ExternalLink, GitPullRequest, CheckCircle2, Sparkles } from 'lucide-react';
import { projectsData, sectionHeaderImages } from '../../datamodel/portfolioData';
import { GithubIcon } from '../UI/SocialIcons';

export const ProjectsSection: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden glass-panel h-36 sm:h-48">
        <img
          src={sectionHeaderImages.projects}
          alt="Projects"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-transparent"></div>
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Code2 className="w-6 h-6 text-sky-400" />
            <span>Featured Projects</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Personal software engineering initiatives, open source contributions, and web applications.
          </p>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6">
        {projectsData.map((project) => (
          <div key={project.id} className="glass-panel rounded-2xl p-6 space-y-4 glass-panel-hover">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {project.title}
                  </h3>
                  {project.featured && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <Sparkles className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-600 dark:text-sky-400 font-medium mt-0.5">
                  {project.subtitle}
                </p>
              </div>

              {/* Action Links */}
              <div className="flex items-center gap-2">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs hover:bg-slate-800 dark:hover:bg-white transition-all"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                )}
                {project.prUrl && (
                  <a
                    href={project.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white font-medium text-xs hover:bg-purple-500 transition-all"
                  >
                    <GitPullRequest className="w-3.5 h-3.5" />
                    <span>Pull Request</span>
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-medium text-xs hover:bg-blue-500 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Live App</span>
                  </a>
                )}
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {project.description}
            </p>

            {/* Highlights List */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Highlights & Architecture
              </h4>
              <ul className="space-y-1.5">
                {project.highlights.map((highlight, hIdx) => (
                  <li key={hIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technologies */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {project.technologies.map((tech, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700/40"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
