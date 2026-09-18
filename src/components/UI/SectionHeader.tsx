import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  imageSrc: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon: Icon, imageSrc }) => (
  <div className="relative rounded-2xl overflow-hidden glass-panel h-36 sm:h-48">
    <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-transparent" />
    <div className="absolute bottom-6 left-6 right-6">
      <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
        <Icon className="w-6 h-6 text-amber-300" />
        <span>{title}</span>
      </h2>
      {subtitle && <p className="text-xs sm:text-sm text-slate-300 mt-1">{subtitle}</p>}
    </div>
  </div>
);
