import React, { useState, useMemo } from 'react';
import { ContentProject, JournalEntry, ProjectLog } from '../types';
import { BarChart2, PieChart, Activity, Smile, Zap, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

interface StatsViewProps {
  projects: ContentProject[];
  journalEntries: JournalEntry[];
  projectLogs: ProjectLog[];
}

type TimeRange = 'WEEK' | 'MONTH' | 'YEAR';

const moodColors: Record<string, string> = {
    'Happy': '#10B981', // Green
    'Productive': '#F59E0B', // Yellow
    'Neutral': '#3B82F6', // Blue
    'Stressed': '#6B7280', // Gray
    'Tired': '#6366F1', // Indigo
    'Nothing': '#E5E7EB', // White/Light Gray
};

const stopWords = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'on', 'you', 'this', 'for', 'but', 'with', 'are', 'have', 'be', 'at', 'or', 'as', 'was', 'so', 'if', 'out', 'not', 'did', 'do', 'my', 'me', 'am', 'will', 'just', 'can', 'all', 'up', 'from', 'about', 'how', 'what', 'when', 'where', 'why', 'who']);

const StatsView: React.FC<StatsViewProps> = ({ projects, journalEntries, projectLogs }) => {
  const [range, setRange] = useState<TimeRange>('WEEK');
  const [referenceDate, setReferenceDate] = useState(new Date());

  // Navigation Handler
  const navigate = (direction: 'prev' | 'next') => {
      const newDate = new Date(referenceDate);
      if (range === 'WEEK') {
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      } else if (range === 'MONTH') {
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      } else if (range === 'YEAR') {
          newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
      }
      setReferenceDate(newDate);
  };

  // Helper: Calculate Start/End based on referenceDate and Range
  const getDateRange = () => {
      const start = new Date(referenceDate);
      const end = new Date(referenceDate);

      if (range === 'WEEK') {
          const day = start.getDay();
          // Adjust to Monday start (ISO 8601-ish)
          const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
          start.setDate(diff);
          end.setDate(start.getDate() + 6);
      } else if (range === 'MONTH') {
          start.setDate(1);
          end.setMonth(end.getMonth() + 1);
          end.setDate(0);
      } else if (range === 'YEAR') {
          start.setMonth(0, 1);
          end.setMonth(11, 31);
      }
      // Reset hours
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      return { start, end };
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Helper: Format Date Range for Display
  const formatDateRangeDisplay = () => {
      if (range === 'WEEK') {
          return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else if (range === 'MONTH') {
          return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else {
          return startDate.getFullYear().toString();
      }
  };

  // --- DATA PROCESSING ---

  // 1. Productivity: Tasks Completed (using completedAt)
  const completedTasks = useMemo(() => {
      const tasks = [];
      projects.forEach(p => {
          p.subTasks.forEach(t => {
              if (t.isCompleted && t.completedAt) {
                  const d = new Date(t.completedAt);
                  if (d >= startDate && d <= endDate) {
                      tasks.push({ ...t, date: d });
                  }
              }
          });
      });
      return tasks;
  }, [projects, startDate, endDate]);

  // 2. Productivity: Activity Logs
  const logsInRange = useMemo(() => {
    return projectLogs.filter(l => {
        const d = new Date(l.date);
        return d >= startDate && d <= endDate;
    });
  }, [projectLogs, startDate, endDate]);

  // 3. Moods
  const moodsInRange = useMemo(() => {
      return journalEntries.filter(e => {
          const d = new Date(e.date);
          return d >= startDate && d <= endDate;
      });
  }, [journalEntries, startDate, endDate]);

  // 4. Word Cloud Data
  const wordCloudData = useMemo(() => {
      const textMap: Record<string, number> = {};
      const processText = (text: string) => {
          if (!text) return;
          // Normalize: lowercase, remove non-alphanumeric (keep spaces), split
          const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
          words.forEach(w => {
              if (w.length > 3 && !stopWords.has(w)) {
                  textMap[w] = (textMap[w] || 0) + 1;
              }
          });
      };

      // Process Journal Entries
      journalEntries.forEach(e => {
          const d = new Date(e.date);
          if (d >= startDate && d <= endDate) processText(e.content);
      });
      
      // Process Logs
      logsInRange.forEach(l => processText(l.content));

      return Object.entries(textMap)
          .sort((a,b) => b[1] - a[1]) // Sort by frequency desc
          .slice(0, 30); // Top 30
  }, [journalEntries, logsInRange, startDate, endDate]);


  // --- CHART DATA GENERATION ---

  // Chart 1: Daily/Monthly Activity Bars
  const activityData = useMemo(() => {
      const data: { label: string, tasks: number, logs: number }[] = [];
      
      if (range === 'WEEK' || range === 'MONTH') {
          const iter = new Date(startDate);
          // Safety break for loop
          let count = 0;
          while (iter <= endDate && count < 32) {
              const dateStr = iter.toISOString().split('T')[0];
              
              let label = '';
              if (range === 'WEEK') label = iter.toLocaleDateString('en-US', { weekday: 'short' });
              else label = iter.getDate().toString();

              const tasksCount = completedTasks.filter(t => t.date.toISOString().split('T')[0] === dateStr).length;
              const logsCount = logsInRange.filter(l => l.date === dateStr).length;

              data.push({ label, tasks: tasksCount, logs: logsCount });
              iter.setDate(iter.getDate() + 1);
              count++;
          }
      } else {
          // YEAR View (By Month)
          for (let i = 0; i < 12; i++) {
              const label = new Date(0, i).toLocaleDateString('en-US', { month: 'short' });
              const tasksCount = completedTasks.filter(t => t.date.getMonth() === i).length;
              const logsCount = logsInRange.filter(l => new Date(l.date).getMonth() === i).length;
              data.push({ label, tasks: tasksCount, logs: logsCount });
          }
      }
      return data;
  }, [startDate, endDate, range, completedTasks, logsInRange]);

  // Chart 2: Mood Distribution
  const moodStats = useMemo(() => {
      const counts: Record<string, number> = {};
      moodsInRange.forEach(m => {
          counts[m.mood] = (counts[m.mood] || 0) + 1;
      });
      return Object.entries(counts).sort((a,b) => b[1] - a[1]); // Descending
  }, [moodsInRange]);

  // Chart 3: Year Mood Stacked Bar (Only for Year view)
  const monthlyMoods = useMemo(() => {
      if (range !== 'YEAR') return [];
      
      const months: { label: string, distribution: Record<string, number>, hasData: boolean }[] = [];
      for(let i=0; i<12; i++) {
          const monthEntries = moodsInRange.filter(e => new Date(e.date).getMonth() === i);
          const total = monthEntries.length;
          const dist: Record<string, number> = {}; // Percentage
          
          if(total > 0) {
            monthEntries.forEach(e => {
                dist[e.mood] = (dist[e.mood] || 0) + 1;
            });
            // Convert to %
            Object.keys(dist).forEach(k => dist[k] = (dist[k] / total) * 100);
          }

          months.push({
              label: new Date(0, i).toLocaleDateString('en-US', { month: 'short' }),
              distribution: dist,
              hasData: total > 0
          });
      }
      return months;
  }, [moodsInRange, range]);


  // Max value for scaling charts
  const maxActivity = Math.max(...activityData.map(d => d.tasks + d.logs), 5);
  // Max word frequency for scaling word cloud
  const maxWordFreq = wordCloudData.length > 0 ? wordCloudData[0][1] : 1;

  return (
    <div className="p-8 h-full overflow-y-auto bg-transparent text-gray-900 dark:text-gray-100 flex flex-col gap-8">
        
        {/* Header & Controls */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
            <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Statistics</h1>
                <p className="opacity-60 text-sm">Insights into your productivity and wellbeing.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/40 dark:bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 dark:border-white/10 shadow-sm">
                
                {/* Navigation Controls */}
                <div className="flex items-center gap-1 mr-2 bg-white/50 dark:bg-white/5 rounded-xl p-1">
                    <button onClick={() => navigate('prev')} className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold w-32 text-center select-none">{formatDateRangeDisplay()}</span>
                    <button onClick={() => navigate('next')} className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* View Switcher */}
                <div className="flex bg-gray-100/50 dark:bg-white/5 rounded-xl p-1">
                    {(['WEEK', 'MONTH', 'YEAR'] as TimeRange[]).map(t => (
                        <button
                            key={t}
                            onClick={() => { setRange(t); setReferenceDate(new Date()); }} // Reset date when switching view
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${range === t ? 'bg-white dark:bg-white/20 shadow-sm text-blue-600 dark:text-white' : 'opacity-60 hover:opacity-100'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        </header>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-3 opacity-60 mb-2">
                    <Activity size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Completed Tasks</span>
                </div>
                <div className="text-4xl font-bold">{completedTasks.length}</div>
                <div className="text-sm opacity-50 mt-1">In selected range</div>
            </div>
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-3 opacity-60 mb-2">
                    <Zap size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Activity Logs</span>
                </div>
                <div className="text-4xl font-bold">{logsInRange.length}</div>
                <div className="text-sm opacity-50 mt-1">Written updates</div>
            </div>
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-3 opacity-60 mb-2">
                    <Smile size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Moods Logged</span>
                </div>
                <div className="text-4xl font-bold">{moodsInRange.length}</div>
                <div className="text-sm opacity-50 mt-1">Days tracked</div>
            </div>
        </div>

        {/* Main Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Productivity Bar Chart */}
            <div className="bg-white/50 dark:bg-black/30 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 dark:border-white/5 shadow-lg flex flex-col h-[400px]">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <BarChart2 size={18} className="opacity-60"/> Productivity
                </h3>
                
                <div className={`flex-1 flex items-end ${range === 'MONTH' ? 'gap-1' : 'gap-4'} relative w-full`}>
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                        <div className="border-t border-gray-900 dark:border-white"></div>
                        <div className="border-t border-gray-900 dark:border-white"></div>
                        <div className="border-t border-gray-900 dark:border-white"></div>
                        <div className="border-t border-gray-900 dark:border-white"></div>
                    </div>

                    {activityData.map((d, i) => {
                         const total = d.tasks + d.logs;
                         const heightPct = Math.max((total / maxActivity) * 100, 2); // min 2% height
                         const taskPct = total > 0 ? (d.tasks / total) * 100 : 0;
                         const logPct = total > 0 ? (d.logs / total) * 100 : 0;

                         return (
                            <div key={i} className="flex-1 min-w-0 flex flex-col items-center group h-full justify-end z-10">
                                <div 
                                    className="w-full max-w-[40px] rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-500 hover:brightness-110 relative"
                                    style={{ height: `${heightPct}%` }}
                                >   
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl">
                                        <span className="font-bold">{d.label}</span>: {d.tasks} Tasks, {d.logs} Logs
                                    </div>

                                    {/* Logs Segment */}
                                    <div style={{ height: `${logPct}%` }} className="bg-blue-300 dark:bg-blue-800 w-full transition-all"></div>
                                    {/* Tasks Segment */}
                                    <div style={{ height: `${taskPct}%` }} className="bg-indigo-500 dark:bg-indigo-500 w-full transition-all"></div>
                                </div>
                                <span className={`text-[10px] font-bold mt-2 opacity-50 uppercase tracking-wider truncate w-full text-center ${range === 'MONTH' ? 'text-[8px]' : ''}`}>{d.label}</span>
                            </div>
                         )
                    })}
                </div>
                <div className="flex gap-4 justify-center mt-6 text-xs font-bold opacity-60">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-full"></div> Completed Tasks</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-300 dark:bg-blue-800 rounded-full"></div> Activity Logs</div>
                </div>
            </div>

            {/* Chart 2: Mood Stats */}
            <div className="bg-white/50 dark:bg-black/30 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 dark:border-white/5 shadow-lg flex flex-col h-[400px]">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <PieChart size={18} className="opacity-60"/> Mood Distribution
                </h3>

                {range === 'YEAR' ? (
                    // YEARLY VIEW: Stacked Monthly Bars
                    <div className="flex-1 flex flex-col justify-center space-y-3">
                         {monthlyMoods.map((m, idx) => (
                             <div key={idx} className="flex items-center gap-4">
                                 <span className="w-8 text-[10px] font-bold opacity-50 uppercase text-right">{m.label}</span>
                                 <div className="flex-1 h-6 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden flex relative">
                                     {!m.hasData && <div className="absolute inset-0 flex items-center justify-center text-[9px] opacity-30">No Data</div>}
                                     {Object.entries(m.distribution).map(([mood, pct]) => (
                                         <div 
                                            key={mood} 
                                            style={{ width: `${pct}%`, backgroundColor: moodColors[mood] || '#ccc' }}
                                            className="h-full first:pl-2 last:pr-2"
                                            title={`${mood}: ${Math.round(pct as number)}%`}
                                         ></div>
                                     ))}
                                 </div>
                             </div>
                         ))}
                         <div className="flex flex-wrap gap-3 justify-center mt-6">
                            {Object.entries(moodColors).map(([m, c]) => (
                                <div key={m} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: c}}></div>
                                    <span className="text-[10px] font-bold opacity-60">{m}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // WEEK/MONTH VIEW: Simple Distribution
                    <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
                        {moodStats.length === 0 ? (
                            <div className="opacity-40 text-sm italic">No mood data recorded for this period.</div>
                        ) : (
                            <div className="w-full max-w-sm space-y-4">
                                {moodStats.map(([mood, count]) => {
                                    const pct = Math.round((count / moodsInRange.length) * 100);
                                    return (
                                        <div key={mood} className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold opacity-70">
                                                <span>{mood}</span>
                                                <span>{pct}% ({count})</span>
                                            </div>
                                            <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${pct}%`, backgroundColor: moodColors[mood] || '#999' }}
                                                ></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Feature: Word Cloud (Recurring Topics) */}
             <div className="col-span-1 lg:col-span-2 bg-white/50 dark:bg-black/30 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 dark:border-white/5 shadow-lg flex flex-col">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <MessageSquare size={18} className="opacity-60"/> Recurring Topics
                </h3>
                
                {wordCloudData.length === 0 ? (
                     <div className="flex-1 flex items-center justify-center min-h-[150px] opacity-40 text-sm italic">
                        Write more journal entries or task logs to see recurring topics.
                     </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 min-h-[150px] items-center">
                        {wordCloudData.map(([word, count]) => {
                            // Simple size calculation: relative to max, between 0.75rem and 3rem
                            const sizeRatio = count / maxWordFreq;
                            const fontSize = `${0.8 + (sizeRatio * 2)}rem`;
                            const opacity = 0.5 + (sizeRatio * 0.5);
                            
                            return (
                                <span 
                                    key={word} 
                                    className="font-bold transition-all hover:scale-110 hover:text-blue-500 cursor-default"
                                    style={{ fontSize, opacity }}
                                    title={`${count} occurrences`}
                                >
                                    {word}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    </div>
  );
};

export default StatsView;