import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Calendar, Maximize2, Globe } from 'lucide-react';
import { travelData, sectionHeaderImages, TravelItem } from '../../datamodel/portfolioData';
import { LightboxModal } from '../UI/LightboxModal';

export const TravelSection: React.FC = () => {
  const [selectedTravel, setSelectedTravel] = useState<TravelItem | null>(null);

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
          src={sectionHeaderImages.travel}
          alt="Travels"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-transparent"></div>
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-sky-400" />
            <span>My Travel</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Explored 15+ countries and 5 continents. Highlights from world travels and adventures.
          </p>
        </div>
      </div>

      {/* Intro Note */}
      <div className="glass-panel rounded-2xl p-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-center gap-3">
        <Globe className="w-5 h-5 text-blue-600 dark:text-sky-400 shrink-0" />
        <p>
          I love exploring new cultures, hiking scenic landscapes, and experiencing local food around the globe. Click on any card below for full photo details.
        </p>
      </div>

      {/* Travel Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {travelData.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedTravel(item)}
            className="group glass-panel rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between glass-panel-hover"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={item.imagePath}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors"></div>
                <span className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5" />
                </span>
                <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-950/70 text-slate-200 backdrop-blur-md flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-sky-400" />
                  {item.timeframe}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 flex flex-wrap gap-1">
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <LightboxModal item={selectedTravel} onClose={() => setSelectedTravel(null)} />
    </motion.div>
  );
};
