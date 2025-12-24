
export enum ViewState {
  PLANNER = 'PLANNER',
  CALENDAR = 'CALENDAR',
  STATS = 'STATS',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  startDate: string; // YYYY-MM-DD, Mandatory for timeline
  completedAt?: number; // Timestamp for statistics
}

export interface ContentProject {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  subTasks: SubTask[];
  tags: string[];
  color: string; // Hex color
  startDate?: string; // Kept for reference, but derived from tasks mostly
  dueDate?: string;   // Derived from max(task logs)
  createdAt: number;
}

export interface ProjectLog {
  id: string;
  projectId: string;
  subTaskId?: string; // New: Link log to specific task
  date: string; // YYYY-MM-DD
  content: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'CLASS' | 'DEADLINE' | 'OTHER';
  tag?: string;   // User defined tag
  color?: string; // User defined color
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: string; // Emoji
  content: string;
  lastUpdated: number;
}

export interface DailyTodo {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  completed: boolean;
}

export interface UserProfile {
  name: string;
  avatarType: 'emoji' | 'image' | 'initials';
  avatarValue: string; // The emoji char, the image DataURL, or the gradient class for initials
}
