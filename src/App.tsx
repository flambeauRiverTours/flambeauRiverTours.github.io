import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { User, Briefcase, Layers } from 'lucide-react';
import { Sidebar } from './components/Navigation/Sidebar';
import { Navbar } from './components/Navigation/Navbar';
import { AboutSection } from './components/Sections/AboutSection';
import { CareerSection } from './components/Sections/CareerSection';
import { ProjectsSection } from './components/Sections/ProjectsSection';

const TABS = [
  { id: 'about', label: 'Executive Overview', icon: User },
  { id: 'career', label: 'My Career', icon: Briefcase },
  { id: 'projects', label: 'Case Studies', icon: Layers },
];

export function App() {
  const [activeTab, setActiveTab] = useState<string>('about');
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAIOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen relative bg-purple-50/30 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-purple-400 selection:text-white">
      {/* Iridescent Ethereal Aura Lighting Glows */}
      <div className="fixed top-0 left-1/4 w-[32rem] h-[32rem] bg-purple-400/15 dark:bg-purple-600/15 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>
      <div className="fixed bottom-0 right-1/4 w-[32rem] h-[32rem] bg-pink-400/15 dark:bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none translate-y-1/2"></div>
      <div className="fixed top-1/2 right-10 w-96 h-96 bg-sky-300/10 dark:bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-screen flex flex-col justify-between relative z-10">
        <div className="space-y-8">
          {/* Mobile Top Navbar */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabs={TABS}
            isAIOpen={isAIOpen}
            setIsAIOpen={setIsAIOpen}
          />

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Desktop Sidebar Navigation */}
            <div className="hidden lg:block lg:col-span-4 xl:col-span-3 relative z-30">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={TABS}
                isAIOpen={isAIOpen}
                setIsAIOpen={setIsAIOpen}
              />
            </div>

            {/* Main Content Body */}
            <main className="lg:col-span-8 xl:col-span-9 min-h-[80vh]">
              <AnimatePresence mode="wait">
                {activeTab === 'about' && <AboutSection key="about" />}
                {activeTab === 'career' && <CareerSection key="career" />}
                {activeTab === 'projects' && <ProjectsSection key="projects" />}
              </AnimatePresence>
            </main>
          </div>
        </div>

        {/* Minimalist Ethereal Footer */}
        <footer className="mt-16 pt-8 border-t border-purple-200/40 dark:border-purple-900/30 text-center text-xs text-purple-900/60 dark:text-purple-300/60 tracking-wider">
          <p>© {new Date().getFullYear()} Jack Treadwell — Crafted with React, TypeScript & Ethereal Glassmorphism</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
