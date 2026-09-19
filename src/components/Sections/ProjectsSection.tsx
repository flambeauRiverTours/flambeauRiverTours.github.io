import React from 'react';
import { motion } from 'framer-motion';
import { Code2, ExternalLink, GitPullRequest, Layers, CheckCircle, Code } from 'lucide-react';
import { caseStudiesData, sectionHeaderImages } from '../../datamodel/portfolioData';
import { SectionHeader } from '../UI/SectionHeader';

export const ProjectsSection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
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
        <div key={cs.id} className="glass-panel rounded-xl p-6 sm:p-8 space-y-5 glass-panel-hover border border-stone-200 dark:border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-200 dark:border-stone-800">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 mb-2">
                <Layers className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>{cs.category}</span>
              </span>
              <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">{cs.title}</h3>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 mt-0.5">{cs.subtitle}</p>
            </div>
            <span className="text-xs font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-md border border-stone-200 dark:border-stone-700 self-start sm:self-center">
              {cs.period}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Problem Statement</h4>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-light">
                {cs.problemStatement}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Architecture & Solution</h4>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-light">
                {cs.architectureSolution}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">Key Business & Technical Impact</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {cs.impactMetrics.map((metric, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-900/60 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 font-light">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
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
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
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
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-400 hover:underline"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>View PR</span>
                </a>
              )}
              {cs.liveUrl && (
                <a
                  href={cs.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-400 hover:underline"
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
