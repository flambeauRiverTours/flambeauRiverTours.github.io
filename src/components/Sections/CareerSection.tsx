import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { careerData, sectionHeaderImages } from '../../datamodel/portfolioData';

export const CareerSection: React.FC = () => {
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
          src={sectionHeaderImages.career}
          alt="Career Journey"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-transparent"></div>
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-sky-400" />
            <span>My Career</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Professional trajectory, leadership impact, and full-stack software development experience.
          </p>
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative pl-4 sm:pl-6 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-300/50 dark:before:bg-slate-700/50">
        {careerData.map((item) => (
          <div key={item.id} className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-[1.35rem] sm:-left-[1.6rem] top-1.5 w-4 h-4 rounded-full bg-blue-600 dark:bg-sky-400 border-4 border-slate-100 dark:border-slate-900 shadow-sm"></div>

            <div className="glass-panel rounded-2xl p-6 space-y-4 glass-panel-hover">
              {/* Role & Company header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {item.role}
                  </h3>
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-sky-400 mt-0.5">
                    <span>{item.company}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 self-start sm:self-center">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  <span>{item.period}</span>
                </div>
              </div>

              {/* Summary */}
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {item.summary}
              </p>

              {/* Key Achievements Bullet Points */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Key Accomplishments & Impact
                </h4>
                <ul className="space-y-2">
                  {item.achievements.map((achieve, aIdx) => (
                    <li key={aIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{achieve}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skill tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {item.skills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 dark:bg-sky-500/15 text-blue-700 dark:text-sky-300 border border-blue-500/20 dark:border-sky-500/30"
                  >
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
};
