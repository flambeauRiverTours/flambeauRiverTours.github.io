import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  imageSrc: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon: Icon, imageSrc }) => (
  <div className="relative rounded-3xl overflow-hidden glass-panel h-40 sm:h-52 border border-purple-300/40 dark:border-purple-500/20 shadow-xl">
    <img src={imageSrc} alt={title} className="w-full h-full object-cover opacity-85 dark:opacity-75 blur-[0.5px]" />
    <div className="absolute inset-0 bg-gradient-to-t from-purple-950/85 via-purple-950/40 to-transparent backdrop-blur-[2px]" />
    <div className="absolute bottom-6 left-6 right-6 space-y-1">
      <h2 className="text-2xl sm:text-3xl font-serif text-purple-50 tracking-tight flex items-center gap-2.5">
        <Icon className="w-6 h-6 text-purple-300 animate-pulse" />
        <span>{title}</span>
      </h2>
      {subtitle && <p className="text-xs sm:text-sm text-purple-200/90 font-light tracking-wide">{subtitle}</p>}
    </div>
  </div>
);
