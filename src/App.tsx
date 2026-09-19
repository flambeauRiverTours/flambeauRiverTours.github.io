import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { User, Briefcase, Layers } from 'lucide-react';
import { Sidebar } from './components/Navigation/Sidebar';
import { Navbar } from './components/Navigation/Navbar';
import { AboutSection } from './components/Sections/AboutSection';
import { CareerSection } from './components/Sections/CareerSection';
import { ProjectsSection } from './components/Sections/ProjectsSection';
import { SearchHeroLander } from './components/UI/SearchHeroLander';

const TABS = [
  { id: 'about', label: 'Executive Overview', icon: User },
  { id: 'career', label: 'My Career', icon: Briefcase },
  { id: 'projects', label: 'Case Studies', icon: Layers },
];

export function App() {
  const [activeTab, setActiveTab] = useState<string>('about');

  return (
    <div className="min-h-screen relative bg-stone-100/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans selection:bg-emerald-700 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-screen flex flex-col justify-between relative z-10 space-y-8">
        {/* Search Engine Hero Lander (Primary Focus) */}
        <SearchHeroLander setActiveTab={setActiveTab} />

        <div className="space-y-8">
          {/* Mobile Top Navbar */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabs={TABS}
          />

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Desktop Sidebar Navigation */}
            <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={TABS}
              />
            </div>

            {/* Main Content Body */}
            <main className="lg:col-span-8 xl:col-span-9 min-h-[70vh]">
              <AnimatePresence mode="wait">
                {activeTab === 'about' && <AboutSection key="about" setActiveTab={setActiveTab} />}
                {activeTab === 'career' && <CareerSection key="career" />}
                {activeTab === 'projects' && <ProjectsSection key="projects" />}
              </AnimatePresence>
            </main>
          </div>
        </div>

        {/* Minimalist Document Footer */}
        <footer className="mt-16 pt-8 border-t border-stone-200 dark:border-stone-800 text-center text-xs font-mono text-stone-500 dark:text-stone-400">
          <p>© {new Date().getFullYear()} Jack Treadwell — Built with React, TypeScript & Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
