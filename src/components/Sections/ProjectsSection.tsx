import React from 'react';
import { motion } from 'framer-motion';
import { Code2, ExternalLink, GitPullRequest, Layers, CheckCircle, Code } from 'lucide-react';
import { caseStudiesData, sectionHeaderImages } from '../../datamodel/portfolioData';
import { SectionHeader } from '../UI/SectionHeader';

export const ProjectsSection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <SectionHeader
      title="Architectural & Engineering Case Studies"
      subtitle="Deep-dive enterprise case studies detailing problem statements, technical solutions, and business impact."
      icon={Code2}
      imageSrc={sectionHeaderImages.projects}
    />

    <div className="space-y-6">
      {caseStudiesData.map((cs) => (
        <div key={cs.id} className="glass-panel rounded-2xl p-6 sm:p-8 space-y-5 glass-panel-hover">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/20 mb-2">
                <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{cs.category}</span>
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{cs.title}</h3>
              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5">{cs.subtitle}</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg self-start sm:self-center">
              {cs.period}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Problem Statement</h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {cs.problemStatement}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Architecture & Solution</h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {cs.architectureSolution}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Key Business & Technical Impact</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {cs.impactMetrics.map((metric, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-100/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
            <div className="flex flex-wrap gap-1.5">
              {cs.technologies.map((tech, idx) => (
                <span key={idx} className="badge-tag">
                  {tech}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {cs.githubUrl && (
                <a
                  href={cs.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Code</span>
                </a>
              )}
              {cs.prUrl && (
                <a
                  href={cs.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>View Pull Request</span>
                </a>
              )}
              {cs.liveUrl && (
                <a
                  href={cs.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Live Project</span>
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);
