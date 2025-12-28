import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus, X, PanelRightClose, PanelRightOpen, Trash2, ListTodo, CheckSquare, Square, StickyNote, CheckCircle2, Palette, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { CalendarEvent, ContentProject, JournalEntry, ProjectLog, DailyTodo, MoodPreset } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  projects: ContentProject[];
  journalEntries: JournalEntry[];
  projectLogs: ProjectLog[];
  dailyTodos: DailyTodo[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  setProjectLogs: React.Dispatch<React.SetStateAction<ProjectLog[]>>;
  setDailyTodos: React.Dispatch<React.SetStateAction<DailyTodo[]>>;
}

interface TagPreset {
    id: string;
    name: string;
    color: string;
}

const DEFAULT_TAG_PRESETS: TagPreset[] = [
    { id: '1', name: 'Work', color: '#3B82F6' },
    { id: '2', name: 'Personal', color: '#10B981' },
    { id: '3', name: 'Deep Work', color: '#8B5CF6' },
    { id: '4', name: 'Meeting', color: '#F59E0B' },
    { id: '5', name: 'Deadline', color: '#EF4444' },
];

const DEFAULT_MOOD_PRESETS: MoodPreset[] = [
    { id: '1', label: 'Happy', emoji: '😊', color: '#FCD34D' }, // Yellow-400
    { id: '2', label: 'Calm', emoji: '😌', color: '#60A5FA' }, // Blue-400
    { id: '3', label: 'Sad', emoji: '😢', color: '#9CA3AF' }, // Gray-400
    { id: '4', label: 'Angry', emoji: '😡', color: '#F87171' }, // Red-400
    { id: '5', label: 'Productive', emoji: '🚀', color: '#34D399' }, // Green-400
];

