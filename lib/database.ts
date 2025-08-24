import { supabase } from './supabase';
import {
    SystemFunction,
    ObjectDefinition,
    ObjectInstance,
    LogDefinition,
    LogInstance
} from '../types/flexible-database';

// ===== GENERIC DATA ACCESS LAYER FOR FLEXIBLE SCHEMA =====

// ===== System Functions =====

/**
 * Fetches all available system functions.
 * These are the building blocks for creating object definitions.
 */
export async function getSystemFunctions(): Promise<SystemFunction[]> {
    const { data, error } = await supabase
        .from('system_functions')
        .select('*');

    if (error) {
        console.error('Error fetching system functions:', error);
        throw error;
    }
    return data || [];
}


// ===== Object Definitions =====

/**
 * Fetches all object definitions for the current user.
 * @returns A promise that resolves to an array of object definitions.
 */
export async function getObjectDefinitions(): Promise<ObjectDefinition[]> {
    const { data, error } = await supabase
        .from('object_definitions')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching object definitions:', error);
        throw error;
    }
    return data || [];
}

/**
 * Creates a new object definition.
 * @param definition - The object definition to create.
 * @returns The created object definition.
 */
export async function createObjectDefinition(definition: Omit<ObjectDefinition, 'id' | 'user_id' | 'created_at'>): Promise<ObjectDefinition> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('object_definitions')
        .insert({ ...definition, user_id: user.id })
        .select()
        .single();

    if (error) {
        console.error('Error creating object definition:', error);
        throw error;
    }
    return data;
}


// ===== Object Instances =====

/**
 * Fetches all object instances for a given definition.
 * @param definitionId - The ID of the object definition.
 * @returns A promise that resolves to an array of object instances.
 */
export async function getObjectsByDefinition(definitionId: string): Promise<ObjectInstance[]> {
    const { data, error } = await supabase
        .from('objects')
        .select('*')
        .eq('definition_id', definitionId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching objects by definition:', error);
        throw error;
    }
    return data || [];
}

/**
 * Creates a new object instance.
 * @param object - The object instance to create.
 * @returns The created object instance.
 */
export async function createObject(object: Omit<ObjectInstance, 'id' | 'user_id' | 'created_at'>): Promise<ObjectInstance> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('objects')
        .insert({ ...object, user_id: user.id })
        .select()
        .single();
    
    if (error) {
        console.error('Error creating object instance:', error);
        throw error;
    }
    return data;
}


// ===== Log Definitions =====

/**
 * Fetches all log definitions for the current user.
 * @returns A promise that resolves to an array of log definitions.
 */
export async function getLogDefinitions(): Promise<LogDefinition[]> {
    const { data, error } = await supabase
        .from('log_definitions')
        .select('*')
        .order('name');
    
    if (error) {
        console.error('Error fetching log definitions:', error);
        throw error;
    }
    return data || [];
}


// ===== Log Instances =====

/**
 * Fetches all log instances for a given object.
 * @param objectId - The ID of the object.
 * @returns A promise that resolves to an array of log instances.
 */
export async function getLogsForObject(objectId: string): Promise<LogInstance[]> {
    const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('object_id', objectId)
        .order('timestamp_start', { ascending: false });
    
    if (error) {
        console.error('Error fetching logs for object:', error);
        throw error;
    }
    return data || [];
}

/**
 * Creates a new log instance.
 * @param log - The log instance to create.
 * @returns The created log instance.
 */
export async function createLog(log: Omit<LogInstance, 'id' | 'user_id'>): Promise<LogInstance> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('logs')
        .insert({ ...log, user_id: user.id })
        .select()
        .single();

    if (error) {
        console.error('Error creating log:', error);
        throw error;
    }
    return data;
}

// ===== Generic Delete Function =====

/**
 * Deletes a record from a specified table by its ID.
 * @param tableName - The name of the table to delete from.
 * @param id - The UUID of the record to delete.
 */
export async function deleteRecordById(tableName: 'object_definitions' | 'objects' | 'log_definitions' | 'logs', id: string): Promise<void> {
    const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`Error deleting record from ${tableName}:`, error);
        throw error;
    }
}
