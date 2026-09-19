import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, MapPin } from 'lucide-react';
import { careerData, sectionHeaderImages } from '../../datamodel/portfolioData';
import { SectionHeader } from '../UI/SectionHeader';

export const CareerSection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <SectionHeader
      title="My Career"
      subtitle="Professional trajectory, leadership impact, and full-stack software development experience."
      icon={Briefcase}
      imageSrc={sectionHeaderImages.career}
    />

    <div className="relative pl-4 sm:pl-6 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-300 dark:before:bg-stone-700">
      {careerData.map((item) => (
        <div key={item.id} className="relative group">
          <div className="absolute -left-[1.35rem] sm:-left-[1.6rem] top-1.5 w-4 h-4 rounded-full bg-emerald-700 dark:bg-emerald-400 border-4 border-stone-100 dark:border-stone-950 shadow-sm" />
          <div className="glass-panel rounded-xl p-6 space-y-4 glass-panel-hover border border-stone-200 dark:border-stone-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">{item.role}</h3>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 mt-0.5">
                  <span>{item.company}</span>
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-500 dark:text-stone-400 font-mono text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.location}
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 self-start sm:self-center">
                <Calendar className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>{item.period}</span>
              </span>
            </div>

            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-light">
              {item.summary}
            </p>

            <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-light">
              {item.achievements.map((ach, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">•</span>
                  <span>{ach}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-200 dark:border-stone-800">
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
