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
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="space-y-8"
  >
    <SectionHeader
      title="Architectural & Engineering Case Studies"
      subtitle="Deep-dive enterprise case studies detailing problem statements, technical solutions, and business impact."
      icon={Code2}
      imageSrc={sectionHeaderImages.projects}
    />

    <div className="space-y-6">
      {caseStudiesData.map((cs) => (
        <div key={cs.id} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 glass-panel-hover border border-purple-200/40 dark:border-purple-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-purple-200/30 dark:border-purple-900/30">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-800 dark:text-purple-200 border border-purple-500/20 mb-2">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span>{cs.category}</span>
              </span>
              <h3 className="text-2xl font-serif text-slate-900 dark:text-slate-100">{cs.title}</h3>
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mt-1">{cs.subtitle}</p>
            </div>
            <span className="text-xs font-medium text-purple-900/60 dark:text-purple-300/60 bg-purple-500/5 px-3 py-1.5 rounded-full border border-purple-200/30 self-start sm:self-center">
              {cs.period}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-purple-900/60 dark:text-purple-300/60">Problem Statement</h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-light">
                {cs.problemStatement}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-purple-900/60 dark:text-purple-300/60">Architecture & Solution</h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-light">
                {cs.architectureSolution}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-purple-900/60 dark:text-purple-300/60 mb-3">Key Business & Technical Impact</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {cs.impactMetrics.map((metric, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-purple-500/5 dark:bg-purple-900/20 p-3 rounded-2xl border border-purple-200/30 dark:border-purple-800/30 font-light">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-purple-200/30 dark:border-purple-900/30">
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
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 transition-colors"
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
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
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
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
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
