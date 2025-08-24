import { create } from 'zustand';
import { SessionConfig, PerformanceUpdate, SessionNote } from '../../types';

interface SessionState {
  config: SessionConfig | null;
  timerState: {
    isActive: boolean;
    isBreak: boolean;
    currentSession: number;
    timeRemaining: number;
    madeTime: number;
    startTime: number;
  };
  performanceLogs: PerformanceUpdate[];
  sessionNotes: SessionNote[];
  isFinalTracking: boolean;

  setConfig: (config: SessionConfig | null) => void;
  setTimerState: (timerState: Partial<SessionState['timerState']>) => void;
  addPerformanceLog: (log: PerformanceUpdate) => void;
  addSessionNote: (note: SessionNote) => void;
  setIsFinalTracking: (isFinal: boolean) => void;
  resetSession: () => void;
}

const initialState = {
    config: null,
    timerState: {
        isActive: false,
        isBreak: false,
        currentSession: 1,
        timeRemaining: 0,
        madeTime: 0,
        startTime: 0,
    },
    performanceLogs: [],
    sessionNotes: [],
    isFinalTracking: false,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,
  setConfig: (config) => set({ config }),
  setTimerState: (timerState) => set((state) => ({ timerState: { ...state.timerState, ...timerState } })),
  addPerformanceLog: (log) => set((state) => ({ performanceLogs: [...state.performanceLogs, log] })),
  addSessionNote: (note) => set((state) => ({ sessionNotes: [...state.sessionNotes, note] })),
  setIsFinalTracking: (isFinal) => set({ isFinalTracking: isFinal }),
  resetSession: () => set(initialState),
}));
