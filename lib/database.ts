import { supabase } from './supabase';
import type { ActivityObject, IntakeObject, ReadingObject } from '../types/database';

// ===== ACTIVITY OBJECTS =====

// Get all activity objects for the current user
export async function getActivityObjects(): Promise<ActivityObject[]> {
  const { data, error } = await supabase
    .from('activity_objects')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching activity objects:', error);
    throw error;
  }
  
  // Map snake_case database fields to camelCase frontend fields
  return (data || []).map(item => ({
    id: item.id,
    userId: item.user_id,
    name: item.name,
    category: item.category,
    subActivity: item.sub_activity,
    subSubActivity: item.sub_sub_activity,
    info: item.info
  }));
}

// Create a new activity object
export async function createActivityObject(activity: Omit<ActivityObject, 'id' | 'userId'>): Promise<ActivityObject> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('activity_objects')
    .insert({
      user_id: user.id,
      name: activity.name,
      category: activity.category,
      sub_activity: activity.subActivity,
      sub_sub_activity: activity.subSubActivity,
      info: activity.info
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating activity object:', error);
    throw error;
  }
  
  // Map snake_case database fields to camelCase frontend fields
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    category: data.category,
    subActivity: data.sub_activity,
    subSubActivity: data.sub_sub_activity,
    info: data.info
  };
}

// ===== INTAKE OBJECTS =====

// Get all intake objects for the current user
export async function getIntakeObjects(): Promise<IntakeObject[]> {
  const { data, error } = await supabase
    .from('intake_objects')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching intake objects:', error);
    throw error;
  }
  
  // Map snake_case database fields to camelCase frontend fields
  return (data || []).map(item => ({
    id: item.id,
    userId: item.user_id,
    name: item.name,
    type: item.type,
    defaultQuantity: item.default_quantity,
    defaultUnit: item.default_unit,
    info: item.info
  }));
}

// Create a new intake object
export async function createIntakeObject(intake: Omit<IntakeObject, 'id' | 'userId'>): Promise<IntakeObject> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('intake_objects')
    .insert({
      user_id: user.id,
      name: intake.name,
      type: intake.type,
      default_quantity: intake.defaultQuantity,
      default_unit: intake.defaultUnit,
      info: intake.info
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating intake object:', error);
    throw error;
  }
  
  // Map snake_case database fields to camelCase frontend fields
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    type: data.type,
    defaultQuantity: data.default_quantity,
    defaultUnit: data.default_unit,
    info: data.info
  };
}

// ===== READING OBJECTS =====

// Get all reading objects for the current user
export async function getReadingObjects(): Promise<ReadingObject[]> {
  const { data, error } = await supabase
    .from('reading_objects')
    .select('*')
    .order('book_name');
  
  if (error) {
    console.error('Error fetching reading objects:', error);
    throw error;
  }
  
  // Map snake_case database fields to camelCase frontend fields
  return (data || []).map(item => ({
    id: item.id,
    userId: item.user_id,
    bookName: item.book_name,
    author: item.author,
    year: item.year,
    info: item.info
  }));
}

// Create a new reading object
export async function createReadingObject(reading: Omit<ReadingObject, 'id' | 'userId'>): Promise<ReadingObject> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('reading_objects')
    .insert({
      user_id: user.id,
      book_name: reading.bookName,
      author: reading.author,
      year: reading.year,
      info: reading.info
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating reading object:', error);
    throw error;
  }
  
  // Map snake_case database fields to camelCase frontend fields
  return {
    id: data.id,
    userId: data.user_id,
    bookName: data.book_name,
    author: data.author,
    year: data.year,
    info: data.info
  };
}

// ===== LOGGING FUNCTIONS =====