const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CalendarView: React.FC<CalendarViewProps> = ({ 
    events, projects, journalEntries, dailyTodos,
    setEvents, setJournalEntries, setDailyTodos
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);
  
  // Tag Presets State
  const [tagPresets, setTagPresets] = useState<TagPreset[]>(() => {
      const saved = localStorage.getItem('cs_tag_presets');
      return saved ? JSON.parse(saved) : DEFAULT_TAG_PRESETS;
  });

  // Mood Presets State
  const [moodPresets, setMoodPresets] = useState<MoodPreset[]>(() => {
      const saved = localStorage.getItem('cs_mood_presets');
      return saved ? JSON.parse(saved) : DEFAULT_MOOD_PRESETS;
  });

  useEffect(() => {
      localStorage.setItem('cs_tag_presets', JSON.stringify(tagPresets));
  }, [tagPresets]);

  useEffect(() => {
      localStorage.setItem('cs_mood_presets', JSON.stringify(moodPresets));
  }, [moodPresets]);
  
  // Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // New Preset Creation State in Modal
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetColor, setNewPresetColor] = useState('#3B82F6');

  // Mood Management State
  const [isManagingMoods, setIsManagingMoods] = useState(false);
  const [editingMoodId, setEditingMoodId] = useState<string | null>(null);
  const [newMoodLabel, setNewMoodLabel] = useState('');
  const [newMoodEmoji, setNewMoodEmoji] = useState('😐');
  const [newMoodColor, setNewMoodColor] = useState('#9CA3AF');

  const [todoInput, setTodoInput] = useState('');

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const days = [];
  const totalDays = daysInMonth(currentDate);
  const startPadding = firstDayOfMonth(currentDate);
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  // Data for selected day
  const dayEvents = events.filter(e => e.date === selectedDate).sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''));
  const dayTodos = dailyTodos.filter(t => t.date === selectedDate);
  const dayJournal = journalEntries.find(j => j.date === selectedDate) || {
    id: 'temp', date: selectedDate, mood: '', moodColor: '', content: '', lastUpdated: 0
  };

  const getMoodEmoji = (label: string) => {
      return moodPresets.find(m => m.label === label)?.emoji || '';
  }

  // --- Smart Time Parsing ---
  const parseSmartTime = (val: string): string => {
      const v = val.trim().toLowerCase();
      if (!v) return '';

      // 1. Simple Number (e.g. "20", "9", "2")
      if (/^\d{1,2}$/.test(v)) {
          const num = parseInt(v);
          if (num >= 0 && num < 24) {
              return `${num.toString().padStart(2, '0')}:00`;
          }
      }

      // 2. 4 Digits (e.g. "2000", "0930")
      if (/^\d{4}$/.test(v)) {
          const h = v.substring(0,2);
          const m = v.substring(2);
          if (parseInt(h) < 24 && parseInt(m) < 60) {
            return `${h}:${m}`;
          }
      }

      // 3. PM handling (e.g. "8pm", "8p")
      if (v.includes('p')) {
          const num = parseInt(v.replace(/[^0-9]/g, ''));
          if (!isNaN(num)) {
             if (num < 12) return `${(num + 12).toString().padStart(2, '0')}:00`;
             if (num === 12) return `12:00`; 
          }
      }

       // 4. AM handling (e.g. "9am")
       if (v.includes('a')) {
        const num = parseInt(v.replace(/[^0-9]/g, ''));
        if (!isNaN(num)) {
            if (num === 12) return `00:00`;
            if (num < 12) return `${num.toString().padStart(2, '0')}:00`;
        }
      }

      // Fallback: Let the browser try to handle it or return as is if valid HH:mm
      if (/^\d{2}:\d{2}$/.test(v)) return v;

      return v;
  }

  const openCreateModal = (startTime?: string) => {
      setEditingEventId(null);
      setEventTitle('');
      setEventStart(startTime || '');
      setEventEnd('');
      setSelectedPresetId(null);
      setIsCreatingPreset(false);
      setIsEventModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, event: CalendarEvent) => {
      e.stopPropagation();
      setEditingEventId(event.id);
      setEventTitle(event.title);
      setEventStart(event.startTime || '');
      setEventEnd(event.endTime || '');
      
      // Try to find matching preset
      const matchingPreset = tagPresets.find(p => p.name === event.tag && p.color === event.color);
      setSelectedPresetId(matchingPreset ? matchingPreset.id : null);
      
      setIsCreatingPreset(false);
      setIsEventModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!eventTitle.trim()) return;
    
    // Determine Tag and Color from Preset
    let tag = '';
    let color = '#3B82F6'; // Default fallback
    if (selectedPresetId) {
        const preset = tagPresets.find(p => p.id === selectedPresetId);
        if (preset) {
            tag = preset.name;
            color = preset.color;
        }
    }

    if (editingEventId) {
        setEvents(prev => prev.map(ev => ev.id === editingEventId ? {
            ...ev,
            title: eventTitle,
            startTime: eventStart,
            endTime: eventEnd,
            tag: tag,
            color: color
        } : ev));
    } else {
        setEvents(prev => [...prev, {
            id: Date.now().toString(),
            title: eventTitle,
            date: selectedDate,
            startTime: eventStart,
            endTime: eventEnd,
            tag: tag,
            color: color,
            type: 'OTHER' 
        }]);
    }
    setIsEventModalOpen(false);
  };

  const handleDeleteEvent = () => {
      if (editingEventId) {
          setEvents(prev => prev.filter(e => e.id !== editingEventId));
          setIsEventModalOpen(false);
      }
  };

  const handleCreatePreset = () => {
      if (!newPresetName.trim()) return;
      const newPreset: TagPreset = {
          id: Date.now().toString(),
          name: newPresetName,
          color: newPresetColor
      };
      setTagPresets(prev => [...prev, newPreset]);
      setSelectedPresetId(newPreset.id); 
      setIsCreatingPreset(false);
      setNewPresetName('');
      setNewPresetColor('#3B82F6');
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setTagPresets(prev => prev.filter(p => p.id !== id));
      if (selectedPresetId === id) setSelectedPresetId(null);
  };

  // --- Mood Logic ---
  const handleSaveMood = () => {
      if (!newMoodLabel.trim()) return;

      if (editingMoodId) {
          // Update existing
          setMoodPresets(prev => prev.map(m => m.id === editingMoodId ? {
              ...m,
              label: newMoodLabel,
              emoji: newMoodEmoji,
              color: newMoodColor
          } : m));
          setEditingMoodId(null);
      } else {
          // Create new
          setMoodPresets(prev => [...prev, {
            id: Date.now().toString(),
            label: newMoodLabel,
            emoji: newMoodEmoji,
            color: newMoodColor
        }]);
      }
      
      setNewMoodLabel('');
      setNewMoodEmoji('😐');
      setNewMoodColor('#9CA3AF');
      // Keep managing moods open
  };

  const handleEditMood = (mood: MoodPreset) => {
      setNewMoodLabel(mood.label);
      setNewMoodEmoji(mood.emoji);
      setNewMoodColor(mood.color);
      setEditingMoodId(mood.id);
  };

  const handleDeleteMood = (id: string) => {
      if (confirm('Delete this mood?')) {
          setMoodPresets(prev => prev.filter(m => m.id !== id));
          if (editingMoodId === id) {
              setEditingMoodId(null);
              setNewMoodLabel('');
              setNewMoodEmoji('😐');
          }
      }
  };

  const handleJournalSave = (content: string, moodLabel: string) => {
    const selectedMood = moodPresets.find(m => m.label === moodLabel);
    const color = selectedMood ? selectedMood.color : '#e5e7eb';

    setJournalEntries(prev => {
        const existing = prev.find(e => e.date === selectedDate);
        if (existing) {
            return prev.map(e => e.date === selectedDate ? { ...e, content, mood: moodLabel, moodColor: color, lastUpdated: Date.now() } : e);
        } else {
            return [...prev, { id: Date.now().toString(), date: selectedDate, mood: moodLabel, moodColor: color, content, lastUpdated: Date.now() }];
        }
    });
  };

  const handleAddTodo = () => {
      if(!todoInput.trim()) return;
      setDailyTodos(prev => [...prev, {
          id: Date.now().toString(),
          date: selectedDate,
          text: todoInput,
          completed: false
      }]);
      setTodoInput('');
  };

  const toggleTodo = (id: string) => {
      setDailyTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
      setDailyTodos(prev => prev.filter(t => t.id !== id));
  };

  // Helper to get ALL content for a day
  const getDayContent = (day: number) => {
    if (!day) return { events: [], tasks: [], todos: [], journal: null };
    const currentDayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // 1. Calendar Events
    const daysEvents = events.filter(e => e.date === currentDayStr);

    // 2. Project Subtasks (Span Logic)
    const daysTasks: Array<{id: string, title: string, projectTitle: string, color: string, isCompleted: boolean}> = [];
    projects.forEach(p => {
        p.subTasks.forEach(t => {
            // Check if currentDayStr is within start and end date
            const start = t.startDate;
            const end = t.endDate || t.startDate;
            if (currentDayStr >= start && currentDayStr <= end) {
                 daysTasks.push({
                    id: t.id,
                    title: t.title,
                    projectTitle: p.title,
                    color: p.color,
                    isCompleted: t.isCompleted
                });
            }
        });
    });

    // 3. Todos
    const daysTodos = dailyTodos.filter(t => t.date === currentDayStr);

    // 4. Journal
    const journal = journalEntries.find(j => j.date === currentDayStr);

    return { events: daysEvents, tasks: daysTasks, todos: daysTodos, journal };
  };

  // Generate 24 hours for timeline
  const hours = Array.from({ length: 25 }, (_, i) => i); // 0 to 24

  return (
    <div className="flex h-full relative overflow-hidden bg-white/40 dark:bg-[#0A0A0A]/60 backdrop-blur-3xl rounded-3xl shadow-xl border border-white/20 dark:border-white/5 text-gray-900 dark:text-gray-100">
        
        {/* Event Modal */}
        {isEventModalOpen && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-6 w-80 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{editingEventId ? 'Edit Event' : 'New Event'}</h3>
                        <button onClick={() => setIsEventModalOpen(false)}><X size={20} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"/></button>
                    </div>
                    
                    <div className="mb-5">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Title</label>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="e.g. Editing Sprint"
                            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div>
                             <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Start</label>
                             <div className="relative">
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-2 py-2 text-sm outline-none dark:text-white placeholder-gray-400" 
                                    value={eventStart} 
                                    placeholder="20:00 or 8pm"
                                    onChange={(e) => setEventStart(e.target.value)} 
                                    onBlur={(e) => setEventStart(parseSmartTime(e.target.value))}
                                />
                                <Clock size={14} className="absolute left-2.5 top-2.5 text-gray-400"/>
                             </div>
                        </div>
                        <div>
                             <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-bold uppercase tracking-wider">End</label>
                             <div className="relative">
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-2 py-2 text-sm outline-none dark:text-white placeholder-gray-400" 
                                    value={eventEnd} 
                                    placeholder="22:00 or 10pm"
                                    onChange={(e) => setEventEnd(e.target.value)} 
                                    onBlur={(e) => setEventEnd(parseSmartTime(e.target.value))}
                                />
                                <Clock size={14} className="absolute left-2.5 top-2.5 text-gray-400"/>
                             </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase tracking-wider flex justify-between">
                            <span>Category (Tag + Color)</span>
                            {!isCreatingPreset && (
                                <button onClick={() => setIsCreatingPreset(true)} className="text-blue-500 hover:text-blue-400 flex items-center gap-1">
                                    <Plus size={12}/> New
                                </button>
                            )}
                        </label>

                        {isCreatingPreset ? (
                            <div className="bg-gray-50 dark:bg-black/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                                <input 
                                    autoFocus
                                    className="w-full bg-transparent text-sm font-bold border-b border-gray-300 dark:border-gray-600 mb-3 px-1 py-1 outline-none dark:text-white"
                                    placeholder="Category Name"
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                />
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs text-gray-400 uppercase font-bold">Color</span>
                                    {/* CUSTOM COLOR PICKER */}
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="relative w-6 h-6 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                                            <input 
                                                type="color" 
                                                value={newPresetColor}
                                                onChange={(e) => setNewPresetColor(e.target.value)}
                                                className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-none"
                                            />
                                        </div>
                                        <input 
                                            type="text"
                                            value={newPresetColor}
                                            onChange={(e) => setNewPresetColor(e.target.value)}
                                            className="w-20 bg-transparent text-xs font-mono uppercase border-none outline-none text-gray-600 dark:text-gray-300"
                                            maxLength={7}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsCreatingPreset(false)} className="flex-1 py-1 text-xs font-bold text-gray-500">Cancel</button>
                                    <button onClick={handleCreatePreset} className="flex-1 py-1 text-xs font-bold bg-blue-500 text-white rounded-lg">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {tagPresets.map(preset => {
                                    const isSelected = selectedPresetId === preset.id;
                                    return (
                                        <div 
                                            key={preset.id}
                                            onClick={() => setSelectedPresetId(isSelected ? null : preset.id)}
                                            className={`
                                                relative group cursor-pointer px-3 py-1.5 rounded-full border transition-all flex items-center gap-2
                                                ${isSelected 
                                                    ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 ring-1 ring-blue-500 dark:text-blue-200' 
                                                    : 'bg-white dark:bg-black/30 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:text-gray-300'}
                                            `}
                                        >
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.color }} />
                                            <span className="text-xs font-bold">{preset.name}</span>
                                            
                                            {/* Delete Preset */}
                                            <button 
                                                onClick={(e) => handleDeletePreset(preset.id, e)}
                                                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                            >
                                                <X size={8} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {tagPresets.length === 0 && <span className="text-xs text-gray-400 italic">No categories. Create one!</span>}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mt-8">
                         {editingEventId && (
                            <button onClick={handleDeleteEvent} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                                <Trash2 size={18} />
                            </button>
                         )}
                        <button onClick={handleSaveEvent} className="flex-1 bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl hover:opacity-80 transition-opacity">
                            {editingEventId ? 'Save Changes' : 'Create Event'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col p-6 min-w-0">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {monthNames[currentDate.getMonth()]} <span className="text-gray-400 dark:text-gray-500 font-medium">{currentDate.getFullYear()}</span>
                    </h2>
                </div>
                <div className="flex items-center gap-1 bg-white/50 dark:bg-white/5 p-1 rounded-xl border border-white/20 dark:border-white/5">
                     <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors text-gray-600 dark:text-gray-300">
                        <ChevronLeft size={18} />
                     </button>
                     <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors text-gray-600 dark:text-gray-300">
                        Today
                     </button>
                     <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors text-gray-600 dark:text-gray-300">
                        <ChevronRight size={18} />
                     </button>
                </div>
            </div>

            {/* Calendar Grid - Liquid Style */}
            <div className="grid grid-cols-7 mb-2">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <div key={day} className="text-left pl-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase">{day}</div>
                ))}
            </div>
            {/* Grid Container */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-2xl overflow-hidden shadow-inner border border-white/20 dark:border-white/5">
                {days.map((day, i) => {
                    // Empty cells
                    if (day === null) return <div key={`empty-${i}`} className="bg-white/10 dark:bg-white/[0.02] border-r border-b border-gray-100/10 dark:border-white/5"></div>;
                    
                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = selectedDate === dateStr;
                    const isToday = dateStr === todayStr;
                    const { events: cEvents, tasks: cTasks, todos: cTodos, journal: cJournal } = getDayContent(day);

                    // Cell Background Style based on Mood
                    const cellStyle = cJournal && cJournal.moodColor 
                        ? { backgroundColor: `${cJournal.moodColor}40` } // 40% opacity for better visibility
                        : {};

                    return (
                        <div 
                            key={day} 
                            onClick={() => setSelectedDate(dateStr)}
                            className={`
                                relative p-2 flex flex-col gap-1 overflow-y-auto no-scrollbar group transition-all duration-300
                                border-r border-b border-gray-100 dark:border-white/5
                                ${isSelected 
                                    ? 'shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] ring-inset ring-1 ring-blue-500/20' 
                                    : 'hover:bg-white/40 dark:hover:bg-white/5'}
                            `}
                            style={cellStyle}
                        >
                            <div className="flex justify-between items-start mb-0.5">
                                <div className="flex items-center gap-1">
                                    <span className={`
                                        text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full
                                        ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-gray-600 dark:text-gray-400'}
                                    `}>
                                        {day}
                                    </span>
                                    {/* Mood Emoji directly next to date */}
                                    {cJournal && cJournal.mood && (
                                        <span className="text-sm" title={cJournal.mood}>{getMoodEmoji(cJournal.mood)}</span>
                                    )}
                                </div>
                            </div>
                            
                            {/* 1. Schedule Events Chips */}
                            {cEvents.map(ev => (
                                <div 
                                    key={ev.id}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-medium truncate flex items-center gap-1 hover:opacity-100 transition-opacity"
                                    style={{ 
                                        backgroundColor: `${ev.color}25`, // 25% opacity hex
                                        color: ev.color,
                                    }}
                                >
                                    <div className="w-1 h-1 rounded-full shrink-0" style={{backgroundColor: ev.color}}></div>
                                    <span className="truncate">{ev.title}</span>
                                </div>
                            ))}

                            {/* 2. Project Task Chips (Span Logic) */}
                            {cTasks.map(task => (
                                <div 
                                    key={task.id}
                                    className="px-1.5 py-0.5 rounded text-left hover:brightness-110 transition-all cursor-pointer"
                                    style={{ 
                                        backgroundColor: `${task.color}20`, // Use Task Color for Background (Tint)
                                        color: task.color // Use Task Color for Text
                                        // borderColor: task.color,
                                        // borderLeftWidth: '2px'
                                    }}
                                >
                                    <span className={`block text-[9px] font-bold leading-tight truncate ${task.isCompleted ? 'line-through opacity-50' : ''}`}>
                                        {task.title}
                                    </span>
                                </div>
                            ))}

                            {/* 3. Daily Todos */}
                            {cTodos.length > 0 && (
                                <div className="mt-auto pt-1 flex flex-col gap-1">
                                    {cTodos.slice(0, 2).map(todo => (
                                        <div key={todo.id} className="flex items-center gap-1.5 text-[8px] text-gray-500 dark:text-gray-400">
                                            {todo.completed ? <CheckSquare size={8} className="text-gray-400"/> : <Square size={8} />}
                                            <span className={`truncate ${todo.completed ? 'line-through opacity-50' : ''}`}>{todo.text}</span>
                                        </div>
                                    ))}
                                    {cTodos.length > 2 && <span className="text-[8px] text-gray-400 pl-4">+{cTodos.length - 2} more</span>}
                                </div>
                            )}

                            {/* 4. Journal Entry Indicator (Simplified as emoji is now at top) */}
                            {cJournal && cJournal.content && (
                                <div className="mt-1 px-1 opacity-50 text-[8px] truncate dark:text-gray-300">
                                    {cJournal.content}
                                </div>
                            )}
                            
                            {/* Hover Add Button (Subtle) */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedDate(dateStr); openCreateModal(); }}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white/50 dark:bg-white/10 rounded-full hover:bg-blue-500 hover:text-white transition-all text-gray-400"
                            >
                                <Plus size={10} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Right Sidebar Toggle */}
        {!isSidebarOpen && (
             <div className="absolute right-6 top-6 z-10">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 shadow-md rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    <PanelRightOpen size={20} />
                </button>
             </div>
        )}

        {/* Detail Sidebar */}
        {isSidebarOpen && (
            <div className="w-80 border-l border-white/20 dark:border-white/5 bg-white/50 dark:bg-black/40 backdrop-blur-xl flex flex-col transition-all duration-300">
                {/* Header */}
                <div className="p-6 pb-2 flex justify-between items-center">
                    <div>
                        <h3 className="text-3xl font-bold leading-none text-gray-900 dark:text-white">{new Date(selectedDate).getDate()}</h3>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider mt-1">
                            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long' })}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => openCreateModal()} className="px-3 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/20 transition-colors dark:text-gray-200">
                            New Event
                        </button>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><PanelRightClose size={20}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    
                    {/* Timeline Section (00:00 - 24:00) */}
                    <div>
                         <button 
                            onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                            className="w-full flex justify-between items-center mb-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-gray-600 dark:hover:text-gray-300"
                         >
                            <div className="flex items-center gap-2"><Clock size={12}/> Timeline</div>
                            {isTimelineOpen ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                         </button>
                         
                         {isTimelineOpen && (
                             <div className="relative pl-4 border-l border-gray-200 dark:border-gray-800 space-y-0">
                                 {hours.map(hour => { 
                                     const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                                     const hourEvents = dayEvents.filter(ev => {
                                         if(!ev.startTime) return false;
                                         const evHour = parseInt(ev.startTime.split(':')[0]);
                                         return evHour === hour;
                                     });
                                     
                                     // AM/PM Divider
                                     const isAmPmSplit = hour === 12;

                                     return (
                                         <React.Fragment key={hour}>
                                             {isAmPmSplit && <div className="text-[10px] font-bold text-gray-300 dark:text-gray-600 pl-4 py-2">PM STARTS</div>}
                                             
                                             <div className="min-h-[40px] relative group pl-4 py-2 border-b border-gray-100/50 dark:border-white/5">
                                                {/* Time Label */}
                                                <span className="absolute -left-[42px] top-2 text-[10px] text-gray-400 font-mono w-8 text-right">
                                                    {hour === 0 ? 'MID' : (hour === 12 ? 'NOON' : hourStr)}
                                                </span>
                                                
                                                {/* Dot on line */}
                                                <div className="absolute -left-[5px] top-3.5 w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-black group-hover:bg-blue-500 transition-colors"></div>
                                                
                                                {/* Events or Add Button */}
                                                {hourEvents.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {hourEvents.map(ev => (
                                                            <div 
                                                                key={ev.id} 
                                                                onClick={(e) => openEditModal(e, ev)}
                                                                className="bg-white dark:bg-[#1A1A1A] p-2 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:border-blue-500/50 transition-all"
                                                            >
                                                                <div className="font-bold text-xs text-gray-900 dark:text-gray-100">{ev.title}</div>
                                                                <div className="flex justify-between items-center mt-1">
                                                                    <span className="text-[10px] text-gray-400 font-mono">{ev.startTime} - {ev.endTime}</span>
                                                                    {ev.tag && (
                                                                        <span className="text-[9px] font-bold px-1 rounded uppercase" style={{ backgroundColor: `${ev.color}20`, color: ev.color }}>{ev.tag}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    // Empty Slot Click to Add
                                                    <div 
                                                        onClick={() => openCreateModal(hourStr)}
                                                        className="h-full w-full absolute inset-0 opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
                                                    >
                                                        <div className="w-full h-full bg-blue-50/50 dark:bg-blue-900/10 rounded-lg flex items-center justify-center text-blue-500 text-xs font-bold">
                                                            <Plus size={12} className="mr-1"/> Add
                                                        </div>
                                                    </div>
                                                )}
                                             </div>
                                         </React.Fragment>
                                     );
                                 })}
                             </div>
                         )}
                    </div>

                    {/* Daily Checklist Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                <ListTodo size={12}/> Daily Checklist
                            </div>
                        </div>

                        <div className="space-y-2">
                             {dayTodos.length === 0 && <div className="text-sm text-gray-400 italic">Nothing on the list yet.</div>}
                             
                             {dayTodos.map(todo => (
                                <div key={todo.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                                    <button onClick={() => toggleTodo(todo.id)} className={`transition-colors ${todo.completed ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300 hover:text-blue-500'}`}>
                                        {todo.completed ? <CheckCircle2 size={18} /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-current" />}
                                    </button>
                                    <span className={`text-sm flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                        {todo.text}
                                    </span>
                                    <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                                        <X size={14}/>
                                    </button>
                                </div>
                             ))}

                             {/* Quick Add */}
                             <div className="flex items-center gap-3 p-2 mt-2 opacity-60 hover:opacity-100 transition-opacity">
                                <Plus size={18} className="text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Add a quick task..." 
                                    className="bg-transparent w-full text-sm outline-none text-gray-700 dark:text-gray-300 placeholder-gray-500"
                                    value={todoInput}
                                    onChange={(e) => setTodoInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                                />
                             </div>
                        </div>
                    </div>

                    {/* Enhanced Daily Note Section */}
                    <div>
                         <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                <StickyNote size={12}/> Daily Note
                            </div>
                            <button onClick={() => setIsManagingMoods(!isManagingMoods)} className="text-[10px] text-blue-500 hover:underline font-bold">
                                {isManagingMoods ? 'Done' : 'Edit Moods'}
                            </button>
                         </div>

                         {isManagingMoods ? (
                             <div className="bg-white/50 dark:bg-black/40 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 mb-4 animate-in fade-in slide-in-from-top-2">
                                 <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                                     {moodPresets.map(mood => (
                                         <div key={mood.id} className="flex items-center justify-between p-2 bg-white dark:bg-black/50 rounded-lg group">
                                             <div className="flex items-center gap-2">
                                                 <span className="text-lg">{mood.emoji}</span>
                                                 <span className="text-xs font-bold dark:text-gray-200">{mood.label}</span>
                                                 <div className="w-2 h-2 rounded-full" style={{backgroundColor: mood.color}}></div>
                                             </div>
                                             <div className="flex gap-2">
                                                <button onClick={() => handleEditMood(mood)} className="text-gray-400 hover:text-blue-500"><Edit3 size={14}/></button>
                                                <button onClick={() => handleDeleteMood(mood.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                                 <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                     <div className="flex gap-2 mb-2">
                                         <input 
                                            className="w-8 p-1 text-center bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none" 
                                            value={newMoodEmoji} 
                                            onChange={(e) => setNewMoodEmoji(e.target.value)} 
                                            maxLength={2}
                                         />
                                         <input 
                                            className="flex-1 text-xs bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white" 
                                            placeholder="Label (e.g. Excited)" 
                                            value={newMoodLabel}
                                            onChange={(e) => setNewMoodLabel(e.target.value)}
                                         />
                                          <input 
                                            type="color"
                                            className="w-6 h-6 rounded-full overflow-hidden cursor-pointer"
                                            value={newMoodColor}
                                            onChange={(e) => setNewMoodColor(e.target.value)}
                                          />
                                     </div>
                                     <button onClick={handleSaveMood} className="w-full py-1 bg-blue-500 text-white rounded-lg text-xs font-bold">
                                         {editingMoodId ? 'Update Mood' : 'Add Mood'}
                                     </button>
                                 </div>
                             </div>
                         ) : (
                            <div 
                                className="p-1 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group transition-colors duration-500"
                                style={{ 
                                    backgroundColor: dayJournal.moodColor ? `${dayJournal.moodColor}15` : 'transparent', // 15% opacity background based on mood
                                }}
                            >
                                {/* Mood Selector Header - Fixed Layout */}
                                <div className="flex flex-col items-center px-4 py-3 border-b border-gray-100/50 dark:border-gray-800/50">
                                    <div className="flex flex-wrap gap-2 justify-center w-full">
                                        {moodPresets.map(m => {
                                            const isActive = dayJournal.mood === m.label;
                                            return (
                                                <button 
                                                    key={m.id}
                                                    onClick={() => handleJournalSave(dayJournal.content, m.label)}
                                                    className={`
                                                        w-8 h-8 rounded-full flex items-center justify-center transition-all text-lg mb-1
                                                        ${isActive ? 'bg-white shadow-md scale-110 ring-2 ring-white/50' : 'opacity-60 hover:opacity-100 hover:bg-white/30'}
                                                    `}
                                                    title={m.label}
                                                >
                                                    {m.emoji}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <textarea 
                                    placeholder="Thoughts for the day..."
                                    className="w-full h-40 bg-transparent p-4 text-sm leading-relaxed text-gray-800 dark:text-gray-200 resize-none outline-none font-serif placeholder-gray-400/50"
                                    value={dayJournal.content}
                                    onChange={(e) => handleJournalSave(e.target.value, dayJournal.mood)}
                                />
                                
                                <div className="absolute bottom-3 right-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-20 group-hover:opacity-50 transition-opacity">
                                    {dayJournal.mood || 'Reflection'}
                                </div>
                            </div>
                         )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CalendarView;