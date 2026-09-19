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
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Hero Ethereal Cover Card */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-purple-200/50 dark:border-purple-500/20 shadow-2xl">
        <div className="relative h-64 sm:h-80 w-full">
          <img
            src={sectionHeaderImages.about}
            alt={personalInfo.name}
            className="w-full h-full object-cover opacity-90 dark:opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-purple-950/40 to-transparent backdrop-blur-[2px]"></div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <motion.span
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-400/20 text-purple-200 border border-purple-300/30 backdrop-blur-md mb-1 cursor-default"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" style={{ animationDuration: '8s' }} />
                <span>{personalInfo.location}</span>
              </motion.span>
              <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-wide">
                {personalInfo.name}
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/90 font-light max-w-2xl leading-relaxed tracking-wide">
                {personalInfo.tagline}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={personalInfo.cvUrl}
                download="CV - Jack Treadwell.pdf"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600/90 hover:bg-purple-500 text-white font-medium text-xs transition-all shadow-lg shadow-purple-500/20 backdrop-blur-md"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download CV</span>
              </a>
              <a
                href={`mailto:${personalInfo.email}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-panel text-white hover:bg-white/20 font-medium text-xs transition-all"
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
          <div key={idx} className="glass-panel rounded-3xl p-5 text-center space-y-1 glass-panel-hover border border-purple-200/40 dark:border-purple-500/20">
            <div className="text-3xl sm:text-4xl font-serif font-light text-purple-700 dark:text-purple-300">
              {metric.value}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-wide">
              {metric.label}
            </div>
            <div className="text-[11px] text-purple-900/60 dark:text-purple-300/60 leading-tight pt-0.5 font-light">
              {metric.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* Executive Summary Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-purple-200/40 dark:border-purple-500/20">
        <h3 className="text-xl font-serif text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span>Executive Overview</span>
        </h3>

        <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base font-light tracking-wide">
          {personalInfo.executiveSummary.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Certifications Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-purple-200/40 dark:border-purple-500/20">
        <h3 className="text-xl font-serif text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Award className="w-5 h-5 text-purple-500" />
          <span>Professional Certifications</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {personalInfo.certifications.map((cert) => (
            <div key={cert.id} className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-900/20 border border-purple-200/40 dark:border-purple-800/30 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                {cert.badgeTag && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    {cert.badgeTag}
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cert.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">{cert.issuer} • {cert.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Structured Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {personalInfo.skills.map((skillCategory, idx) => (
          <div key={idx} className="glass-panel rounded-3xl p-6 space-y-3.5 border border-purple-200/40 dark:border-purple-500/20">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {idx === 0 && <Code2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
              {idx === 1 && <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              {idx === 2 && <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />}
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
