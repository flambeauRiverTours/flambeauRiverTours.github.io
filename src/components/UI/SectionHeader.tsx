import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  imageSrc: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon: Icon, imageSrc }) => (
  <div className="relative rounded-xl overflow-hidden glass-panel h-36 sm:h-48 border border-stone-200 dark:border-stone-800 shadow-sm">
    <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent" />
    <div className="absolute bottom-6 left-6 right-6 space-y-1">
      <h2 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
        <Icon className="w-5 h-5 text-emerald-400" />
        <span>{title}</span>
      </h2>
      {subtitle && <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">{subtitle}</p>}
    </div>
  </div>
);
