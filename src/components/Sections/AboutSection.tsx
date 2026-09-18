import React from 'react';
import { motion } from 'framer-motion';
import { Mail, FileText, Sparkles, Code2, ShieldCheck, Terminal, Award, CheckCircle2 } from 'lucide-react';
import { personalInfo, sectionHeaderImages } from '../../datamodel/portfolioData';

export const AboutSection: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Hero Executive Cover Card */}
      <div className="relative rounded-2xl overflow-hidden glass-panel">
        <div className="relative h-56 sm:h-72 w-full">
          <img
            src={sectionHeaderImages.about}
            alt={personalInfo.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent"></div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <motion.span
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-200 border border-teal-400/30 backdrop-blur-md mb-2 cursor-default"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                <span>{personalInfo.location}</span>
              </motion.span>
              <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                {personalInfo.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
                {personalInfo.tagline}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={personalInfo.cvUrl}
                download="CV - Jack Treadwell.pdf"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-lg shadow-teal-500/25"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download CV</span>
              </a>
              <a
                href={`mailto:${personalInfo.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-panel text-white hover:bg-white/20 font-semibold text-xs transition-all"
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
          <div key={idx} className="glass-panel rounded-2xl p-5 text-center space-y-1 glass-panel-hover">
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 dark:text-teal-300">
              {metric.value}
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {metric.label}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight pt-0.5">
              {metric.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* Executive Summary Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>Executive Overview</span>
        </h3>

        <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
          {personalInfo.executiveSummary.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Certifications Section */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <span>Professional Certifications</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {personalInfo.certifications.map((cert) => (
            <div key={cert.id} className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                {cert.badgeTag && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                    {cert.badgeTag}
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cert.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cert.issuer} • {cert.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Structured Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {personalInfo.skills.map((skillCategory, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-6 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {idx === 0 && <Code2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
              {idx === 1 && <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              {idx === 2 && <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
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
