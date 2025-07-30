import { supabase } from './supabase';
import type { IntakeObject } from '../types/database';

// Get all intake objects for the current user (including custom ones)
export async function getIntakeObjects(): Promise<IntakeObject[]> {
  const { data, error } = await supabase
    .from('intake_objects')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching intake objects:', error);
    throw error;
  }
  
  return data || [];
}

// Create a new custom intake object
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
  
  return data;
}

// Log an intake (record when user consumed something)
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

// Get intake logs for the current user
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