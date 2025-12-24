import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ContentPlanner from './components/ContentPlanner';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import { ViewState, ContentProject, CalendarEvent, JournalEntry, ProjectLog, DailyTodo, UserProfile } from './types';

// Preset backgrounds
const PRESET_BACKGROUNDS = [
  { id: 'gradient-1', value: 'bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900', type: 'class', label: 'Cotton Candy' },
  { id: 'gradient-2', value: 'bg-gradient-to-bl from-blue-300 via-teal-300 to-emerald-300 dark:from-blue-900 dark:via-teal-900 dark:to-emerald-900', type: 'class', label: 'Ocean Breeze' },
  { id: 'image-1', value: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80', type: 'image', label: 'Abstract Paint' },
  { id: 'image-2', value: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80', type: 'image', label: 'Misty Mountains' },
  { id: 'image-3', value: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80', type: 'image', label: 'Liquid Noir' },
  { id: 'image-4', value: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80', type: 'image', label: 'Retro Future' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.PLANNER);
  
  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('cs_darkmode');
    return saved ? JSON.parse(saved) : false;
  });

  // Background State (Presets + Custom)
  const [backgrounds, setBackgrounds] = useState<any[]>(() => {
     const savedCustom = localStorage.getItem('cs_custom_bgs');
     const customBgs = savedCustom ? JSON.parse(savedCustom) : [];
     return [...PRESET_BACKGROUNDS, ...customBgs];
  });

  const [bgIndex, setBgIndex] = useState<number>(() => {
    const saved = localStorage.getItem('cs_bgindex');
    // Ensure index is valid in case backgrounds changed
    const idx = saved ? parseInt(saved) : 0;
    return idx < 0 ? 0 : idx;
  });

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
      const saved = localStorage.getItem('cs_profile');
      return saved ? JSON.parse(saved) : { 
          name: 'CreatorStudio', 
          avatarType: 'initials', 
          avatarValue: 'from-blue-500 to-indigo-600' 
      };
  });

  // Data Persistence
  const [projects, setProjects] = useState<ContentProject[]>(() => {
    const saved = localStorage.getItem('cs_projects');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('cs_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('cs_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [projectLogs, setProjectLogs] = useState<ProjectLog[]>(() => {
    const saved = localStorage.getItem('cs_logs');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [dailyTodos, setDailyTodos] = useState<DailyTodo[]>(() => {
    const saved = localStorage.getItem('cs_todos');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => localStorage.setItem('cs_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('cs_events', JSON.stringify(events)), [events]);
  useEffect(() => localStorage.setItem('cs_entries', JSON.stringify(entries)), [entries]);
  useEffect(() => localStorage.setItem('cs_logs', JSON.stringify(projectLogs)), [projectLogs]);
  useEffect(() => localStorage.setItem('cs_todos', JSON.stringify(dailyTodos)), [dailyTodos]);
  useEffect(() => localStorage.setItem('cs_darkmode', JSON.stringify(darkMode)), [darkMode]);
  useEffect(() => localStorage.setItem('cs_profile', JSON.stringify(userProfile)), [userProfile]);
  
  useEffect(() => {
      if (bgIndex < backgrounds.length) {
        localStorage.setItem('cs_bgindex', JSON.stringify(bgIndex));
      }
  }, [bgIndex, backgrounds]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAddBackground = (file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
          const base64String = reader.result as string;
          const newBg = {
              id: `custom-${Date.now()}`,
              value: base64String,
              type: 'image',
              label: 'Custom Image'
          };
          const updatedBgs = [...backgrounds, newBg];
          setBackgrounds(updatedBgs);
          setBgIndex(updatedBgs.length - 1);
          
          const customOnly = updatedBgs.filter(b => b.id.startsWith('custom-'));
          try {
            localStorage.setItem('cs_custom_bgs', JSON.stringify(customOnly));
          } catch (e) {
            alert("Image size is too large to save to local storage.");
          }
      };
      reader.readAsDataURL(file);
  };

  const handleResetTheme = () => {
      setBgIndex(0);
      setDarkMode(false);
  };

  const currentBg = backgrounds[bgIndex] || PRESET_BACKGROUNDS[0];

  // Glass transparency logic:
  // Light Mode: bg-white/30 (Clearer glass to see background, heavily blurred)
  // Dark Mode: bg-black/30
  const glassPanelClass = `rounded-3xl overflow-hidden shadow-2xl ring-1 transition-all duration-500 backdrop-blur-3xl z-10 
    ${darkMode ? 'bg-black/30 ring-white/10' : 'bg-white/30 ring-white/40'}`;

  return (
    <div className={`flex h-screen w-screen font-sans overflow-hidden transition-all duration-500 relative bg-gray-50 dark:bg-gray-900 p-4 gap-4`}>
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 transition-all duration-700 ease-in-out">
          {currentBg.type === 'class' ? (
              <div className={`absolute inset-0 ${currentBg.value}`}></div>
          ) : (
              <div 
                className="absolute inset-0"
                style={{ 
                    backgroundImage: `url(${currentBg.value})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center',
                }} 
              />
          )}
          {/* Overlay to ensure text readability */}
          <div className={`absolute inset-0 transition-colors duration-500 ${darkMode ? 'bg-black/50' : 'bg-white/10'}`}></div>
      </div>

      {/* Sidebar - Floating Glass Panel */}
      <aside className={`w-64 h-full shrink-0 ${glassPanelClass}`}>
        <Sidebar 
            currentView={currentView} 
            setView={setCurrentView} 
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            bgIndex={bgIndex}
            setBgIndex={setBgIndex}
            backgrounds={backgrounds}
            onUploadBackground={handleAddBackground}
            onResetTheme={handleResetTheme}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
        />
      </aside>
      
      {/* Main Content - Floating Glass Panel */}
      <main className={`flex-1 h-full min-w-0 ${glassPanelClass}`}>
          {currentView === ViewState.PLANNER && (
            <ContentPlanner 
                projects={projects} 
                setProjects={setProjects}
                projectLogs={projectLogs}
                setProjectLogs={setProjectLogs}
            />
          )}
          
          {currentView === ViewState.CALENDAR && (
            <CalendarView 
                events={events} 
                projects={projects} 
                journalEntries={entries}
                projectLogs={projectLogs}
                dailyTodos={dailyTodos}
                setEvents={setEvents} 
                setJournalEntries={setEntries}
                setProjectLogs={setProjectLogs}
                setDailyTodos={setDailyTodos}
            />
          )}

          {currentView === ViewState.STATS && (
            <StatsView 
                projects={projects}
                journalEntries={entries}
                projectLogs={projectLogs}
            />
          )}
      </main>
    </div>
  );
};

export default App;