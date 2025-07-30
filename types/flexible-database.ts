// Flexible database types for user-defined objects and metrics

export interface UserObjectType {
  id: string;
  userId: string;
  name: string; // "BJJ", "Museum Visit", "Coffee"
  category: string; // "Sports", "Leisure", "Health"
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserMetric {
  id: string;
  userId: string;
  objectTypeId: string;
  name: string; // "Technique Quality", "Energy Level"
  minValue: number;
  maxValue: number;
  unit?: string; // "stars", "mg", "level"
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface UserObjectLog {
  id: string;
  userId: string;
  objectTypeId: string;
  timeStart?: string;
  timeEnd?: string;
  metrics?: Record<string, number>; // {"technique_quality": 8, "energy_level": 7}
  notes?: Array<{timestamp: string; note: string}>;
  customFields?: Record<string, any>; // {"gym": "BJJ Academy", "partner": "John"}
  createdAt: string;
}

// Helper types for creating objects
export interface CreateUserObjectTypeRequest {
  name: string;
  category: string;
  description?: string;
}

export interface CreateUserMetricRequest {
  objectTypeId: string;
  name: string;
  minValue: number;
  maxValue: number;
  unit?: string;
  displayOrder?: number;
}

export interface CreateUserObjectLogRequest {
  objectTypeId: string;
  timeStart?: string;
  timeEnd?: string;
  metrics?: Record<string, number>;
  notes?: Array<{timestamp: string; note: string}>;
  customFields?: Record<string, any>;
} 