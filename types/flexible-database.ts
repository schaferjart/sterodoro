// Type definitions for the flexible, user-defined database schema (Version 2)

import { PostgrestError } from "@supabase/supabase-js";

// From system_functions table
export interface SystemFunction {
    id: string; // UUID
    name: string;
    description?: string;
    data_type: 'TEXT' | 'NUMERIC' | 'BOOLEAN' | 'TIMESTAMPTZ' | 'ARRAY';
    component_key: string;
}

// Represents a single field within an object or log definition's structure
export interface FieldDefinition {
    fieldName: string;
    systemFunctionId: string; // UUID linking to system_functions
    isMandatory: boolean;
    options?: string[]; // For 'Select' or 'MultiSelect' types
}

// From object_definitions table
export interface ObjectDefinition {
    id: string; // UUID
    user_id: string; // UUID
    name: string;
    description?: string;
    created_at: string; // TIMESTAMPTZ
    structure: FieldDefinition[];
}

// From objects table
export interface ObjectInstance {
    id: string; // UUID
    user_id: string; // UUID
    definition_id: string; // UUID linking to object_definitions
    created_at: string; // TIMESTAMPTZ
    data: Record<string, any>; // JSONB object with fields matching the definition's structure
}

// From log_definitions table
export interface LogDefinition {
    id: string; // UUID
    user_id: string; // UUID
    name: string;
    description?: string;
    object_definition_id: string; // UUID linking to object_definitions
    created_at: string; // TIMESTAMPTZ
    structure?: FieldDefinition[]; // Optional structure for complex trackers
}

// From logs table
export interface LogInstance {
    id: string; // UUID
    user_id: string; // UUID
    log_definition_id: string; // UUID linking to log_definitions
    object_id: string; // UUID linking to objects
    timestamp_start: string; // TIMESTAMPTZ
    timestamp_end?: string; // TIMESTAMPTZ
    log_data?: Record<string, any>; // Optional JSONB for extra log-specific data
}

// Generic type for Supabase queries
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never
export type DbResultErr = PostgrestError
