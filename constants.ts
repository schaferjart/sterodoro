
import { ActivityCategory, ActivityObject, Tracker, IntakeObject, IntakeType, IntakeUnit, ReadingObject } from './types';

export const ACTIVITIES: ActivityObject[] = [
  // Empty - users will create their own activities
];

export const TRACKERS: Tracker[] = [
  {
    id: 'tracker-perf',
    name: 'Performance',
    metrics: ['Focus', 'Energy', 'Productivity', 'Mood'],
  },
  {
    id: 'tracker-emo',
    name: 'Emotion',
    metrics: ['Happiness', 'Calmness', 'Anxiety'],
  },
];

export const INTAKE_OBJECTS: IntakeObject[] = [
  // Empty - users will create their own intakes
];

export const READING_OBJECTS: ReadingObject[] = [
  // Empty - users will create their own reading objects
];
