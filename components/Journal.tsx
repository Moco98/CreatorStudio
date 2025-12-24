import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { BookOpen, Smile, Frown, Meh, Sun, CloudRain } from 'lucide-react';

interface JournalProps {
  entries: JournalEntry[];
  setEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
}

const moods = [
    { label: 'Happy', icon: Smile, color: 'text-green-500' },
    { label: 'Productive', icon: Sun, color: 'text-yellow-500' },
    { label: 'Neutral', icon: Meh, color: 'text-blue-400' },
    { label: 'Stressed', icon: CloudRain, color: 'text-gray-500' },
    { label: 'Tired', icon: Frown, color: 'text-indigo-400' },
];

const Journal: React.FC<JournalProps> = ({ entries, setEntries }) => {
  // Use local date string
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateString();
  const [activeDate, setActiveDate] = useState(today);
  
  const currentEntry = entries.find(e => e.date === activeDate) || {
    id: 'temp',
    date: activeDate,
    mood: 'Neutral',
    content: '',
    lastUpdated: Date.now()
  };

  const handleSave = (content: string, mood: string) => {
    setEntries(prev => {
        const existing = prev.find(e => e.date === activeDate);
        if (existing) {
            return prev.map(e => e.date === activeDate ? { ...e, content, mood, lastUpdated: Date.now() } : e);
        } else {
            return [...prev, { id: Date.now().toString(), date: activeDate, mood, content, lastUpdated: Date.now() }];
        }
    });
  };

  return (
    <div className="h-full flex flex-col p-8 max-w-6xl mx-auto">
      <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Daily Reflection</h1>
          <p className="text-gray-500 mt-1">Capture your thoughts, ideas, and teaching moments.</p>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Editor Side */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <input 
                    type="date" 
                    value={activeDate}
                    onChange={(e) => setActiveDate(e.target.value)}
                    className="bg-transparent font-medium text-gray-700 outline-none"
                />
                <div className="flex gap-2">
                    {moods.map((m) => {
                        const Icon = m.icon;
                        const isActive = currentEntry.mood === m.label;
                        return (
                            <button
                                key={m.label}
                                onClick={() => handleSave(currentEntry.content, m.label)}
                                className={`p-2 rounded-lg transition-all ${isActive ? 'bg-white shadow-sm ring-1 ring-gray-200 scale-110' : 'hover:bg-gray-100 opacity-60 hover:opacity-100'}`}
                                title={m.label}
                            >
                                <Icon size={20} className={isActive ? m.color : 'text-gray-500'} />
                            </button>
                        )
                    })}
                </div>
            </div>
            <textarea
                className="flex-1 w-full p-6 resize-none outline-none text-gray-700 text-lg leading-relaxed placeholder-gray-300"
                placeholder="Write your thoughts here... How was the class today? What video ideas do you have?"
                value={currentEntry.content}
                onChange={(e) => handleSave(e.target.value, currentEntry.mood)}
            />
        </div>

        {/* Preview Side */}
        <div className="w-1/3 bg-gray-50 rounded-2xl border border-gray-200 p-6 overflow-y-auto flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <BookOpen size={14} /> Preview
            </div>
            {currentEntry.content ? (
                <article className="prose prose-sm prose-slate max-w-none">
                    <div className="mb-4 pb-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800 m-0">
                            {new Date(activeDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h2>
                        <span className="inline-flex items-center gap-1 mt-2 text-sm text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                           Mood: {currentEntry.mood}
                        </span>
                    </div>
                    <div className="whitespace-pre-wrap font-serif text-gray-700 leading-7">
                        {currentEntry.content}
                    </div>
                </article>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <BookOpen size={48} className="mb-4 opacity-20" />
                    <p className="text-center text-sm">Start writing to see the preview.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Journal;