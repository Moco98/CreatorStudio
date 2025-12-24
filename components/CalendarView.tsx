import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Smile, Sun, Meh, CloudRain, Frown, BookOpen, Clock, Activity, Plus, X, PanelRightClose, PanelRightOpen, Tag, Trash2, Edit3, StickyNote, Circle, CheckSquare, Square, ListTodo, Moon } from 'lucide-react';
import { CalendarEvent, ContentProject, JournalEntry, ProjectLog, DailyTodo } from '../types';

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

const moods = [
    { label: 'Happy', icon: Smile, color: 'text-green-600', bg: 'bg-green-100/90 dark:bg-green-900/60 border-green-200 dark:border-green-800', text: 'text-green-900 dark:text-green-100', emoji: '😊' },
    { label: 'Productive', icon: Sun, color: 'text-yellow-600', bg: 'bg-yellow-100/90 dark:bg-yellow-900/60 border-yellow-200 dark:border-yellow-800', text: 'text-yellow-900 dark:text-yellow-100', emoji: '🌟' },
    { label: 'Neutral', icon: Meh, color: 'text-blue-600', bg: 'bg-blue-100/90 dark:bg-blue-900/60 border-blue-200 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-100', emoji: '😐' },
    { label: 'Stressed', icon: CloudRain, color: 'text-gray-600', bg: 'bg-gray-100/90 dark:bg-gray-700/80 border-gray-200 dark:border-gray-600', text: 'text-gray-900 dark:text-gray-100', emoji: '🌧️' },
    { label: 'Tired', icon: Frown, color: 'text-indigo-600', bg: 'bg-indigo-100/90 dark:bg-indigo-900/60 border-indigo-200 dark:border-indigo-800', text: 'text-indigo-900 dark:text-indigo-100', emoji: '😴' },
    // New "Doing Nothing" mood
    { label: 'Nothing', icon: Circle, color: 'text-gray-400', bg: 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700', text: 'text-gray-500 dark:text-gray-400', emoji: '⚪' },
];

const PRESET_EVENT_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B', '#000000'
];

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CalendarView: React.FC<CalendarViewProps> = ({ 
    events, projects, journalEntries, projectLogs, dailyTodos,
    setEvents, setJournalEntries, setProjectLogs, setDailyTodos
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Use local date for "Today"
  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Modal State for adding/editing Event
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventTag, setEventTag] = useState('');
  const [eventColor, setEventColor] = useState(PRESET_EVENT_COLORS[0]);

  // Todo Input State
  const [todoInput, setTodoInput] = useState('');

  // Calendar Helpers
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const days = [];
  const totalDays = daysInMonth(currentDate);
  const startPadding = firstDayOfMonth(currentDate);
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  // Data Getters for Selected Date
  const dayEvents = events.filter(e => e.date === selectedDate).sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''));
  const dayLogs = projectLogs.filter(l => l.date === selectedDate);
  const dayTodos = dailyTodos.filter(t => t.date === selectedDate);
  const dayJournal = journalEntries.find(j => j.date === selectedDate) || {
    id: 'temp', date: selectedDate, mood: 'Neutral', content: '', lastUpdated: 0
  };

  const openCreateModal = () => {
      setEditingEventId(null);
      setEventTitle('');
      setEventStart('');
      setEventEnd('');
      setEventTag('');
      setEventColor(PRESET_EVENT_COLORS[0]);
      setIsEventModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, event: CalendarEvent) => {
      e.stopPropagation();
      setEditingEventId(event.id);
      setEventTitle(event.title);
      setEventStart(event.startTime || '');
      setEventEnd(event.endTime || '');
      setEventTag(event.tag || '');
      setEventColor(event.color || PRESET_EVENT_COLORS[0]);
      setIsEventModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!eventTitle.trim()) return;
    
    if (editingEventId) {
        // Update
        setEvents(prev => prev.map(ev => ev.id === editingEventId ? {
            ...ev,
            title: eventTitle,
            startTime: eventStart,
            endTime: eventEnd,
            tag: eventTag,
            color: eventColor
        } : ev));
    } else {
        // Create
        setEvents(prev => [...prev, {
            id: Date.now().toString(),
            title: eventTitle,
            date: selectedDate,
            startTime: eventStart,
            endTime: eventEnd,
            tag: eventTag,
            color: eventColor,
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

  const handleJournalSave = (content: string, mood: string) => {
    setJournalEntries(prev => {
        const existing = prev.find(e => e.date === selectedDate);
        if (existing) {
            return prev.map(e => e.date === selectedDate ? { ...e, content, mood, lastUpdated: Date.now() } : e);
        } else {
            return [...prev, { id: Date.now().toString(), date: selectedDate, mood, content, lastUpdated: Date.now() }];
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

  // --- Task Duration Logic (Activity Driven) ---
  const getTaskBarsForDay = (day: number) => {
    if (!day) return [];
    const currentDayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const bars: Array<{
        id: string; 
        projectId: string;
        projectName: string;
        taskName: string;
        color: string;
        isStart: boolean;
        isEnd: boolean;
    }> = [];

    projects.forEach(project => {
        project.subTasks.forEach(task => {
            const taskLogs = projectLogs.filter(l => l.subTaskId === task.id && l.projectId === project.id);
            const logDates = taskLogs.map(l => l.date);
            const allDates = [task.startDate, ...logDates].sort();
            
            const start = allDates[0];
            const end = allDates[allDates.length - 1];

            if (currentDayStr >= start && currentDayStr <= end) {
                bars.push({
                    id: task.id,
                    projectId: project.id,
                    projectName: project.title,
                    taskName: task.title,
                    color: project.color,
                    isStart: currentDayStr === start,
                    isEnd: currentDayStr === end
                });
            }
        });
    });
    return bars;
  };

  const getJournalForDay = (day: number) => {
      if(!day) return null;
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return journalEntries.find(e => e.date === dateStr);
  };
  
  const getTodosForDay = (day: number) => {
      if(!day) return [];
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return dailyTodos.filter(t => t.date === dateStr);
  };

  return (
    <div className="flex h-full relative overflow-hidden bg-transparent text-gray-900 dark:text-gray-100">
        
        {/* Event Modal (Glassmorphism) */}
        {isEventModalOpen && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl shadow-2xl p-6 w-80 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">{editingEventId ? 'Edit Event' : 'New Event'}</h3>
                        <button onClick={() => setIsEventModalOpen(false)}><X size={20} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"/></button>
                    </div>
                    
                    <div className="mb-5">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Title</label>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="e.g. Editing Sprint"
                            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-white"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 mb-5">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Start</label>
                            <input 
                                type="time" 
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                                value={eventStart}
                                onChange={(e) => setEventStart(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-bold uppercase tracking-wider">End</label>
                            <input 
                                type="time" 
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                                value={eventEnd}
                                onChange={(e) => setEventEnd(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                         <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase tracking-wider">Appearance</label>
                         <div className="flex gap-2 mb-3">
                             <div className="relative flex-1">
                                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input 
                                    type="text"
                                    placeholder="Tag name"
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                                    value={eventTag}
                                    onChange={(e) => setEventTag(e.target.value)}
                                />
                             </div>
                             <div className="relative w-12 h-10 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                                <input 
                                    type="color" 
                                    value={eventColor}
                                    onChange={(e) => setEventColor(e.target.value)}
                                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0"
                                />
                             </div>
                         </div>
                    </div>

                    <div className="flex gap-2">
                        {editingEventId && (
                             <button onClick={handleDeleteEvent} className="px-4 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                                <Trash2 size={18} />
                             </button>
                        )}
                        <button onClick={handleSaveEvent} className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-xl font-bold hover:opacity-80 shadow-lg shadow-blue-500/20 transition-all">
                            {editingEventId ? 'Save Changes' : 'Create Event'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Left: Calendar Grid */}
        <div className="flex-1 p-6 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">Calendar</h1>
                    <div className="flex items-center gap-1 bg-white/40 dark:bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/40 dark:border-white/10 shadow-sm">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
                        <span className="w-32 text-center text-sm font-bold opacity-80">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"><ChevronRight size={16} /></button>
                    </div>
                </div>
                {!isSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-3 bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-xl shadow-sm hover:bg-white/60 dark:hover:bg-white/20 transition-colors"
                    >
                        <PanelRightOpen size={20} />
                    </button>
                )}
            </header>

            <div className="flex-1 flex flex-col bg-white/40 dark:bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-white/50 dark:border-white/10 shadow-2xl overflow-hidden relative">
                <div className="grid grid-cols-7 border-b border-gray-100/30 dark:border-white/5 bg-white/20 dark:bg-white/5">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-4 text-center text-xs font-bold opacity-50 uppercase tracking-widest">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 grid-rows-5 flex-1 overflow-hidden">
                    {days.map((day, i) => {
                        if (day === null) return <div key={`empty-${i}`} className="bg-gray-50/10 dark:bg-white/5 border-b border-r border-gray-100/30 dark:border-white/5"/>;
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isSelected = selectedDate === dateStr;
                        const isToday = dateStr === todayStr;
                        
                        const daySpecificEvents = events.filter(e => e.date === dateStr);
                        const taskBars = getTaskBarsForDay(day);
                        const cellTodos = getTodosForDay(day);
                        const journalEntry = getJournalForDay(day);
                        const moodObj = journalEntry ? moods.find(m => m.label === journalEntry.mood) : null;
                        const hasNote = journalEntry && journalEntry.content;

                        return (
                            <div 
                                key={day} 
                                onClick={() => { setSelectedDate(dateStr); if(!isSidebarOpen) setIsSidebarOpen(true); }}
                                className={`border-b border-r border-gray-100/30 dark:border-white/5 p-1.5 relative cursor-pointer transition-all duration-200 group flex flex-col
                                    ${isSelected ? 'bg-white/40 dark:bg-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]' : 'hover:bg-white/20 dark:hover:bg-white/5'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1.5 px-1">
                                    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-105' : isSelected ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-900/30' : 'opacity-70'}`}>
                                        {day}
                                    </span>
                                    {/* Add Button */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedDate(dateStr); openCreateModal(); }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all transform hover:scale-110 p-1"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>

                                {/* Content Container */}
                                <div className="flex-1 flex flex-col gap-1 overflow-hidden relative">
                                    {/* Task Bars (2 Lines) */}
                                    {taskBars.map(p => (
                                        <div 
                                            key={p.id} 
                                            className={`h-9 flex flex-col justify-center px-2 overflow-hidden backdrop-blur-md shadow-sm border border-white/20 dark:border-white/10 transition-all hover:scale-[1.02] hover:z-10
                                                ${p.isStart ? 'rounded-l-xl ml-0.5' : '-ml-2'} 
                                                ${p.isEnd ? 'rounded-r-xl mr-0.5' : '-mr-2'}
                                            `}
                                            style={{ 
                                                backgroundColor: `${p.color}D9`, // 85% opacity hex
                                                color: '#FFF',
                                            }}
                                            title={`${p.projectName} - ${p.taskName}`}
                                        >
                                            {p.isStart && (
                                                <>
                                                    <span className="text-[8px] opacity-90 truncate leading-none mb-0.5">{p.projectName}</span>
                                                    <span className="text-[9px] font-bold truncate leading-tight drop-shadow-sm">{p.taskName}</span>
                                                </>
                                            )}
                                        </div>
                                    ))}

                                    {/* Schedule Events */}
                                    {daySpecificEvents.slice(0, 2).map(e => (
                                        <div 
                                            key={e.id} 
                                            className="mx-0.5 px-2 py-1 rounded-lg text-[10px] truncate border border-white/20 shadow-sm text-white flex items-center gap-1.5 backdrop-blur-md transition-all hover:brightness-110"
                                            style={{ backgroundColor: e.color || '#64748B' }}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/80"></div>
                                            <span className="font-medium opacity-95">{e.title}</span>
                                        </div>
                                    ))}
                                    {daySpecificEvents.length > 2 && <div className="mx-1 text-[9px] opacity-60 pl-1">+{daySpecificEvents.length - 2} more</div>}
                                    
                                    {/* Daily ToDo Preview */}
                                    {cellTodos.length > 0 && (
                                        <div className="mx-0.5 px-1.5 py-1 rounded-lg bg-gray-50/50 dark:bg-white/5 border border-gray-100/50 dark:border-white/5 flex flex-col gap-0.5 mt-0.5">
                                            {cellTodos.slice(0, 2).map(t => (
                                                <div key={t.id} className={`flex items-center gap-1.5 text-[9px] ${t.completed ? 'opacity-40 line-through' : 'opacity-80'}`}>
                                                    <div className={`w-2 h-2 rounded-[2px] border ${t.completed ? 'bg-gray-400 border-transparent' : 'border-gray-400'}`}></div>
                                                    <span className="truncate">{t.text}</span>
                                                </div>
                                            ))}
                                            {cellTodos.length > 2 && <span className="text-[8px] opacity-40">+{cellTodos.length - 2} more</span>}
                                        </div>
                                    )}

                                    {/* Daily Note Sticky */}
                                    {hasNote && (
                                        <div className={`mx-0.5 p-1.5 rounded-lg border shadow-sm flex items-start gap-1.5 overflow-hidden transition-colors duration-300 ${moodObj ? `${moodObj.bg} ${moodObj.text}` : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'}`}>
                                            <span className="text-xs shrink-0">{moodObj?.emoji || '📝'}</span>
                                            <span className="text-[9px] leading-tight truncate opacity-80 pt-0.5">{journalEntry.content}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        {/* Right: Daily Detail Sidebar (Collapsible) */}
        <div className={`bg-white/60 dark:bg-black/60 backdrop-blur-2xl border-l border-white/50 dark:border-white/10 overflow-y-auto flex flex-col h-full shadow-2xl z-20 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isSidebarOpen ? 'w-[420px] translate-x-0 opacity-100' : 'w-0 translate-x-20 opacity-0'}`}>
            <div className="p-8 border-b border-gray-100/20 dark:border-white/5 sticky top-0 bg-inherit z-10 flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {(() => {
                            const [y, m, d] = selectedDate.split('-').map(Number);
                            return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric' });
                        })()}
                    </h2>
                    <p className="opacity-60 text-sm mt-1">{(() => {
                        const [y, m, d] = selectedDate.split('-').map(Number);
                        return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                    })()}</p>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="opacity-50 hover:opacity-100 transition-opacity">
                    <PanelRightClose size={24} />
                </button>
            </div>

            <div className="p-8 space-y-8 min-w-[420px] pb-24"> 
                
                {/* Section 1: Schedule (Editable) */}
                <section>
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xs font-bold opacity-50 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} /> Timeline
                        </h3>
                        <button onClick={openCreateModal} className="text-xs bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/20 shadow-sm font-medium">New Event</button>
                    </div>
                    
                    <div className="relative border-l-2 border-gray-200/30 dark:border-white/10 ml-2.5 space-y-4 py-1">
                        {dayEvents.length === 0 && <p className="text-sm opacity-40 italic pl-6">No events scheduled.</p>}
                        {dayEvents.map(e => (
                            <div 
                                key={e.id} 
                                className="relative pl-6 group cursor-pointer" 
                                onClick={(ev) => openEditModal(ev, e)}
                            >
                                <div 
                                    className="absolute -left-[5px] top-4 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm transition-transform group-hover:scale-125"
                                    style={{ backgroundColor: e.color || '#94a3b8' }}
                                ></div>
                                <div className="bg-white/50 dark:bg-white/5 p-4 rounded-2xl border border-white/40 dark:border-white/5 shadow-sm hover:shadow-md hover:bg-white/80 dark:hover:bg-white/10 transition-all">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-base">{e.title}</span>
                                        <div className="flex items-center gap-2">
                                            {e.tag && (
                                                <span 
                                                    className="text-[10px] px-2 py-0.5 rounded-md text-white font-bold shadow-sm"
                                                    style={{ backgroundColor: e.color || '#94a3b8' }}
                                                >
                                                    {e.tag}
                                                </span>
                                            )}
                                            <Edit3 size={14} className="opacity-0 group-hover:opacity-50" />
                                        </div>
                                    </div>
                                    {(e.startTime || e.endTime) && (
                                        <div className="text-xs opacity-60 mt-1 font-medium font-mono">
                                            {e.startTime} <span className="opacity-40 mx-1">→</span> {e.endTime}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 2: Completed Project Logs */}
                <section>
                    <h3 className="text-xs font-bold opacity-50 uppercase tracking-widest flex items-center gap-2 mb-5">
                        <Activity size={12} /> Completed Tasks
                    </h3>
                    
                    <div className="space-y-3">
                        {dayLogs.map(log => {
                            const proj = projects.find(p => p.id === log.projectId);
                            const task = proj?.subTasks.find(t => t.id === log.subTaskId);
                            
                            return (
                                <div key={log.id} className="bg-white/30 dark:bg-white/5 p-4 rounded-2xl border border-white/30 dark:border-white/5 flex items-start gap-4">
                                    <div className="w-1 h-full min-h-[40px] rounded-full" style={{ backgroundColor: proj?.color || '#ccc' }}></div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold opacity-80 uppercase tracking-wide">{proj?.title}</span>
                                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                            <span className="text-xs opacity-60">{task?.title}</span>
                                        </div>
                                        <p className="text-sm opacity-90 leading-relaxed">
                                            {log.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {dayLogs.length === 0 && (
                            <div className="text-sm opacity-40 italic bg-white/20 dark:bg-white/5 p-4 rounded-2xl text-center border border-dashed border-gray-200/50 dark:border-white/10">
                                No tasks completed today.
                            </div>
                        )}
                    </div>
                </section>

                {/* Section 3: Daily ToDo (NEW) */}
                <section>
                    <h3 className="text-xs font-bold opacity-50 uppercase tracking-widest flex items-center gap-2 mb-5">
                        <ListTodo size={12} /> Daily Checklist
                    </h3>
                    
                    <div className="bg-white/30 dark:bg-white/5 p-5 rounded-2xl border border-white/30 dark:border-white/5">
                        {/* List */}
                        <div className="space-y-3 mb-4">
                            {dayTodos.map(todo => (
                                <div key={todo.id} className="group flex items-center gap-3">
                                    <button onClick={() => toggleTodo(todo.id)} className={`transition-colors ${todo.completed ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}>
                                        {todo.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>
                                    <span className={`flex-1 text-sm ${todo.completed ? 'opacity-40 line-through' : ''}`}>{todo.text}</span>
                                    <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-50 hover:opacity-100 hover:text-red-500 transition-all">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {dayTodos.length === 0 && <div className="text-sm opacity-40 italic text-center py-2">Nothing on the list yet.</div>}
                        </div>
                        
                        {/* Input */}
                        <div className="flex items-center gap-2 border-t border-gray-200/20 dark:border-white/10 pt-4">
                            <Plus size={16} className="opacity-40" />
                            <input 
                                type="text"
                                placeholder="Add a quick task..."
                                value={todoInput}
                                onChange={(e) => setTodoInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddTodo(); }}
                                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>
                    </div>
                </section>

                {/* Section 4: Journal Sticky Note */}
                <section className="pt-2">
                    <h3 className="text-xs font-bold opacity-50 uppercase tracking-widest flex items-center gap-2 mb-5">
                        <BookOpen size={12} /> Daily Note
                    </h3>
                    
                    {/* Mood Selector */}
                    <div className="flex gap-3 mb-6 justify-center bg-white/30 dark:bg-white/5 p-3 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-white/5">
                        {moods.map((m) => {
                            const isActive = dayJournal.mood === m.label;
                            return (
                                <button
                                    key={m.label}
                                    onClick={() => handleJournalSave(dayJournal.content, m.label)}
                                    className={`p-2.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-white dark:bg-white/20 shadow-lg scale-110 ring-1 ring-black/5' : 'opacity-40 hover:opacity-100 hover:scale-110'}`}
                                    title={m.label}
                                >
                                    <span className="text-2xl filter drop-shadow-sm">{m.emoji}</span>
                                </button>
                            )
                        })}
                    </div>
                    
                    {/* Sticky Note Appearance */}
                    <div className={`relative p-8 rounded-xl shadow-lg transition-all duration-500 transform hover:rotate-1 ${moods.find(m => m.label === dayJournal.mood)?.bg || 'bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-white/10'} ${moods.find(m => m.label === dayJournal.mood)?.text || ''} border backdrop-blur-md`}>
                        {/* Pin Effect */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 border-4 border-white dark:border-gray-800 shadow-sm z-10"></div>
                        
                        <textarea 
                            className="w-full min-h-[120px] bg-transparent text-base leading-relaxed resize-none focus:outline-none font-serif italic placeholder-gray-400/60 dark:placeholder-gray-500"
                            placeholder="How was your day? Drop a note here..."
                            value={dayJournal.content}
                            onChange={(e) => handleJournalSave(e.target.value, dayJournal.mood)}
                        />
                        <div className="text-[10px] opacity-50 text-right mt-4 font-bold uppercase tracking-widest">
                            {dayJournal.mood} Day
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
  );
};

export default CalendarView;