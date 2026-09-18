import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Maximize2, Calendar } from 'lucide-react';
import { travelData, TravelItem, sectionHeaderImages } from '../../datamodel/portfolioData';
import { LightboxModal } from '../UI/LightboxModal';
import { SectionHeader } from '../UI/SectionHeader';

export const TravelSection: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<TravelItem | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <SectionHeader
        title="My Travel Log"
        subtitle="Adventures, outdoor treks, and global cultural explorations."
        icon={Compass}
        imageSrc={sectionHeaderImages.travel}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {travelData.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="group cursor-pointer glass-panel rounded-2xl overflow-hidden glass-panel-hover flex flex-col justify-between"
          >
            <div className="relative h-44 w-full overflow-hidden">
              <img
                src={item.imagePath}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="p-2.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md shadow-lg">
                  <Maximize2 className="w-4 h-4" />
                </span>
              </div>
            </div>

            <div className="p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {item.title}
                </h3>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  {item.timeframe}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              <div className="flex flex-wrap gap-1 pt-1">
                {item.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <LightboxModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </motion.div>
  );
};
