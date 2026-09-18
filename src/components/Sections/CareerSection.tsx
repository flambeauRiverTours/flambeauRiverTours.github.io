import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, MapPin } from 'lucide-react';
import { careerData, sectionHeaderImages } from '../../datamodel/portfolioData';
import { SectionHeader } from '../UI/SectionHeader';

export const CareerSection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <SectionHeader
      title="My Career"
      subtitle="Professional trajectory, leadership impact, and full-stack software development experience."
      icon={Briefcase}
      imageSrc={sectionHeaderImages.career}
    />

    <div className="relative pl-4 sm:pl-6 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-300/50 dark:before:bg-slate-700/50">
      {careerData.map((item) => (
        <div key={item.id} className="relative group">
          <div className="absolute -left-[1.35rem] sm:-left-[1.6rem] top-1.5 w-4 h-4 rounded-full bg-teal-600 dark:bg-teal-400 border-4 border-slate-100 dark:border-slate-900 shadow-sm" />
          <div className="glass-panel rounded-2xl p-6 space-y-4 glass-panel-hover">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.role}</h3>
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-300 mt-0.5">
                  <span>{item.company}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.location}
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 self-start sm:self-center">
                <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{item.period}</span>
              </span>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {item.summary}
            </p>

            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {item.achievements.map((ach, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                  <span>{ach}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
              {item.skills.map((skill, idx) => (
                <span key={idx} className="badge-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);
