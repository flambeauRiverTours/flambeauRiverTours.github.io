import React from 'react';
import { motion } from 'framer-motion';
import { Mail, FileText, Code2, ShieldCheck, Terminal, Award, CheckCircle2, MapPin } from 'lucide-react';
import { personalInfo, sectionHeaderImages } from '../../datamodel/portfolioData';

interface AboutSectionProps {
  setActiveTab?: (tabId: string) => void;
}

export const AboutSection: React.FC<AboutSectionProps> = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Cover Header */}
      <div className="relative rounded-2xl overflow-hidden glass-panel border border-stone-200 dark:border-stone-800 shadow-md">
        <div className="relative h-56 sm:h-72 w-full">
          <img
            src={sectionHeaderImages.about}
            alt={personalInfo.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent"></div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono bg-stone-900/80 text-stone-200 border border-stone-700/80 mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{personalInfo.location}</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                {personalInfo.name}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 font-light max-w-2xl leading-relaxed">
                {personalInfo.tagline}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={personalInfo.cvUrl}
                download="CV - Jack Treadwell.pdf"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-mono text-xs transition-all shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download CV.pdf</span>
              </a>
              <a
                href={`mailto:${personalInfo.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass-panel text-white hover:bg-white/10 font-mono text-xs transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Key Executive Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {personalInfo.metrics.map((metric, idx) => (
          <div key={idx} className="glass-panel rounded-xl p-5 text-center space-y-1 glass-panel-hover border border-stone-200 dark:border-stone-800">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-800 dark:text-emerald-400">
              {metric.value}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
              {metric.label}
            </div>
            <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 leading-tight pt-0.5">
              {metric.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* Executive Summary Card */}
      <div className="glass-panel rounded-xl p-6 sm:p-8 space-y-4 border border-stone-200 dark:border-stone-800">
        <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          <span>Executive Overview</span>
        </h3>

        <div className="space-y-3 text-stone-700 dark:text-stone-300 leading-relaxed text-sm sm:text-base font-light">
          {personalInfo.executiveSummary.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Certifications Section */}
      <div className="glass-panel rounded-xl p-6 sm:p-8 space-y-4 border border-stone-200 dark:border-stone-800">
        <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          <span>Professional Certifications</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {personalInfo.certifications.map((cert) => (
            <div key={cert.id} className="p-4 rounded-lg bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                {cert.badgeTag && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-700/10 text-emerald-800 dark:text-emerald-300 border border-emerald-700/20">
                    {cert.badgeTag}
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{cert.title}</h4>
                <p className="text-xs font-mono text-stone-500 dark:text-stone-400 mt-1">{cert.issuer} • {cert.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Structured Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {personalInfo.skills.map((skillCategory, idx) => (
          <div key={idx} className="glass-panel rounded-xl p-6 space-y-3 border border-stone-200 dark:border-stone-800">
            <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              {idx === 0 && <Code2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />}
              {idx === 1 && <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />}
              {idx === 2 && <Terminal className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />}
              <span>{skillCategory.category}</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {skillCategory.items.map((item, itemIdx) => (
                <span key={itemIdx} className="badge-tag">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
