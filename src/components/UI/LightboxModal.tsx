import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin } from 'lucide-react';
import { TravelItem } from '../../datamodel/portfolioData';

interface LightboxModalProps {
  item: TravelItem | null;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-3xl w-full glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/60 text-white hover:bg-slate-950/80 transition-colors"
            aria-label="Close photo preview"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image */}
          <div className="relative h-72 sm:h-96 w-full">
            <img
              src={item.imagePath}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                <span>{item.title}</span>
              </h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 dark:bg-sky-500/15 text-blue-600 dark:text-sky-400 border border-blue-500/20">
                <Calendar className="w-3.5 h-3.5" />
                <span>{item.timeframe}</span>
              </span>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {item.description}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
