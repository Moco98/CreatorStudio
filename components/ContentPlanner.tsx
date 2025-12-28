import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Wand2, ChevronDown, ChevronUp, Search, X, Edit2, MessageSquarePlus, Palette, Sparkles, Hash, Calendar, Clock, ArrowRight, ChevronRight } from 'lucide-react';
import { ContentProject, TaskStatus, ProjectLog } from '../types';
import { generateContentSubtasks } from '../services/geminiService';

interface ContentPlannerProps {
  projects: ContentProject[];
  setProjects: React.Dispatch<React.SetStateAction<ContentProject[]>>;
  projectLogs: ProjectLog[];
  setProjectLogs: React.Dispatch<React.SetStateAction<ProjectLog[]>>;
}

const DEFAULT_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', 
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B', '#000000'
];

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
  
  // Custom Color State
  const [savedColors, setSavedColors] = useState<string[]>(() => {
      const saved = localStorage.getItem('cs_project_colors');
      return saved ? JSON.parse(saved) : DEFAULT_COLORS;
  });
  const [newColor, setNewColor] = useState(savedColors[6] || '#3B82F6');
  
  // Welcome Message
  const [welcomeMessage, setWelcomeMessage] = useState(() => localStorage.getItem('cs_welcome_msg') || 'Content Pipeline');
  const [isEditingWelcome, setIsEditingWelcome] = useState(false);
  const [tempWelcome, setTempWelcome] = useState(welcomeMessage);

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ContentProject>>({});

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Log State
  const [loggingTaskId, setLoggingTaskId] = useState<string | null>(null);
  const [logContent, setLogContent] = useState('');
  const [logDate, setLogDate] = useState(getLocalDateString());
  const [expandedLogTaskIds, setExpandedLogTaskIds] = useState<Set<string>>(new Set());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
      localStorage.setItem('cs_welcome_msg', welcomeMessage);
  }, [welcomeMessage]);

  useEffect(() => {
      localStorage.setItem('cs_project_colors', JSON.stringify(savedColors));
  }, [savedColors]);

  const saveWelcomeMessage = () => {
      if (tempWelcome.trim()) setWelcomeMessage(tempWelcome);
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
      createdAt: Date.now()
    };
    setProjects(prev => [newProject, ...prev]);
    setIsCreating(false);
    setNewTitle('');
    setNewDesc('');
    setNewColor(savedColors[6] || '#3B82F6');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      setProjectLogs(prev => prev.filter(l => l.projectId !== id));
    }
  };

  const startEditing = (project: ContentProject) => {
      setEditingId(project.id);
      setEditForm({
          title: project.title,
          description: project.description,
          color: project.color,
          tags: project.tags || []
      });
  };

  const saveEdit = () => {
      if (editingId && editForm.title) {
          setProjects(prev => prev.map(p => p.id === editingId ? { ...p, ...editForm } as ContentProject : p));
          setEditingId(null);
          setEditForm({});
      }
  };

  // --- Subtask Logic ---
  const handleAddSubTask = (projectId: string) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              const shouldReopen = p.status === TaskStatus.DONE;
              return {
                  ...p,
                  status: shouldReopen ? TaskStatus.IN_PROGRESS : p.status,
                  subTasks: [...p.subTasks, {
                      id: Date.now().toString() + Math.random().toString().slice(2, 6),
                      title: 'New Task',
                      isCompleted: false,
                      startDate: getLocalDateString()
                  }]
              };
          }
          return p;
      }));
      setExpandedId(projectId);
  };

  const handleMagicGenerate = async (projectId: string) => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      setGeneratingId(projectId);
      const generatedTasks = await generateContentSubtasks(project.title, project.description);
      
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              const shouldReopen = p.status === TaskStatus.DONE;
              const newSubTasks = generatedTasks.map(t => ({
                  id: Date.now().toString() + Math.random().toString().slice(2, 8),
                  title: t,
                  isCompleted: false,
                  startDate: getLocalDateString()
              }));
              return {
                  ...p,
                  status: shouldReopen ? TaskStatus.IN_PROGRESS : p.status,
                  subTasks: [...p.subTasks, ...newSubTasks]
              };
          }
          return p;
      }));
      setGeneratingId(null);
      setExpandedId(projectId);
  };

  const toggleSubTask = (projectId: string, taskId: string) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              const updatedTasks = p.subTasks.map(t => 
                  t.id === taskId ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? Date.now() : undefined } : t
              );
              const allCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.isCompleted);
              const anyCompleted = updatedTasks.some(t => t.isCompleted);
              let newStatus = p.status;
              if (allCompleted) newStatus = TaskStatus.DONE;
              else if (anyCompleted) newStatus = TaskStatus.IN_PROGRESS;
              else newStatus = TaskStatus.TODO;
              return { ...p, subTasks: updatedTasks, status: newStatus };
          }
          return p;
      }));
  };

  const deleteSubTask = (projectId: string, taskId: string) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { ...p, subTasks: p.subTasks.filter(t => t.id !== taskId) };
          }
          return p;
      }));
  };

  const updateSubTaskTitle = (projectId: string, taskId: string, newTitle: string) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { ...p, subTasks: p.subTasks.map(t => t.id === taskId ? { ...t, title: newTitle } : t) };
          }
          return p;
      }));
  };

  const updateSubTaskDate = (projectId: string, taskId: string, newDate: string, isEnd: boolean = false) => {
    setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
            return { 
                ...p, 
                subTasks: p.subTasks.map(t => {
                    if (t.id === taskId) {
                        return isEnd ? { ...t, endDate: newDate } : { ...t, startDate: newDate };
                    }
                    return t;
                }) 
            };
        }
        return p;
    }));
  };

  const handleSaveLog = (projectId: string, taskId: string) => {
      if (!logContent.trim()) return;
      const newLog: ProjectLog = {
          id: Date.now().toString(),
          projectId,
          subTaskId: taskId,
          date: logDate,
          content: logContent
      };
      setProjectLogs(prev => [newLog, ...prev]);

      // Expand logs for this task since we just added one
      const newSet = new Set(expandedLogTaskIds);
      newSet.add(taskId);
      setExpandedLogTaskIds(newSet);

      // Update Task Date Range Logic
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              const updatedSubTasks = p.subTasks.map(t => {
                  if (t.id === taskId) {
                      let newStart = t.startDate;
                      let newEnd = t.endDate || t.startDate;

                      // If log date is earlier than start date, update start date
                      if (logDate < newStart) {
                          newStart = logDate;
                      }
                      
                      // If log date is later than end date, update end date
                      if (logDate > newEnd) {
                          newEnd = logDate;
                      }

                      return { ...t, startDate: newStart, endDate: newEnd };
                  }
                  return t;
              });
              return { ...p, subTasks: updatedSubTasks };
          }
          return p;
      }));

      setLogContent('');
      setLoggingTaskId(null);
  };

  const handleDeleteLog = (logId: string) => {
      if(confirm("Delete this log?")) {
          setProjectLogs(prev => prev.filter(l => l.id !== logId));
      }
  };

  const toggleLogExpansion = (taskId: string) => {
      const newSet = new Set(expandedLogTaskIds);
      if (newSet.has(taskId)) {
          newSet.delete(taskId);
      } else {
          newSet.add(taskId);
      }
      setExpandedLogTaskIds(newSet);
  };

  // --- Custom Color Picker Logic ---
  const handleAddColor = (hex: string) => {
      if (/^#[0-9A-F]{6}$/i.test(hex) && !savedColors.includes(hex)) {
          setSavedColors([...savedColors, hex]);
      }
  };

  const handleRemoveColor = (hex: string) => {
      setSavedColors(prev => prev.filter(c => c !== hex));
      // If removed color was selected, reset to default
      if (newColor === hex) setNewColor(savedColors[0] || '#000000');
      if (editForm.color === hex) setEditForm(prev => ({...prev, color: savedColors[0]}));
  };
  
  const ColorPicker = ({ selected, onSelect }: { selected: string, onSelect: (c: string) => void }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [tempHex, setTempHex] = useState('#');

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 my-1">
                {savedColors.map(c => (
                    <div key={c} className="group relative">
                        <button
                            onClick={() => onSelect(c)}
                            className={`w-8 h-8 rounded-full transition-all shadow-sm border border-gray-100 dark:border-gray-700 ${selected === c ? 'scale-110 ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500' : 'hover:scale-105'}`}
                            style={{ backgroundColor: c }}
                            title={c}
                        />
                        {/* Remove Button */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveColor(c); }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-500 hover:text-white"
                        >
                            <X size={8} />
                        </button>
                    </div>
                ))}
                
                {/* Add Button */}
                {!isAdding ? (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Add Custom Color"
                    >
                        <Plus size={14} />
                    </button>
                ) : (
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1 border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-left-2">
                        <span className="text-gray-400 text-xs font-bold">#</span>
                        <input 
                            autoFocus
                            value={tempHex.replace('#','')}
                            onChange={(e) => setTempHex('#' + e.target.value)}
                            className="w-16 bg-transparent text-xs font-mono outline-none uppercase"
                            placeholder="RRGGBB"
                            maxLength={6}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddColor(tempHex);
                                    setIsAdding(false);
                                    setTempHex('#');
                                }
                            }}
                        />
                        <button 
                            onClick={() => { handleAddColor(tempHex); setIsAdding(false); setTempHex('#'); }}
                            className="text-green-500 hover:text-green-600"
                        >
                            <CheckCircle2 size={14} />
                        </button>
                        <button 
                            onClick={() => setIsAdding(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl rounded-3xl shadow-xl border border-white/20 dark:border-white/10">
        {/* Header */}
        <header className="flex justify-between items-end mb-6 shrink-0">
            <div>
                <div className="flex items-center gap-3 group">
                    {isEditingWelcome ? (
                        <input 
                            autoFocus
                            className="text-3xl font-bold bg-transparent border-b-2 border-blue-500 outline-none text-gray-900 dark:text-white"
                            value={tempWelcome}
                            onChange={(e) => setTempWelcome(e.target.value)}
                            onBlur={saveWelcomeMessage}
                            onKeyDown={(e) => e.key === 'Enter' && saveWelcomeMessage()}
                        />
                    ) : (
                        <h1 onClick={() => setIsEditingWelcome(true)} className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white cursor-pointer hover:opacity-70 transition-opacity">
                            {welcomeMessage}
                        </h1>
                    )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage your creative pipeline</p>
            </div>
            <button 
                onClick={() => setIsCreating(true)}
                className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-black/10 hover:opacity-80 transition-all"
            >
                <Plus size={18} /> New Project
            </button>
        </header>

        {/* Filters */}
        <div className="flex gap-4 mb-6 shrink-0">
            <div className="flex-1 bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3 transition-all focus-within:bg-white/80 dark:focus-within:bg-gray-800/80">
                <Search size={18} className="text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search projects..." 
                    className="bg-transparent border-none outline-none w-full text-gray-800 dark:text-gray-100 placeholder-gray-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-md">
                <button 
                    onClick={() => setSelectedTag(null)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${!selectedTag ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-white/80'}`}
                >
                    All
                </button>
                {allTags.map(tag => (
                    <button 
                        key={tag}
                        onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tag === selectedTag ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-white/80'}`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {isCreating && (
                <div className="bg-white/80 dark:bg-gray-800/80 p-6 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-xl animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
                    <h3 className="text-lg font-bold mb-4">Create New Project</h3>
                    <input 
                        autoFocus
                        placeholder="Project Title"
                        className="w-full text-xl font-bold bg-transparent border-b border-gray-200 dark:border-gray-700 p-2 outline-none mb-4"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <textarea 
                        placeholder="Description (optional)"
                        className="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none mb-4 min-h-[80px]"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                    />
                    <div className="mb-6">
                        <label className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2 block">Project Color</label>
                        <ColorPicker selected={newColor} onSelect={setNewColor} />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-500 hover:text-gray-800 font-bold">Cancel</button>
                        <button onClick={handleCreate} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md">Create</button>
                    </div>
                </div>
            )}

            {filteredProjects.map(project => {
                const isEditing = editingId === project.id;
                const isExpanded = expandedId === project.id;
                const progress = calculateProgress(project);

                if (isEditing) {
                    return (
                        <div key={project.id} className="bg-white/80 dark:bg-gray-800/80 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Edit Project</h3>
                                <button onClick={() => setEditingId(null)}><X size={20} className="text-gray-400 hover:text-gray-800"/></button>
                            </div>
                            <input 
                                value={editForm.title}
                                onChange={(e) => setEditForm(prev => ({...prev, title: e.target.value}))}
                                className="w-full text-xl font-bold bg-transparent border-b border-gray-200 dark:border-gray-700 p-2 outline-none mb-4"
                            />
                            <textarea 
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({...prev, description: e.target.value}))}
                                className="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none mb-4 min-h-[80px]"
                            />
                            <div className="mb-4">
                                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2 block">Color</label>
                                <ColorPicker selected={editForm.color || savedColors[0]} onSelect={(c) => setEditForm(prev => ({...prev, color: c}))} />
                            </div>
                             <div className="mb-6">
                                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2 block">Tags (comma separated)</label>
                                <input 
                                    value={editForm.tags?.join(', ')}
                                    onChange={(e) => setEditForm(prev => ({...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)}))}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={saveEdit} className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-md">Save Changes</button>
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={project.id} className="group bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 backdrop-blur-sm">
                        {/* Project Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                                <div 
                                    className="w-2 h-10 rounded-full mt-1 shrink-0 shadow-sm"
                                    style={{ backgroundColor: project.color }}
                                />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{project.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">{project.description}</p>
                                    <div className="flex gap-2 mt-3 flex-wrap">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border ${
                                            project.status === TaskStatus.DONE 
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800' 
                                            : project.status === TaskStatus.IN_PROGRESS 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800'
                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                        }`}>
                                            {project.status.replace('_', ' ')}
                                        </span>
                                        {project.tags?.map(t => (
                                            <span key={t} className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide bg-white/50 dark:bg-white/10 text-gray-500 dark:text-gray-400 border border-white/20">
                                                #{t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditing(project)} className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl text-gray-500"><Edit2 size={18} /></button>
                                <button onClick={() => handleDelete(project.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500"><Trash2 size={18} /></button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6 relative h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%`, backgroundColor: project.color }}
                            />
                        </div>

                        {/* Expand/Collapse Toggle */}
                        <button 
                            onClick={() => setExpandedId(isExpanded ? null : project.id)}
                            className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-2"
                        >
                            {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} 
                            {isExpanded ? 'Hide Tasks' : `${project.subTasks.length} Tasks`}
                        </button>

                        {/* Subtasks Area */}
                        {isExpanded && (
                            <div className="space-y-3 mt-4 animate-in slide-in-from-top-2">
                                {/* Task List */}
                                <div className="space-y-2">
                                    {project.subTasks.map(task => {
                                        const taskLogs = projectLogs.filter(l => l.subTaskId === task.id && l.projectId === project.id);
                                        const isLogsExpanded = expandedLogTaskIds.has(task.id);

                                        return (
                                        <div key={task.id} className="group/task bg-white/40 dark:bg-white/5 p-3 rounded-xl border border-white/40 dark:border-white/5 flex flex-col gap-3 transition-all hover:bg-white/80 dark:hover:bg-white/10">
                                            <div className="flex items-start gap-3">
                                                <button 
                                                    onClick={() => toggleSubTask(project.id, task.id)}
                                                    className={`mt-0.5 transition-colors ${task.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'}`}
                                                >
                                                    {task.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                                </button>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                                                        <input 
                                                            value={task.title}
                                                            onChange={(e) => updateSubTaskTitle(project.id, task.id, e.target.value)}
                                                            className={`bg-transparent flex-1 outline-none text-sm font-medium ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}
                                                        />
                                                        {/* VISIBLE Start/End Date Display */}
                                                        <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-lg border border-gray-100 dark:border-white/5">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Start</span>
                                                                <input 
                                                                    type="date"
                                                                    value={task.startDate}
                                                                    onChange={(e) => updateSubTaskDate(project.id, task.id, e.target.value, false)}
                                                                    className="bg-transparent text-[11px] text-gray-600 dark:text-gray-300 outline-none w-[80px] cursor-pointer hover:text-blue-500"
                                                                />
                                                            </div>
                                                            <ArrowRight size={10} className="text-gray-300"/>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase">End</span>
                                                                <input 
                                                                    type="date"
                                                                    value={task.endDate || task.startDate}
                                                                    onChange={(e) => updateSubTaskDate(project.id, task.id, e.target.value, true)}
                                                                    className="bg-transparent text-[11px] text-gray-600 dark:text-gray-300 outline-none w-[80px] cursor-pointer hover:text-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => {
                                                            setLoggingTaskId(loggingTaskId === task.id ? null : task.id);
                                                            setLogDate(getLocalDateString()); // Reset to today when opening
                                                        }}
                                                        className={`p-1.5 rounded-lg transition-colors ${loggingTaskId === task.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400'}`}
                                                        title="Log Progress"
                                                    >
                                                        <MessageSquarePlus size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteSubTask(project.id, task.id)}
                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 rounded-lg transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Logging Area (Input) */}
                                            {loggingTaskId === task.id && (
                                                <div className="ml-8 p-3 bg-white dark:bg-black/50 rounded-lg shadow-inner animate-in fade-in">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        <input 
                                                            type="date"
                                                            value={logDate}
                                                            onChange={(e) => setLogDate(e.target.value)}
                                                            className="bg-transparent text-xs text-gray-500 dark:text-gray-400 outline-none cursor-pointer hover:text-blue-500"
                                                        />
                                                    </div>
                                                    <textarea 
                                                        autoFocus
                                                        placeholder="What did you do?"
                                                        className="w-full text-xs bg-transparent outline-none mb-2 resize-none text-gray-900 dark:text-gray-100"
                                                        value={logContent}
                                                        onChange={(e) => setLogContent(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if(e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSaveLog(project.id, task.id);
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-gray-400">Press Enter to save</span>
                                                        <button 
                                                            onClick={() => handleSaveLog(project.id, task.id)}
                                                            className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                                                        >Save Log</button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Existing Logs (Collapsible) */}
                                            {taskLogs.length > 0 && (
                                                <div className="ml-8">
                                                    <button 
                                                        onClick={() => toggleLogExpansion(task.id)}
                                                        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-1"
                                                    >
                                                        {isLogsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                        {taskLogs.length} Log{taskLogs.length !== 1 ? 's' : ''}
                                                    </button>

                                                    {isLogsExpanded && (
                                                        <div className="pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-2 animate-in slide-in-from-top-1">
                                                            {taskLogs.map(log => (
                                                                <div key={log.id} className="group/log flex items-start gap-2 text-[10px] text-gray-500">
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className="opacity-50 mr-1 font-mono">{log.date}:</span> 
                                                                        <span className="text-gray-700 dark:text-gray-300">{log.content}</span>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => handleDeleteLog(log.id)}
                                                                        className="opacity-0 group-hover/log:opacity-100 hover:text-red-500 transition-opacity"
                                                                    >
                                                                        <Trash2 size={10} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )})}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button 
                                        onClick={() => handleAddSubTask(project.id)}
                                        className="flex-1 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:border-gray-400 hover:bg-white/30 dark:hover:bg-white/5 transition-all text-sm font-bold flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Add Task
                                    </button>
                                    <button 
                                        onClick={() => handleMagicGenerate(project.id)}
                                        disabled={generatingId === project.id}
                                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm hover:opacity-90 shadow-lg shadow-purple-500/30 flex items-center gap-2 disabled:opacity-50 transition-all"
                                    >
                                        {generatingId === project.id ? (
                                            <span className="animate-spin">✨</span>
                                        ) : (
                                            <Wand2 size={16} />
                                        )}
                                        {generatingId === project.id ? 'Generating...' : 'Magic Plan'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {filteredProjects.length === 0 && !isCreating && (
                <div className="text-center py-20 opacity-40">
                    <Sparkles size={48} className="mx-auto mb-4" />
                    <h3 className="text-xl font-bold">No projects found</h3>
                    <p>Create a new one to get started!</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default ContentPlanner;