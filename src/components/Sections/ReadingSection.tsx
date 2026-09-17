import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Bookmark, User, Library } from 'lucide-react';
import { booksData, sectionHeaderImages } from '../../datamodel/portfolioData';

export const ReadingSection: React.FC = () => {
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
          src={sectionHeaderImages.reading}
          alt="Reading List"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-transparent"></div>
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-sky-400" />
            <span>My Reading List</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            A personal log of engaging books on history, fiction, finance, and memoirs.
          </p>
        </div>
      </div>

      {/* Intro Note */}
      <div className="glass-panel rounded-2xl p-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <Library className="w-5 h-5 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <p>
          I regularly read e-books on my Kindle Paperwhite, borrowing from public library systems. Below are recent reads that I found particularly thought-provoking, insightful, or entertaining.
        </p>
      </div>

      {/* Books List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {booksData.map((book) => (
          <div key={book.id} className="glass-panel rounded-2xl p-6 flex flex-col justify-between space-y-4 glass-panel-hover">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 dark:bg-sky-500/15 text-blue-600 dark:text-sky-400 border border-blue-500/20">
                  <Bookmark className="w-3 h-3" />
                  {book.category}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {book.title}
              </h3>

              {book.author && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{book.author}</span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
                "{book.review}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