// Log a session
export async function logSession(sessionLog: {
  activityObjectId: string;
  timeStart: string;
  timeEnd: string;
  trackerMetrics?: Record<string, number>;
  notes?: Array<{timestamp: string; note: string}>;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { error } = await supabase
    .from('session_logs')
    .insert({
      user_id: user.id,
      activity_object_id: sessionLog.activityObjectId,
      time_start: sessionLog.timeStart,
      time_end: sessionLog.timeEnd,
      tracker_and_metric: sessionLog.trackerMetrics,
      notes: sessionLog.notes
    });
  
  if (error) {
    console.error('Error logging session:', error);
    throw error;
  }
}

// Log an intake
export async function logIntake(intakeLog: {
  intakeObjectId: string;
  quantity: number;
  unit: string;
  timestamp: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { error } = await supabase
    .from('intake_logs')
    .insert({
      user_id: user.id,
      intake_object_id: intakeLog.intakeObjectId,
      quantity: intakeLog.quantity,
      unit: intakeLog.unit,
      timestamp: intakeLog.timestamp
    });
  
  if (error) {
    console.error('Error logging intake:', error);
    throw error;
  }
}

// Log a reading session
export async function logReading(readingLog: {
  readingObjectId: string;
  timeStart: string;
  timeEnd: string;
  trackerMetrics?: Record<string, number>;
  notes?: Array<{timestamp: string; note: string}>;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { error } = await supabase
    .from('reading_logs')
    .insert({
      user_id: user.id,
      reading_object_id: readingLog.readingObjectId,
      time_start: readingLog.timeStart,
      time_end: readingLog.timeEnd,
      tracker_and_metric: readingLog.trackerMetrics,
      notes: readingLog.notes
    });
  
  if (error) {
    console.error('Error logging reading:', error);
    throw error;
  }
}

// Log a note
export async function logNote(noteLog: {
  title?: string;
  content: string;
  timestamp: string;
  trackerMetrics?: Record<string, number>;
  relatedActivities?: Array<{id: string; name: string; category: string}>;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { error } = await supabase
    .from('note_logs')
    .insert({
      user_id: user.id,
      timestamp: noteLog.timestamp,
      title: noteLog.title,
      content: noteLog.content,
      tracker_and_metric: noteLog.trackerMetrics,
      related_activities: noteLog.relatedActivities
    });
  
  if (error) {
    console.error('Error logging note:', error);
    throw error;
  }
}

// ===== LOADING LOGS =====

// Get all session logs for the current user
export async function getSessionLogs(): Promise<any[]> {
  const { data, error } = await supabase
    .from('session_logs')
    .select(`
      *,
      activity_objects (
        name,
        category,
        sub_activity,
        sub_sub_activity,
        info
      )
    `)
    .order('time_end', { ascending: false });
  
  if (error) {
    console.error('Error fetching session logs:', error);
    throw error;
  }
  
  return data || [];
}

// Get all intake logs for the current user
export async function getIntakeLogs(): Promise<any[]> {
  const { data, error } = await supabase
    .from('intake_logs')
    .select(`
      *,
      intake_objects (
        name,
        type,
        info
      )
    `)
    .order('timestamp', { ascending: false });
  
  if (error) {
    console.error('Error fetching intake logs:', error);
    throw error;
  }
  
  return data || [];
}

// Get all reading logs for the current user
export async function getReadingLogs(): Promise<any[]> {
  const { data, error } = await supabase
    .from('reading_logs')
    .select(`
      *,
      reading_objects (
        book_name,
        author,
        year,
        info
      )
    `)
    .order('time_end', { ascending: false });
  
  if (error) {
    console.error('Error fetching reading logs:', error);
    throw error;
  }
  
  return data || [];
}

// Get all note logs for the current user
export async function getNoteLogs(): Promise<any[]> {
  const { data, error } = await supabase
    .from('note_logs')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (error) {
    console.error('Error fetching note logs:', error);
    throw error;
  }
  
  return data || [];
}

// ===== DELETE FUNCTIONS =====

// Delete an activity object and all related logs
export async function deleteActivityObject(id: string): Promise<void> {
  try {
    // First, delete all session logs that reference this activity
    const { error: sessionLogsError } = await supabase
      .from('session_logs')
      .delete()
      .eq('activity_object_id', id);
    
    if (sessionLogsError) {
      console.error('Error deleting related session logs:', sessionLogsError);
      throw sessionLogsError;
    }

    // Then delete the activity object
    const { error: activityError } = await supabase
      .from('activity_objects')
      .delete()
      .eq('id', id);
    
    if (activityError) {
      console.error('Error deleting activity object:', activityError);
      throw activityError;
    }
  } catch (error) {
    console.error('Error in deleteActivityObject:', error);
    throw error;
  }
}

// Delete an intake object and all related logs
export async function deleteIntakeObject(id: string): Promise<void> {
  try {
    // First, delete all intake logs that reference this intake
    const { error: intakeLogsError } = await supabase
      .from('intake_logs')
      .delete()
      .eq('intake_object_id', id);
    
    if (intakeLogsError) {
      console.error('Error deleting related intake logs:', intakeLogsError);
      throw intakeLogsError;
    }

    // Then delete the intake object
    const { error: intakeError } = await supabase
      .from('intake_objects')
      .delete()
      .eq('id', id);
    
    if (intakeError) {
      console.error('Error deleting intake object:', intakeError);
      throw intakeError;
    }
  } catch (error) {
    console.error('Error in deleteIntakeObject:', error);
    throw error;
  }
}

// Delete a reading object and all related logs
export async function deleteReadingObject(id: string): Promise<void> {
  try {
    // First, delete all reading logs that reference this reading object
    const { error: readingLogsError } = await supabase
      .from('reading_logs')
      .delete()
      .eq('reading_object_id', id);
    
    if (readingLogsError) {
      console.error('Error deleting related reading logs:', readingLogsError);
      throw readingLogsError;
    }

    // Then delete the reading object
    const { error: readingError } = await supabase
      .from('reading_objects')
      .delete()
      .eq('id', id);
    
    if (readingError) {
      console.error('Error deleting reading object:', readingError);
      throw readingError;
    }
  } catch (error) {
    console.error('Error in deleteReadingObject:', error);
    throw error;
  }
}

// Delete a session log
export async function deleteSessionLog(id: string): Promise<void> {
  const { error } = await supabase
    .from('session_logs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting session log:', error);
    throw error;
  }
}

// Delete an intake log
export async function deleteIntakeLog(id: string): Promise<void> {
  const { error } = await supabase
    .from('intake_logs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting intake log:', error);
    throw error;
  }
}

// Delete a reading log
export async function deleteReadingLog(id: string): Promise<void> {
  const { error } = await supabase
    .from('reading_logs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting reading log:', error);
    throw error;
  }
}

// Delete a note log
export async function deleteNoteLog(id: string): Promise<void> {
  const { error } = await supabase
    .from('note_logs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting note log:', error);
    throw error;
  }
}

// Test function to verify Supabase connection
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('activity_objects')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful!');
    return true;
  } catch (err) {
    console.error('Connection test failed:', err);
    return false;
  }
} 