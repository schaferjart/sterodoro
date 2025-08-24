import { create } from 'zustand';
import { SystemFunction, ObjectDefinition, ObjectInstance, LogDefinition, LogInstance } from '../types/flexible-database';
import {
  getSystemFunctions,
  getObjectDefinitions,
  createObjectDefinition,
  getObjectsByDefinition,
  createObject,
  getLogDefinitions,
  createLog,
  deleteRecordById,
} from '../database';

interface DataState {
  systemFunctions: SystemFunction[];
  objectDefinitions: ObjectDefinition[];
  objects: ObjectInstance[];
  logDefinitions: LogDefinition[];
  logs: LogInstance[];
  loading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchObjectDefinitions: () => Promise<void>;
  createObjectDefinition: (definition: Omit<ObjectDefinition, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deleteObjectDefinition: (id: string) => Promise<void>;

  fetchObjects: (definitionId: string) => Promise<void>;
  createObject: (object: Omit<ObjectInstance, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deleteObject: (id: string) => Promise<void>;

  createLog: (log: Omit<LogInstance, 'id' | 'user_id'>) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  systemFunctions: [],
  objectDefinitions: [],
  objects: [],
  logDefinitions: [],
  logs: [],
  loading: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;
    set({ loading: true });
    try {
      const systemFunctions = await getSystemFunctions();
      const objectDefinitions = await getObjectDefinitions();
      const logDefinitions = await getLogDefinitions();
      set({
        systemFunctions,
        objectDefinitions,
        logDefinitions,
        isInitialized: true,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to initialize data store:", error);
      set({ loading: false });
    }
  },

  fetchObjectDefinitions: async () => {
    set({ loading: true });
    try {
      const objectDefinitions = await getObjectDefinitions();
      set({ objectDefinitions, loading: false });
    } catch (error) {
      console.error("Failed to fetch object definitions:", error);
      set({ loading: false });
    }
  },

  createObjectDefinition: async (definition) => {
    await createObjectDefinition(definition);
    await get().fetchObjectDefinitions(); // Refetch to get the new list
  },

  deleteObjectDefinition: async (id: string) => {
      await deleteRecordById('object_definitions', id);
      await get().fetchObjectDefinitions();
  },

  fetchObjects: async (definitionId: string) => {
    set({ loading: true });
    try {
      const objects = await getObjectsByDefinition(definitionId);
      set({ objects, loading: false });
    } catch (error) {
      console.error(`Failed to fetch objects for definition ${definitionId}:`, error);
      set({ loading: false });
    }
  },

  createObject: async (object) => {
    await createObject(object);
    await get().fetchObjects(object.definition_id);
  },

  deleteObject: async (id: string) => {
    // We need to know the definition_id to refetch, this is a limitation.
    // For now, we assume the UI will trigger a refetch.
    await deleteRecordById('objects', id);
    set(state => ({ objects: state.objects.filter(o => o.id !== id) }));
  },

  createLog: async (log) => {
    await createLog(log);
    // Maybe refetch logs for the object? For now, we assume UI handles this.
  },
}));

// Initialize the store when the app loads
useDataStore.getState().initialize();
