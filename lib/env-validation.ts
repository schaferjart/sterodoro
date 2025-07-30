// Environment Validation for Sterodoro
// Ensures all required environment variables are present

import { getCurrentLocalTime } from './time-utils';

interface EnvironmentConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  NODE_ENV: string;
  VITE_APP_VERSION?: string;
}

// Required environment variables
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
] as const;

// Optional environment variables
const OPTIONAL_ENV_VARS = [
  'VITE_APP_VERSION',
  'VITE_APP_NAME'
] as const;

// Validate environment variables
export function validateEnvironment(): EnvironmentConfig {
  const missing: string[] = [];
  const config: Partial<EnvironmentConfig> = {};

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = import.meta.env[envVar as keyof ImportMetaEnv];
    if (!value) {
      missing.push(envVar);
    } else {
      config[envVar.replace('VITE_', '') as keyof EnvironmentConfig] = value as string;
    }
  }

  // Check optional variables
  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = (import.meta.env as any)[envVar];
    if (value) {
      config[envVar.replace('VITE_', '') as keyof EnvironmentConfig] = value as string;
    }
  }

  // Add NODE_ENV
  config.NODE_ENV = (import.meta.env as any).MODE || 'development';

  // Throw error if required variables are missing
  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
    
    console.error('Environment Validation Failed:', {
      missing,
      available: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')),
      nodeEnv: (import.meta.env as any).MODE
    });
    
    throw error;
  }

  return config as EnvironmentConfig;
}

// Get environment configuration
export function getEnvironmentConfig(): EnvironmentConfig {
  try {
    return validateEnvironment();
  } catch (error) {
    // In development, show helpful error message
    if ((import.meta.env as any).MODE === 'development') {
      console.error('Environment validation failed:', error);
      console.log('Available environment variables:', Object.keys(import.meta.env));
      console.log('Please create a .env.local file with the required variables.');
    }
    throw error;
  }
}

// Check if running in production
export function isProduction(): boolean {
  return (import.meta.env as any).MODE === 'production';
}

// Check if running in development
export function isDevelopment(): boolean {
  return (import.meta.env as any).MODE === 'development';
}

// Get app version
export function getAppVersion(): string {
  return (import.meta.env as any).VITE_APP_VERSION || '1.0.0';
}

// Get app name
export function getAppName(): string {
  return (import.meta.env as any).VITE_APP_NAME || 'Sterodoro';
}

// Validate Supabase configuration
export function validateSupabaseConfig(): { url: string; anonKey: string } {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase configuration is incomplete. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid Supabase URL format.');
  }

  // Basic key validation (should be a valid JWT format)
  if (!anonKey.startsWith('eyJ')) {
    throw new Error('Invalid Supabase anonymous key format.');
  }

  return { url, anonKey };
}

// Environment info for debugging
export function getEnvironmentInfo() {
  return {
    mode: (import.meta.env as any).MODE,
    nodeEnv: process.env.NODE_ENV,
    version: getAppVersion(),
    name: getAppName(),
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    timestamp: getCurrentLocalTime()
  };
} 