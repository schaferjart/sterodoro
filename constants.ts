
import { ActivityCategory, ActivityObject, Tracker, IntakeObject, IntakeType, IntakeUnit, ReadingObject } from './types';

export const ACTIVITIES: ActivityObject[] = [
  { id: 'work-1', name: 'Job Search', category: ActivityCategory.Work },
  { id: 'work-2', name: 'Deep Work Session', category: ActivityCategory.Work },
  { id: 'work-3', name: 'Email & Comms', category: ActivityCategory.Work },
  { id: 'health-1', name: 'Workout', category: ActivityCategory.Health },
  { id: 'health-2', name: 'Meditation', category: ActivityCategory.Health },
  { id: 'health-3', name: 'Meal Prep', category: ActivityCategory.Health },
  { id: 'social-1', name: 'Family Time', category: ActivityCategory.Social },
  { id: 'social-2', name: 'Call a Friend', category: ActivityCategory.Social },
  { id: 'personal-1', name: 'Reading', category: ActivityCategory.Personal },
  { id: 'personal-2', name: 'Cooking', category: ActivityCategory.Personal },
  { id: 'personal-3', name: 'Juoi', category: ActivityCategory.Personal },
  { id: 'personal-4', name: 'Cookisng', category: ActivityCategory.Personal },
  { id: 'personal-5', name: 'Reading', category: ActivityCategory.Personal },
  { id: 'personal-6', name: 'Cooking', category: ActivityCategory.Personal },
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
    { id: 'intake-1', name: 'Coffee', type: IntakeType.Drink, info: 'Standard drip coffee', defaultQuantity: 1, defaultUnit: IntakeUnit.Piece },
    { id: 'intake-2', name: 'Ibuprofen', type: IntakeType.Drug, info: 'For headache relief', defaultQuantity: 200, defaultUnit: IntakeUnit.Mg },
    { id: 'intake-3', name: 'Vitamin D3', type: IntakeType.Supplement, info: '5000 IU', defaultQuantity: 5000, defaultUnit: IntakeUnit.ug },
    { id: 'intake-4', name: 'Apple', type: IntakeType.Food, defaultQuantity: 1, defaultUnit: IntakeUnit.Piece },
    { id: 'intake-5', name: 'espresso', type: IntakeType.Drink, defaultQuantity: 1, defaultUnit: IntakeUnit.Piece },
];

export const READING_OBJECTS: ReadingObject[] = [
    { id: 'reading-1', bookName: 'Sapiens', author: 'Yuval Noah Harari', year: 2011, info: 'A Brief History of Humankind' },
    { id: 'reading-2', bookName: 'Atomic Habits', author: 'James Clear', year: 2018 },
    { id: 'reading-3', bookName: 'How Emotions Are Made', author: 'Lisa Feldman Barret', year: 2016 },
];
