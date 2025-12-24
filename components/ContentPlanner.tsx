import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Wand2, ChevronDown, ChevronUp, Search, Tag, X, Calendar as CalendarIcon, Clock, Edit2, Save, Pencil, MessageSquarePlus, Check } from 'lucide-react';
import { ContentProject, SubTask, TaskStatus, ProjectLog } from '../types';
import { generateContentSubtasks } from '../services/geminiService';

interface ContentPlannerProps {
  projects: ContentProject[];
  setProjects: React.Dispatch<React.SetStateAction<ContentProject[]>>;
  projectLogs: ProjectLog[];
  setProjectLogs: React.Dispatch<React.SetStateAction<ProjectLog[]>>;
}

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
];

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ContentPlanner: React.FC<ContentPlannerProps> = ({ projects, setProjects, projectLogs, setProjectLogs }) => {
  // Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[4]); 
  
  // Welcome Message State
  const [welcomeMessage, setWelcomeMessage] = useState(() => {
      return localStorage.getItem('cs_welcome_msg') || 'Content Pipeline';
  });
  const [isEditingWelcome, setIsEditingWelcome] = useState(false);
  const [tempWelcome, setTempWelcome] = useState(welcomeMessage);

  // Editing State (Project)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ContentProject>>({});

  // Editing State (Logs) - NEW
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogContent, setEditLogContent] = useState('');

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Log State - Now Inline
  const [loggingTaskId, setLoggingTaskId] = useState<string | null>(null); // Which task is currently being logged?
  const [logContent, setLogContent] = useState('');
  const [logDate, setLogDate] = useState(getLocalDateString());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
      localStorage.setItem('cs_welcome_msg', welcomeMessage);
  }, [welcomeMessage]);

  const saveWelcomeMessage = () => {
      if (tempWelcome.trim()) {
          setWelcomeMessage(tempWelcome);
      }
      setIsEditingWelcome(false);
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [projects]);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? p.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const calculateProgress = (project: ContentProject) => {
    if (project.subTasks.length === 0) return 0;
    const completed = project.subTasks.filter(st => st.isCompleted).length;
    return Math.round((completed / project.subTasks.length) * 100);
  };

  // --- Create Handlers ---
  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const newProject: ContentProject = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc,
      status: TaskStatus.TODO,
      subTasks: [],
      tags: [],
      color: newColor,
      createdAt: Date.now(),
    };
    setProjects(prev => [newProject, ...prev]);
    setIsCreating(false);
    resetForm();
    setExpandedId(newProject.id);
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewColor(PRESET_COLORS[4]);
  };

  // --- Edit Handlers ---
  const startEditing = (project: ContentProject) => {
    setEditingId(project.id);
    setEditForm({
      title: project.title,
      description: project.description,
      color: project.color
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = () => {
    if (!editingId) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== editingId) return p;
      return { ...p, ...editForm };
    }));
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (editingId === id) cancelEditing();
    }
  };

  const toggleSubtask = (projectId: string, subtaskId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const updatedSubtasks = p.subTasks.map(st => {
        if (st.id === subtaskId) {
            const newCompleted = !st.isCompleted;
            return { 
                ...st, 
                isCompleted: newCompleted,
                // If marking complete, add timestamp. If unchecking, remove it.
                completedAt: newCompleted ? Date.now() : undefined
            };
        }
        return st;
      });
      
      const completedCount = updatedSubtasks.filter(st => st.isCompleted).length;
      let newStatus = p.status;
      if (completedCount === 0) newStatus = TaskStatus.TODO;
      else if (completedCount === updatedSubtasks.length) newStatus = TaskStatus.DONE;
      else newStatus = TaskStatus.IN_PROGRESS;

      return { ...p, subTasks: updatedSubtasks, status: newStatus };
    }));
  };

  const addSubtask = (projectId: string, title: string, startDate: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        subTasks: [...p.subTasks, { 
            id: Date.now().toString() + Math.random(), 
            title, 
            isCompleted: false,
            startDate: startDate || getLocalDateString()
        }]
      };
    }));
  };

  const addTag = (projectId: string, tag: string) => {
    if(!tag.trim()) return;
    setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        if (p.tags?.includes(tag.trim())) return p;
        return { ...p, tags: [...(p.tags || []), tag.trim()] };
    }));
  };

  const removeTag = (projectId: string, tagToRemove: string) => {
    setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        return { ...p, tags: (p.tags || []).filter(t => t !== tagToRemove) };
    }));
  };

  const toggleLogging = (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation();
      if (loggingTaskId === taskId) {
          setLoggingTaskId(null);
          setLogContent('');
      } else {
          setLoggingTaskId(taskId);
          setLogContent('');
          setLogDate(getLocalDateString());
      }
  };

  const handleAddLog = (projectId: string, taskId: string) => {
    if (!logContent.trim()) return;
    setProjectLogs(prev => [...prev, {
        id: Date.now().toString(),
        projectId,
        subTaskId: taskId,
        date: logDate,
        content: logContent
    }]);
    setLogContent('');
    setLoggingTaskId(null); // Close the inline logger
  };

  // --- Log Editing Handlers (NEW) ---
  const handleStartEditLog = (log: ProjectLog) => {
      setEditingLogId(log.id);
      setEditLogContent(log.content);
  };

  const handleSaveLogEdit = (logId: string) => {
      if (!editLogContent.trim()) return;
      setProjectLogs(prev => prev.map(log => 
          log.id === logId ? { ...log, content: editLogContent } : log
      ));
      setEditingLogId(null);
      setEditLogContent('');
  };

  const handleDeleteLog = (logId: string) => {
      if(confirm('Delete this activity log?')) {
          setProjectLogs(prev => prev.filter(log => log.id !== logId));
      }
  };

  const handleMagicGenerate = async (project: ContentProject) => {
    setGeneratingId(project.id);
    try {
      const suggestions = await generateContentSubtasks(project.title, project.description);
      const today = getLocalDateString();
      setProjects(prev => prev.map(p => {
        if (p.id !== project.id) return p;
        const existingTitles = new Set(p.subTasks.map(st => st.title));
        const newSubTasks: SubTask[] = suggestions
          .filter(t => !existingTitles.has(t))
          .map(t => ({
             id: Date.now().toString() + Math.random(),
             title: t,
             isCompleted: false,
             startDate: today
          }));
        return { ...p, subTasks: [...p.subTasks, ...newSubTasks] };
      }));
    } catch (e) {
      console.error(e);
      alert("AI Generation failed. Check API Key or try again.");
    } finally {
      setGeneratingId(null);
    }
  };

  // New Subtask Input State
  const [newTaskInput, setNewTaskInput] = useState<{ [key: string]: string }>({});
  const [newTaskDateInput, setNewTaskDateInput] = useState<{ [key: string]: string }>({});

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto bg-transparent text-gray-900 dark:text-gray-100">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-6">
            <div>
                {isEditingWelcome ? (
                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            autoFocus
                            value={tempWelcome}
                            onChange={(e) => setTempWelcome(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveWelcomeMessage()}
                            className="text-4xl font-bold bg-transparent border-b border-gray-400 outline-none w-full text-gray-900 dark:text-white"
                        />
                        <button onClick={saveWelcomeMessage} className="p-2 bg-green-500 text-white rounded-lg"><CheckCircle2 size={20}/></button>
                    </div>
                ) : (
                    <div className="group flex items-center gap-3">
                        {/* Solid color text for better readability as requested */}
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {welcomeMessage}
                        </h1>
                        <button 
                            onClick={() => { setTempWelcome(welcomeMessage); setIsEditingWelcome(true); }}
                            className="opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"
                        >
                            <Pencil size={18} />
                        </button>
                    </div>
                )}
                <p className="opacity-60 mt-2 text-lg">Break down projects. Track progress. Create.</p>
            </div>
            <button
            onClick={() => setIsCreating(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-bold hover:opacity-80 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
            <Plus size={20} /> New Project
            </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <input 
                    type="text" 
                    placeholder="Search projects..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm placeholder-gray-500 dark:placeholder-gray-400"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar sm:max-w-md items-center">
                <button 
                    onClick={() => setSelectedTag(null)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all border ${!selectedTag ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' : 'bg-white/40 dark:bg-black/40 text-gray-600 dark:text-gray-300 border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10'}`}
                >
                    All
                </button>
                {allTags.map(tag => (
                    <button 
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedTag === tag ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/40 dark:bg-black/40 text-gray-600 dark:text-gray-300 border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10'}`}
                    >
                        #{tag}
                    </button>
                ))}
            </div>
        </div>
      </header>

      {/* CREATE FORM */}
      {isCreating && (
        <div className="mb-8 !bg-white dark:!bg-gray-900/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-widest">Project Title</label>
                <input
                    autoFocus
                    type="text"
                    placeholder="e.g., 'Introduction to Python'"
                    className="w-full text-2xl font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border-b border-gray-200 dark:border-gray-700 bg-transparent outline-none pb-2 focus:border-blue-500 transition-colors"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                />
              </div>
          </div>
          
          <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 tracking-widest">Project Color</label>
              <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm">
                    <input 
                        type="color" 
                        value={newColor} 
                        onChange={(e) => setNewColor(e.target.value)}
                        className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer p-0"
                        title="Choose custom color"
                    />
                  </div>
                  <div className="flex gap-2">
                      {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setNewColor(c)}
                            className={`w-8 h-8 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-300 dark:ring-gray-600' : 'hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                          />
                      ))}
                  </div>
              </div>
          </div>

          <input
            type="text"
            placeholder="Brief description or goal..."
            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 mb-6 transition-all"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsCreating(false)} className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl font-medium transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={!newTitle} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/20">Create Project</button>
          </div>
        </div>
      )}

      {/* PROJECT LIST */}
      <div className="space-y-6 pb-20">
        {filteredProjects.map(project => {
            const progress = calculateProgress(project);
            const isExpanded = expandedId === project.id;
            const isEditing = editingId === project.id;
            const myLogs = projectLogs.filter(log => log.projectId === project.id).sort((a,b) => b.date.localeCompare(a.date));
            
            return (
                // Card Background: White in Light Mode (requested), Dark Gray in Dark Mode.
                <div key={project.id} className="bg-white/90 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl border border-white/50 dark:border-white/5 shadow-sm hover:shadow-xl hover:bg-white dark:hover:bg-black/70 transition-all duration-300 overflow-hidden relative group">
                    {/* Color bar indicator */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: project.color }}></div>
                    
                    <div 
                        className="p-6 pl-10 cursor-pointer select-none"
                        onClick={() => {
                            if (!isEditing) setExpandedId(isExpanded ? null : project.id);
                        }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-3 mb-1">
                                    {/* Text: Solid Black in Light Mode (requested) */}
                                    <h3 className={`text-2xl font-bold text-gray-900 dark:text-gray-100 ${project.status === TaskStatus.DONE ? 'opacity-40 line-through' : ''}`}>
                                        {project.title}
                                    </h3>
                                    {!isExpanded && project.tags && project.tags.length > 0 && (
                                        <div className="flex gap-1">
                                            {project.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100/50 dark:bg-white/10 rounded-full font-medium text-gray-700 dark:text-gray-300">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-xs opacity-60 mt-1 text-gray-900 dark:text-gray-300">
                                    <span className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md">
                                        <CalendarIcon size={12} /> 
                                        Tasks: {project.subTasks.length}
                                    </span>
                                    {project.description && <span className="line-clamp-1 italic">{project.description}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="mt-2 w-32 flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${progress}%`, backgroundColor: project.color }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold opacity-50 w-8 text-right text-gray-900 dark:text-gray-100">{progress}%</span>
                                </div>
                                <div className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-black/5 dark:bg-white/10 rotate-180' : 'group-hover:bg-black/5 dark:group-hover:bg-white/10'}`}>
                                    <ChevronDown size={20} className="opacity-50 text-gray-900 dark:text-gray-100"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="bg-white/50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 p-6 pl-10 animate-in slide-in-from-top-2 duration-300">
                             
                             {/* TOOLBAR */}
                             <div className="flex justify-between items-center mb-8">
                                {/* Tag Management */}
                                {!isEditing ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Tag size={14} className="opacity-40" />
                                        {project.tags?.map(tag => (
                                            <span key={tag} className="text-xs px-2.5 py-1 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-full flex items-center gap-1.5 backdrop-blur-sm text-gray-800 dark:text-gray-200">
                                                #{tag}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); removeTag(project.id, tag); }}
                                                    className="hover:text-red-500 opacity-60 hover:opacity-100"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                        <input 
                                            type="text" 
                                            placeholder="+ Tag" 
                                            className="bg-transparent text-xs outline-none placeholder-gray-400 dark:placeholder-gray-600 min-w-[60px] text-gray-900 dark:text-white"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.stopPropagation();
                                                    addTag(project.id, e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm font-bold text-blue-600 flex items-center gap-2"><Edit2 size={14}/> Editing Project Details</span>
                                )}

                                <div className="flex gap-2">
                                    {!isEditing && (
                                        <>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); startEditing(project); }}
                                                className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 rounded-lg font-bold transition-all border border-gray-200 dark:border-white/5 shadow-sm text-gray-700 dark:text-white"
                                            >
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMagicGenerate(project);
                                                }}
                                                disabled={generatingId === project.id}
                                                className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-lg font-bold transition-all border border-purple-200/50 dark:border-purple-700/30"
                                            >
                                                {generatingId === project.id ? <span className="animate-pulse">Thinking...</span> : <><Wand2 size={12} /><span>AI Plan</span></>}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                                                className="opacity-40 hover:opacity-100 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                             </div>

                             {isEditing ? (
                                 /* EDIT FORM */
                                 <div className="!bg-white dark:!bg-gray-900/90 p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-lg animate-in fade-in duration-200">
                                     <div className="mb-4">
                                         <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wider">Title</label>
                                         <input 
                                             type="text" 
                                             value={editForm.title || ''}
                                             onChange={(e) => setEditForm(prev => ({...prev, title: e.target.value}))}
                                             className="w-full text-xl font-bold bg-transparent text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-1 outline-none focus:border-blue-500"
                                         />
                                     </div>
                                     <div className="mb-4">
                                         <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">Color</label>
                                         <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                                                <input 
                                                    type="color" 
                                                    value={editForm.color || '#000000'} 
                                                    onChange={(e) => setEditForm(prev => ({...prev, color: e.target.value}))}
                                                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0"
                                                />
                                            </div>
                                             <div className="flex gap-2">
                                                 {PRESET_COLORS.map(c => (
                                                     <button
                                                         key={c}
                                                         onClick={() => setEditForm(prev => ({...prev, color: c}))}
                                                         className={`w-6 h-6 rounded-full transition-transform ${editForm.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-600' : 'hover:scale-110 opacity-70'}`}
                                                         style={{ backgroundColor: c }}
                                                     />
                                                 ))}
                                             </div>
                                         </div>
                                     </div>
                                     <div className="mb-4">
                                         <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wider">Description</label>
                                         <textarea 
                                             value={editForm.description || ''}
                                             onChange={(e) => setEditForm(prev => ({...prev, description: e.target.value}))}
                                             className="w-full h-24 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-blue-500/50"
                                         />
                                     </div>
                                     <div className="flex justify-end gap-2">
                                         <button onClick={cancelEditing} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">Cancel</button>
                                         <button onClick={saveEditing} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2 font-bold shadow-md">
                                             <Save size={14} /> Save Changes
                                         </button>
                                     </div>
                                 </div>
                             ) : (
                                 /* VIEW MODE (Tasks & Logs) */
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                     {/* Column 1: Tasks (2/3 width) */}
                                     <div className="md:col-span-2 space-y-4">
                                         <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-bold opacity-50 uppercase tracking-widest flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <CheckCircle2 size={12} /> Breakdown
                                            </h4>
                                         </div>

                                         <div className="space-y-2 bg-gray-50/50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 p-3">
                                             {project.subTasks.length === 0 && <div className="text-center py-6 opacity-40 text-sm italic">No tasks yet. Create one below.</div>}
                                             
                                             {project.subTasks.map(subtask => {
                                                 const taskLogs = projectLogs.filter(l => l.subTaskId === subtask.id);
                                                 const dates = taskLogs.map(l => l.date).sort();
                                                 const lastActivity = dates.length > 0 ? dates[dates.length - 1] : subtask.startDate;
                                                 const isLogging = loggingTaskId === subtask.id;

                                                 return (
                                                    <div key={subtask.id} className="group">
                                                        {/* Task Row */}
                                                        <div 
                                                            className={`flex items-center gap-3 p-3 rounded-xl transition-all border border-transparent ${isLogging ? 'bg-white dark:bg-white/10 border-blue-500/30 shadow-sm' : 'hover:bg-white/80 dark:hover:bg-white/5'}`}
                                                            onClick={() => toggleSubtask(project.id, subtask.id)}
                                                        >
                                                            <div className={`transition-colors cursor-pointer ${subtask.isCompleted ? 'text-green-500' : 'opacity-30 text-gray-500 dark:text-white'}`}>
                                                                {subtask.isCompleted ? <CheckCircle2 size={20} fill="currentColor" className="text-white dark:text-black" /> : <Circle size={20} />}
                                                            </div>
                                                            <div className="flex-1 cursor-pointer">
                                                                <div className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${subtask.isCompleted ? 'opacity-40 line-through' : ''}`}>
                                                                    {subtask.title}
                                                                </div>
                                                                <div className="text-[10px] opacity-40 flex items-center gap-2 mt-0.5 text-gray-900 dark:text-gray-200">
                                                                    <span className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">Start: {subtask.startDate}</span>
                                                                    {lastActivity !== subtask.startDate && <span className="bg-green-100/50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">→ Active: {lastActivity}</span>}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Inline Log Button */}
                                                            <button 
                                                                onClick={(e) => toggleLogging(e, subtask.id)}
                                                                className={`p-2 rounded-lg transition-all ${isLogging ? 'bg-blue-600 text-white shadow-lg' : 'opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-white'}`}
                                                                title="Log Progress for this task"
                                                            >
                                                                <MessageSquarePlus size={16} />
                                                            </button>
                                                        </div>

                                                        {/* Inline Log Form */}
                                                        {isLogging && (
                                                            <div className="ml-10 mr-2 mb-4 mt-2 p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 animate-in slide-in-from-top-2 duration-200 shadow-sm">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <span className="text-[10px] font-bold opacity-50 uppercase text-gray-500 dark:text-gray-400">Date:</span>
                                                                    <input 
                                                                        type="date" 
                                                                        value={logDate}
                                                                        onChange={(e) => setLogDate(e.target.value)}
                                                                        className="text-xs bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 outline-none text-gray-900 dark:text-gray-200"
                                                                    />
                                                                </div>
                                                                <textarea 
                                                                    autoFocus
                                                                    className="w-full text-sm outline-none resize-none h-20 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500/50 transition-colors mb-3 text-gray-900 dark:text-gray-100"
                                                                    placeholder={`What did you achieve for "${subtask.title}"?`}
                                                                    value={logContent}
                                                                    onChange={(e) => setLogContent(e.target.value)}
                                                                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddLog(project.id, subtask.id); }}}
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <button 
                                                                        onClick={() => setLoggingTaskId(null)}
                                                                        className="text-xs opacity-60 hover:opacity-100 px-3 py-1.5 text-gray-700 dark:text-gray-300"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleAddLog(project.id, subtask.id)}
                                                                        disabled={!logContent.trim()}
                                                                        className="text-xs bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-lg hover:opacity-80 disabled:opacity-40 font-bold transition-opacity"
                                                                    >
                                                                        Save Log
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                 );
                                             })}

                                             {/* Add New Task Row */}
                                             <div className="p-2 border-t border-gray-200 dark:border-white/5 mt-2">
                                                 <div className="flex items-center gap-3 mb-2 px-1">
                                                     <Plus size={16} className="opacity-40 text-gray-500 dark:text-white" />
                                                     <input 
                                                         type="text" 
                                                         placeholder="Add new task..." 
                                                         className="bg-transparent text-sm w-full outline-none placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-white"
                                                         value={newTaskInput[project.id] || ''}
                                                         onChange={(e) => setNewTaskInput({...newTaskInput, [project.id]: e.target.value})}
                                                         onKeyDown={(e) => {
                                                             if (e.key === 'Enter') {
                                                                 const date = newTaskDateInput[project.id] || getLocalDateString();
                                                                 addSubtask(project.id, e.currentTarget.value, date);
                                                                 setNewTaskInput({...newTaskInput, [project.id]: ''});
                                                             }
                                                         }}
                                                     />
                                                 </div>
                                                 <div className="flex items-center gap-2 pl-8">
                                                     <span className="text-[10px] font-bold opacity-40 uppercase text-gray-500 dark:text-white">Start Date:</span>
                                                     <input 
                                                        type="date"
                                                        className="text-[10px] bg-white dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 outline-none text-gray-900 dark:text-gray-300"
                                                        value={newTaskDateInput[project.id] || getLocalDateString()}
                                                        onChange={(e) => setNewTaskDateInput({...newTaskDateInput, [project.id]: e.target.value})}
                                                     />
                                                 </div>
                                             </div>
                                         </div>
                                     </div>

                                     {/* Column 2: Activity History (View + Edit) */}
                                     <div className="border-l border-gray-200 dark:border-white/5 pl-8 flex flex-col h-full">
                                        <h4 className="text-xs font-bold opacity-50 uppercase tracking-widest mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <Clock size={12} /> Project History
                                        </h4>
                                        
                                        <div className="flex-1 overflow-y-auto max-h-[500px] space-y-4 pr-2 custom-scrollbar">
                                            {myLogs.length === 0 && <div className="text-xs opacity-40 italic text-gray-500 dark:text-white">No activity logs yet. Click the <MessageSquarePlus size={12} className="inline"/> icon on a task to log progress.</div>}
                                            {myLogs.map(log => {
                                                const task = project.subTasks.find(st => st.id === log.subTaskId);
                                                const isEditingLog = editingLogId === log.id;

                                                return (
                                                    <div key={log.id} className="text-sm relative pl-4 border-l border-gray-200 dark:border-gray-700 group/log">
                                                        <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                                        <div className="flex justify-between items-center text-[10px] opacity-50 mb-1 uppercase tracking-wider font-bold text-gray-600 dark:text-gray-400">
                                                            <span>{log.date}</span>
                                                        </div>
                                                        
                                                        <div className={`bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5 relative ${isEditingLog ? 'ring-2 ring-blue-500/20' : ''}`}>
                                                            {isEditingLog ? (
                                                                <div className="space-y-2">
                                                                    <div className="text-xs font-bold opacity-80 text-gray-900 dark:text-white mb-2">{task?.title || 'Unknown Task'}</div>
                                                                    <textarea 
                                                                        autoFocus
                                                                        value={editLogContent}
                                                                        onChange={(e) => setEditLogContent(e.target.value)}
                                                                        className="w-full text-xs bg-gray-50 dark:bg-black/50 rounded-lg p-2 outline-none border border-gray-200 dark:border-gray-700 resize-none h-20 text-gray-900 dark:text-gray-100"
                                                                    />
                                                                    <div className="flex justify-end gap-2">
                                                                        <button onClick={() => setEditingLogId(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded">
                                                                            <X size={14} className="text-gray-500"/>
                                                                        </button>
                                                                        <button onClick={() => handleSaveLogEdit(log.id)} className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                                                                            <Check size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="text-xs font-bold mb-1 opacity-80 text-gray-900 dark:text-white">{task?.title || 'Unknown Task'}</div>
                                                                    <div className="opacity-90 leading-relaxed text-xs text-gray-700 dark:text-gray-300 pr-6">
                                                                        {log.content}
                                                                    </div>
                                                                    
                                                                    {/* Edit/Delete Actions - Visible on Hover */}
                                                                    <div className="absolute top-2 right-2 opacity-0 group-hover/log:opacity-100 transition-opacity flex gap-1">
                                                                        <button 
                                                                            onClick={() => handleStartEditLog(log)}
                                                                            className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded text-gray-400 hover:text-blue-500"
                                                                            title="Edit Log"
                                                                        >
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleDeleteLog(log.id)}
                                                                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500"
                                                                            title="Delete Log"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                     </div>
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default ContentPlanner;