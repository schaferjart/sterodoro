import { ActivityCategory, IntakeType, IntakeUnit } from '../types';

export interface ActivityObject {
  id: string;
  userId: string;
  name: string;
  category: ActivityCategory; // Use the enum instead of string
  subActivity?: string;
  subSubActivity?: string;
  info?: string;
}

export interface IntakeObject {
  id: string;
  userId: string;
  name: string;
  type: IntakeType; // Use the enum instead of string
  defaultQuantity: number;
  defaultUnit: IntakeUnit; // Use the enum instead of string
  info?: string;
}

export interface ReadingObject {
  id: string;
  userId: string;
  bookName: string;
  author: string;
  year?: number;
  info?: string;
}

export interface SessionLog {
  id: string;
  userId: string;
  timeStart: string;
  timeEnd: string;
  activityObjectId?: string;
  trackerAndMetric?: any; // JSONB
  notes?: any; // JSONB
}

export interface IntakeLog {
  id: string;
  userId: string;
  timestamp: string;
  intakeObjectId?: string;
  quantity: number;
  unit: string;
}

export interface ReadingLog {
  id: string;
  userId: string;
  timeStart: string;
  timeEnd: string;
  readingObjectId?: string;
  trackerAndMetric?: any; // JSONB
  notes?: any; // JSONB
}

export interface NoteLog {
  id: string;
  userId: string;
  timestamp: string;
  title?: string;
  content: string;
  trackerAndMetric?: any; // JSONB
  relatedActivities?: any; // JSONB
} 