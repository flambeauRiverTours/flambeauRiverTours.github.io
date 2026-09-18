import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { booksData, sectionHeaderImages } from '../../datamodel/portfolioData';
import { SectionHeader } from '../UI/SectionHeader';

export const ReadingSection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <SectionHeader
      title="My Reading List"
      subtitle="Selected non-fiction, historical literature, and personal growth recommendations."
      icon={BookOpen}
      imageSrc={sectionHeaderImages.reading}
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {booksData.map((book) => (
        <div key={book.id} className="glass-panel rounded-2xl p-6 space-y-3 glass-panel-hover flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{book.title}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
                {book.category}
              </span>
            </div>
            {book.author && <p className="text-xs font-medium text-teal-700 dark:text-teal-300">by {book.author}</p>}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">"{book.review}"</p>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);
