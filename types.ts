
export enum ActivityCategory {
  Work = 'Work',
  Health = 'Health',
  Social = 'Social',
  Personal = 'Personal',
}

export interface ActivityObject {
  id: string;
  name: string;
  category: ActivityCategory;
  subActivity?: string;
  subSubActivity?: string;
  info?: string;
}

export interface TimerSettings {
  sessionDuration: number; // in seconds
  breakDuration: number; // in seconds
  sessionCount: number;
}

export type TrackerFrequency = 'every_break' | 'end_of_session';

export interface Tracker {
  id: string;
  name: string;
  metrics: string[];
}

export interface TrackerSettings {
  frequency: TrackerFrequency;
  selectedTrackerId: string | null;
}

// The configuration for a new session
export interface SessionConfig {
  activity: ActivityObject;
  timerSettings: TimerSettings;
  trackerSettings: TrackerSettings;
}

// A note taken during a session
export interface SessionNote {
  timestamp: string; // ISO String
  note: string;
}

// A performance tracker entry from a break
export interface TrackerEntry {
  timestamp: string; // ISO String
  metrics: Record<string, number>; // e.g. { Mood: 7, Energy: 8 } (0-10 scale)
}

// The final log object that gets saved for a timed session
export interface SessionLog {
  id: string; // EndTime_ActivityName
  TimeStart: string; // ISO String
  TimeEnd: string; // ISO String
  Object: {
    id: string;
    name: string;
    type: ActivityCategory;
    subActivity?: string;
    subSubActivity?: string;
    info?: string;
  };
  TrackerAndMetric: TrackerEntry[];
  Notes: SessionNote[];
}

// Type for what TrackerScreen passes back to App.tsx
export interface PerformanceUpdate {
  timestamp: number;
  metrics: Record<string, number>;
}

// New types for the Intake feature
export enum IntakeType {
  Drug = 'Drug',
  Drink = 'Drink',
  Food = 'Food',
  Supplement = 'Supplement',
}

export enum IntakeUnit {
  Piece = 'Piece',
  Mg = 'mg',
  g = 'g',
  ml = 'ml',
  ug = 'µg',
}

export interface IntakeObject {
  id: string;
  name: string;
  type: IntakeType;
  defaultQuantity: number;
  defaultUnit: IntakeUnit;
  info?: string;
}

export interface IntakeLog {
  id: string; // timestamp_intakeName
  timestamp: string; // ISO String for when it was taken
  intake: IntakeObject;
  quantity: number;
  unit: IntakeUnit;
}

// New types for the Reading feature
export interface ReadingObject {
  id:string;
  bookName: string;
  author: string;
  year?: number;
  info?: string;
}

export interface ReadingLog {
  id: string; // EndTime_BookName
  TimeStart: string; // ISO String
  TimeEnd: string; // ISO String
  Object: ReadingObject;
  TrackerAndMetric: TrackerEntry[];
  Notes: SessionNote[];
}

// New type for the Note feature
export interface NoteLog {
    id: string; // timestamp_title_hash
    timestamp: string; // ISO String
    title?: string;
    content: string;
    TrackerAndMetric: TrackerEntry[];
    relatedActivities?: Pick<ActivityObject, 'id' | 'name' | 'category'>[];
}


// A union type to represent any kind of log entry in the app
export type AppLog = SessionLog | IntakeLog | ReadingLog | NoteLog;