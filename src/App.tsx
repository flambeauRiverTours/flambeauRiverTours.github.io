import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { User, Briefcase, Code2, BookOpen, Compass } from 'lucide-react';
import { Sidebar } from './components/Navigation/Sidebar';
import { Navbar } from './components/Navigation/Navbar';
import { AboutSection } from './components/Sections/AboutSection';
import { CareerSection } from './components/Sections/CareerSection';
import { ProjectsSection } from './components/Sections/ProjectsSection';
import { ReadingSection } from './components/Sections/ReadingSection';
import { TravelSection } from './components/Sections/TravelSection';

const TABS = [
  { id: 'about', label: 'About Me', icon: User },
  { id: 'career', label: 'My Career', icon: Briefcase },
  { id: 'projects', label: 'My Projects', icon: Code2 },
  { id: 'reading', label: 'My Reading List', icon: BookOpen },
  { id: 'travel', label: 'My Travel', icon: Compass },
];

export function App() {
  const [activeTab, setActiveTab] = useState<string>('about');

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Background ambient lighting glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 min-h-screen flex flex-col justify-between">
        <div className="space-y-6">
          {/* Mobile Top Navbar */}
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Desktop Sidebar Navigation */}
            <div className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-8">
              <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
            </div>

            {/* Main Content Body */}
            <main className="lg:col-span-8 xl:col-span-9 min-h-[80vh]">
              <AnimatePresence mode="wait">
                {activeTab === 'about' && <AboutSection key="about" />}
                {activeTab === 'career' && <CareerSection key="career" />}
                {activeTab === 'projects' && <ProjectsSection key="projects" />}
                {activeTab === 'reading' && <ReadingSection key="reading" />}
                {activeTab === 'travel' && <TravelSection key="travel" />}
              </AnimatePresence>
            </main>
          </div>
        </div>

        {/* Minimalist Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Jack Treadwell. Built with React, TypeScript, Vite & Tailwind CSS.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
