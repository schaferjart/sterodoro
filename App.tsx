
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SessionConfig, PerformanceUpdate, SessionLog, ActivityObject, SessionNote, TrackerEntry, IntakeObject, IntakeLog, IntakeUnit, AppLog, ReadingObject, ReadingLog, NoteLog, ActivityCategory } from './types';
import { ACTIVITIES, INTAKE_OBJECTS, READING_OBJECTS } from './constants';
import SetupScreen from './screens/SetupScreen';
import TimerScreen from './screens/TimerScreen';
import TrackerScreen from './screens/TrackerScreen';
import HistoryScreen from './screens/HistoryScreen';
import NotePromptScreen from './screens/NotePromptScreen';
import AuthForm from './components/AuthForm';
import SupabaseTest from './components/SupabaseTest';
import CustomObjectTest from './components/CustomObjectTest';
import LogTest from './components/LogTest';
import DeleteTest from './components/DeleteTest';
import OfflineStorageTest from './components/OfflineStorageTest';
import { BackgroundSyncTest } from './components/BackgroundSyncTest';
import SyncQueueViewer from './components/SyncQueueViewer';
import AuthStatusChecker from './components/AuthStatusChecker';
import NotificationPermission from './components/NotificationPermission';
import PushNotificationManager from './components/PushNotificationManager';
import SoundTest from './components/SoundTest';
import IOSNotificationHelper from './components/IOSNotificationHelper';
import PushNotificationDebug from './components/PushNotificationDebug';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initializeErrorReporting } from './lib/error-reporting';
import { validateEnvironment } from './lib/env-validation';
import { 
  getCurrentLocalTime, 
  getCurrentTimestamp, 
  formatLocalDate,
  getRelativeTimeString 
} from './lib/time-utils';
import { syncManager } from './lib/sync-manager';
import { offlineStorage } from './lib/offline-storage';
import { 
  getActivityObjects, 
  createActivityObject as createActivityObjectDB,
  getIntakeObjects,
  createIntakeObject as createIntakeObjectDB,
  getReadingObjects,
  createReadingObject as createReadingObjectDB,
  logSession as logSessionDB,
  logIntake as logIntakeDB,
  logReading as logReadingDB,
  logNote as logNoteDB,
  getSessionLogs,
  getIntakeLogs,
  getReadingLogs,
  getNoteLogs,
  deleteActivityObject as deleteActivityObjectDB,
  deleteIntakeObject as deleteIntakeObjectDB,
  deleteReadingObject as deleteReadingObjectDB,
  deleteSessionLog as deleteSessionLogDB,
  deleteIntakeLog as deleteIntakeLogDB,
  deleteReadingLog as deleteReadingLogDB,
  deleteNoteLog as deleteNoteLogDB
} from './lib/database';

type View = 'SETUP' | 'TIMER' | 'TRACKER' | 'HISTORY' | 'PROMPT_NOTE';

const formatDurationForInfo = (seconds: number): string => {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m}min` : `${m}m ${s}s`;
  }
  return `${seconds}s`;
};

const App: React.FC = () => {
  // Initialize error reporting and validate environment on app start
  useEffect(() => {
    try {
      validateEnvironment();
      initializeErrorReporting();
      console.log('Sterodoro initialized successfully');
      
      // Request notification permission for timer alerts
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch (error) {
      console.error('Failed to initialize Sterodoro:', error);
    }
  }, []);

  const [view, setView] = useState<View>('SETUP');
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [timerState, setTimerState] = useState({
    isActive: false,
    isBreak: false,
    currentSession: 1,
    timeRemaining: 0,
    madeTime: 0,
    startTime: 0,
  });
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceUpdate[]>([]);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  
  // State for session logs
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  // State for intake logs
  const [intakeLogs, setIntakeLogs] = useState<IntakeLog[]>([]);
  // State for reading logs
  const [readingLogs, setReadingLogs] = useState<ReadingLog[]>([]);
  // State for note logs
  const [noteLogs, setNoteLogs] = useState<NoteLog[]>([]);
  
  const [activities, setActivities] = useState<ActivityObject[]>(ACTIVITIES);
  const [intakes, setIntakes] = useState<IntakeObject[]>(INTAKE_OBJECTS);
  const [readingObjects, setReadingObjects] = useState<ReadingObject[]>(READING_OBJECTS);

  const [isFinalTracking, setIsFinalTracking] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('sterodoro-sound-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    try {
      // Load session logs
      const savedSessionLogs = localStorage.getItem('sterodoro-activity-logs');
      if (savedSessionLogs) setSessionLogs(JSON.parse(savedSessionLogs));
      
      // Load intake logs
      const savedIntakeLogs = localStorage.getItem('sterodoro-intake-logs');
      if (savedIntakeLogs) setIntakeLogs(JSON.parse(savedIntakeLogs));
      
      // Load reading logs
      const savedReadingLogs = localStorage.getItem('sterodoro-reading-logs');
      if (savedReadingLogs) setReadingLogs(JSON.parse(savedReadingLogs));

      // Load note logs
      const savedNoteLogs = localStorage.getItem('sterodoro-note-logs');
      if (savedNoteLogs) setNoteLogs(JSON.parse(savedNoteLogs));
    } catch (error) {
      console.error("Failed to load data from local storage", error);
    }
  }, []);

  // Save sound setting when it changes
  useEffect(() => {
    localStorage.setItem('sterodoro-sound-enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Load custom objects from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadCustomObjectsFromSupabase();
      loadLogsFromSupabase();
    }
  }, [user]);

  const loadCustomObjectsFromSupabase = async () => {
    try {
      // Load custom activities
      const customActivities = await getActivityObjects();
      setActivities(prev => [
        ...ACTIVITIES.filter(a => !a.id.startsWith('user-')),
        ...customActivities
      ]);
      
      // Load custom intakes
      const customIntakes = await getIntakeObjects();
      setIntakes(prev => [
        ...INTAKE_OBJECTS.filter(i => !i.id.startsWith('user-')),
        ...customIntakes
      ]);

      // Load custom reading objects
      const customReadingObjects = await getReadingObjects();
      setReadingObjects(prev => [
        ...READING_OBJECTS.filter(r => !r.id.startsWith('user-')),
        ...customReadingObjects
      ]);
    } catch (error) {
      console.error("Failed to load custom objects from Supabase", error);
      }
  };

  const loadLogsFromSupabase = async () => {
    try {
      // Load all logs from Supabase
      const [sessionLogsData, intakeLogsData, readingLogsData, noteLogsData] = await Promise.all([
        getSessionLogs(),
        getIntakeLogs(),
        getReadingLogs(),
        getNoteLogs()
      ]);

      // Convert Supabase data to app format
      const convertedSessionLogs = sessionLogsData.map(log => ({
        id: log.id,
        TimeStart: log.time_start,
        TimeEnd: log.time_end,
        Object: {
          id: log.activity_objects?.id || '',
          name: log.activity_objects?.name || '',
          type: log.activity_objects?.category || '',
          subActivity: log.activity_objects?.sub_activity || '',
          subSubActivity: log.activity_objects?.sub_sub_activity || '',
          info: log.activity_objects?.info || ''
        },
        TrackerAndMetric: log.tracker_and_metric || [],
        Notes: log.notes || []
      }));

      const convertedIntakeLogs = intakeLogsData.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        intake: {
          id: log.intake_objects?.id || '',
          name: log.intake_objects?.name || '',
          type: log.intake_objects?.type || '',
          defaultQuantity: log.intake_objects?.default_quantity || 0,
          defaultUnit: log.intake_objects?.default_unit || '',
          info: log.intake_objects?.info || ''
        },
        quantity: log.quantity,
        unit: log.unit
      }));

      const convertedReadingLogs = readingLogsData.map(log => ({
        id: log.id,
        TimeStart: log.time_start,
        TimeEnd: log.time_end,
        Object: {
          id: log.reading_objects?.id || '',
          bookName: log.reading_objects?.book_name || '',
          author: log.reading_objects?.author || '',
          year: log.reading_objects?.year || 0,
          info: log.reading_objects?.info || ''
        },
        TrackerAndMetric: log.tracker_and_metric || [],
        Notes: log.notes || []
      }));

      const convertedNoteLogs = noteLogsData.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        title: log.title || '',
        content: log.content,
        TrackerAndMetric: log.tracker_and_metric || [],
        relatedActivities: log.related_activities || []
      }));

      setSessionLogs(convertedSessionLogs);
      setIntakeLogs(convertedIntakeLogs);
      setReadingLogs(convertedReadingLogs);
      setNoteLogs(convertedNoteLogs);
      
      // Trigger sync after loading data
      setTimeout(async () => {
        try {
          await syncManager.syncToCloud();
          await syncManager.retryFailedOperations();
        } catch (error) {
          console.error('Initial sync after data load failed:', error);
        }
      }, 2000); // Wait 2 seconds for data to settle
    } catch (error) {
      console.error("Failed to load logs from Supabase", error);
      // Fallback to localStorage if Supabase fails
      loadLogsFromLocalStorage();
    }
  };

  const loadLogsFromLocalStorage = () => {
    try {
      // Load session logs
      const savedSessionLogs = localStorage.getItem('sterodoro-activity-logs');
      if (savedSessionLogs) setSessionLogs(JSON.parse(savedSessionLogs));
      
      // Load intake logs
      const savedIntakeLogs = localStorage.getItem('sterodoro-intake-logs');
      if (savedIntakeLogs) setIntakeLogs(JSON.parse(savedIntakeLogs));
      
      // Load reading logs
      const savedReadingLogs = localStorage.getItem('sterodoro-reading-logs');
      if (savedReadingLogs) setReadingLogs(JSON.parse(savedReadingLogs));

      // Load note logs
      const savedNoteLogs = localStorage.getItem('sterodoro-note-logs');
      if (savedNoteLogs) setNoteLogs(JSON.parse(savedNoteLogs));
    } catch (error) {
      console.error("Failed to load data from local storage", error);
    }
  };

  useEffect(() => {
    import('./lib/auth').then(({ getSession, onAuthStateChange }) => {
      getSession().then(({ data }) => setUser(data.session?.user ?? null));
      const { data: listener } = onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
    });
  }, []);
  
  const logSession = useCallback((newLog: SessionLog) => {
      setSessionLogs(prevLogs => {
          const updatedLogs = [...prevLogs, newLog];
          try {
              localStorage.setItem('sterodoro-activity-logs', JSON.stringify(updatedLogs));
          } catch (error) {
              console.error("Failed to save session logs to local storage", error);
          }
          return updatedLogs;
      });

      // Also save to Supabase if user is authenticated
      if (user) {
        logSessionDB({
          activityObjectId: newLog.Object.id,
          timeStart: newLog.TimeStart,
          timeEnd: newLog.TimeEnd,
          trackerMetrics: newLog.TrackerAndMetric.length > 0 ? newLog.TrackerAndMetric[0].metrics : undefined,
          notes: newLog.Notes.map(note => ({ timestamp: note.timestamp, note: note.note }))
        }).catch(error => {
          console.error("Failed to save session log to Supabase", error);
        });
      }
  }, [user]);

  const saveSessionLog = useCallback((finalPerformanceLogs: PerformanceUpdate[], finalNotes: SessionNote[]) => {
    if (config) {
      const endTime = getCurrentTimestamp();
      const endTimeISO = getCurrentLocalTime();
      const activityName = config.activity.name.replace(/\s+/g, '_');
      
      const newLog: SessionLog = {
        id: `${endTimeISO}_${activityName}`,
        TimeStart: getCurrentLocalTime(),
        TimeEnd: endTimeISO,
        Object: {
          id: config.activity.id,
          name: config.activity.name,
          type: config.activity.category,
          subActivity: config.activity.subActivity,
          subSubActivity: config.activity.subSubActivity,
          info: config.activity.info ?? `${config.timerSettings.sessionCount} × ${formatDurationForInfo(config.timerSettings.sessionDuration)} sessions, ${formatDurationForInfo(config.timerSettings.breakDuration)} breaks`
        },
        TrackerAndMetric: finalPerformanceLogs.map(pLog => ({
          timestamp: getCurrentLocalTime(),
          metrics: pLog.metrics,
        })),
        Notes: finalNotes,
      };

      logSession(newLog);
    }
    
    // Reset all session-related state
    setView('SETUP');
    setConfig(null);
    setTimerState({ isActive: false, isBreak: false, currentSession: 1, timeRemaining: 0, madeTime: 0, startTime: 0 });
    setPerformanceLogs([]);
    setSessionNotes([]);
    setIsFinalTracking(false);
  }, [config, timerState.startTime, logSession]);
  
  const handleLogActivity = useCallback((data: {
      activity: ActivityObject;
      startTime: string;
      endTime: string;
      trackerMetrics?: Record<string, number>;
      noteText?: string;
  }) => {
      const { activity, startTime, endTime, trackerMetrics, noteText } = data;

      const trackerEntries: TrackerEntry[] = trackerMetrics ? [{
          timestamp: getCurrentLocalTime(),
          metrics: trackerMetrics,
      }] : [];

      const notes: SessionNote[] = (noteText && noteText.trim()) ? [{
          timestamp: getCurrentLocalTime(),
          note: noteText.trim(),
      }] : [];

      const newLog: SessionLog = {
          id: `${new Date(endTime).toISOString()}_${activity.name.replace(/\s+/g, '_')}`,
          TimeStart: new Date(startTime).toISOString(),
          TimeEnd: new Date(endTime).toISOString(),
          Object: {
              id: activity.id,
              name: activity.name,
              type: activity.category,
              subActivity: activity.subActivity,
              subSubActivity: activity.subSubActivity,
              info: activity.info,
          },
          TrackerAndMetric: trackerEntries,
          Notes: notes,
      };

      logSession(newLog);
  }, [logSession]);

  const handleStartTimer = useCallback((newConfig: SessionConfig) => {
    setConfig(newConfig);
    setTimerState({
      isActive: true,
      isBreak: false,
      currentSession: 1,
      timeRemaining: newConfig.timerSettings.sessionDuration,
      madeTime: 0,
      startTime: getCurrentTimestamp(),
    });
    setPerformanceLogs([]);
    setSessionNotes([]);
    setIsFinalTracking(false);
    setView('TIMER');
  }, []);

  const handleBreakStart = useCallback(() => {
    if (!config) return;
    
    // Play break end sound
    if (soundEnabled) {
      console.log('🔊 Playing break end sound');
      const audio = new Audio('/sound.mp3');
      audio.play().catch(error => {
        console.warn("Break end sound playback failed.", error);
      });
    }
    
    const { trackerSettings } = config;
    if (trackerSettings.selectedTrackerId && trackerSettings.frequency === 'every_break') {
      if (trackerSettings.selectedTrackerId === 'note') {
        setView('PROMPT_NOTE');
      } else {
        setView('TRACKER');
      }
    } else {
      setTimerState(prev => ({
        ...prev,
        isBreak: true,
        timeRemaining: config.timerSettings.breakDuration,
        madeTime: 0,
      }));
      setView('TIMER');
    }
  }, [config, soundEnabled]);

  const handleTrackerSave = useCallback((update: PerformanceUpdate, newActivity?: ActivityObject) => {
    const updatedPerformanceLogs = [...performanceLogs, update];
    setPerformanceLogs(updatedPerformanceLogs);

    if (isFinalTracking) {
      saveSessionLog(updatedPerformanceLogs, sessionNotes);
    } else {
      if (config) {
        if (newActivity && newActivity.id !== config.activity.id) {
          setConfig(prevConfig => prevConfig ? { ...prevConfig, activity: newActivity } : null);
        }
        setTimerState(prev => ({
          ...prev,
          isBreak: true,
          timeRemaining: config.timerSettings.breakDuration,
          madeTime: 0,
        }));
      }
      setView('TIMER');
    }
  }, [config, isFinalTracking, performanceLogs, sessionNotes, saveSessionLog]);

  const handleSessionStart = useCallback(() => {
    // Play session end sound
    if (soundEnabled) {
      console.log('🔊 Playing session end sound');
      const audio = new Audio('/sound.mp3');
      audio.play().catch(error => {
        console.warn("Session end sound playback failed.", error);
      });
    }
    
    if (config) {
      setTimerState(prev => ({
        ...prev,
        isBreak: false,
        currentSession: prev.currentSession + 1,
        timeRemaining: config.timerSettings.sessionDuration,
        madeTime: 0,
      }));
    }
    setView('TIMER');
  }, [config, soundEnabled]);
  
  const handleTimerEnd = useCallback(() => {
    // Play session end sound for final session
    if (soundEnabled) {
      console.log('🔊 Playing final session end sound');
      const audio = new Audio('/sound.mp3');
      audio.play().catch(error => {
        console.warn("Final session end sound playback failed.", error);
      });
    }
    
    if (config) {
      if (config.trackerSettings.selectedTrackerId) {
        setIsFinalTracking(true);
        if(config.trackerSettings.selectedTrackerId === 'note') {
          setView('PROMPT_NOTE');
        } else {
          setView('TRACKER');
        }
      } else {
        saveSessionLog(performanceLogs, sessionNotes);
      }
    } else {
      setView('SETUP');
      setConfig(null);
    }
  }, [config, performanceLogs, sessionNotes, saveSessionLog, soundEnabled]);
  
  const handleAddNote = useCallback((noteText: string) => {
    const newNote: SessionNote = {
        timestamp: getCurrentLocalTime(),
        note: noteText,
    };
    setSessionNotes(prevNotes => [...prevNotes, newNote]);
  }, []);

  const handleSavePromptedNote = useCallback((noteText: string) => {
    const newNote: SessionNote = {
        timestamp: getCurrentLocalTime(),
        note: noteText,
    };
    const updatedNotes = [...sessionNotes, newNote];
    setSessionNotes(updatedNotes);

    if (isFinalTracking) {
      saveSessionLog(performanceLogs, updatedNotes);
    } else {
      if (config) {
        setTimerState(prev => ({
          ...prev,
          isBreak: true,
          timeRemaining: config.timerSettings.breakDuration,
          madeTime: 0,
        }));
      }
      setView('TIMER');
    }
}, [config, isFinalTracking, performanceLogs, sessionNotes, saveSessionLog]);


  const handleGoHome = useCallback(() => {
    setView('SETUP');
    setConfig(null);
  }, []);

  const handleShowHistory = useCallback(() => setView('HISTORY'), []);
  
  const handleAddNewActivity = useCallback(async (newActivity: Omit<ActivityObject, 'id'>) => {
    try {
      const fullActivity = await createActivityObjectDB(newActivity);
      setActivities(prev => [...prev, fullActivity]);
      return fullActivity;
    } catch (error) {
      console.error("Failed to create activity in Supabase", error);
      // Fallback to localStorage
      const fallbackActivity: ActivityObject = {
          ...newActivity,
          id: `user-${getCurrentTimestamp()}`
      };
      setActivities(prev => [...prev, fallbackActivity]);
      return fallbackActivity;
    }
  }, []);

  const handleAddNewIntake = useCallback(async (newIntake: Omit<IntakeObject, 'id'>): Promise<IntakeObject> => {
    try {
      const fullIntake = await createIntakeObjectDB(newIntake);
      setIntakes(prev => [...prev, fullIntake]);
      return fullIntake;
    } catch (error) {
      console.error("Failed to create intake in Supabase", error);
      // Fallback to localStorage
      const fallbackIntake: IntakeObject = {
        ...newIntake,
        id: `user-${getCurrentTimestamp()}`
    };
      setIntakes(prev => [...prev, fallbackIntake]);
      return fallbackIntake;
    }
  }, []);

  const handleLogIntake = useCallback((data: Array<{
    intakeObject: IntakeObject;
    quantity: number;
    unit: IntakeUnit;
    timestamp: string;
  }>) => {
    const newLogs: IntakeLog[] = data.map(item => ({
        id: `${getCurrentLocalTime()}_${item.intakeObject.name.replace(/\s+/g, '_')}_${Math.random().toString(36).slice(2)}`,
        timestamp: getCurrentLocalTime(),
        intake: item.intakeObject,
        quantity: item.quantity,
        unit: item.unit,
    }));

    setIntakeLogs(prevLogs => {
        const updatedLogs = [...prevLogs, ...newLogs];
        try {
            localStorage.setItem('sterodoro-intake-logs', JSON.stringify(updatedLogs));
        } catch (error) {
            console.error("Failed to save intake logs to local storage", error);
        }
        return updatedLogs;
    });

    // Also save to Supabase if user is authenticated
    if (user) {
      data.forEach(item => {
        logIntakeDB({
          intakeObjectId: item.intakeObject.id,
          quantity: item.quantity,
          unit: item.unit,
          timestamp: item.timestamp
        }).catch(error => {
          console.error("Failed to save intake log to Supabase", error);
        });
      });
    }
  }, [user]);
  
  const handleAddNewReadingObject = useCallback(async (newReadingObject: Omit<ReadingObject, 'id'>): Promise<ReadingObject> => {
    try {
      const fullReadingObject = await createReadingObjectDB(newReadingObject);
      setReadingObjects(prev => [...prev, fullReadingObject]);
      return fullReadingObject;
    } catch (error) {
      console.error("Failed to create reading object in Supabase", error);
      // Fallback to localStorage
      const fallbackReadingObject: ReadingObject = {
        ...newReadingObject,
        id: `user-${getCurrentTimestamp()}`
    };
      setReadingObjects(prev => [...prev, fallbackReadingObject]);
      return fallbackReadingObject;
    }
  }, []);

  const handleLogReading = useCallback((data: {
      readingObject: ReadingObject;
      startTime: string;
      endTime: string;
      trackerMetrics?: Record<string, number>;
      noteText?: string;
  }) => {
      const { readingObject, startTime, endTime, trackerMetrics, noteText } = data;

      const trackerEntries: TrackerEntry[] = trackerMetrics ? [{
          timestamp: getCurrentLocalTime(),
          metrics: trackerMetrics,
      }] : [];

      const notes: SessionNote[] = (noteText && noteText.trim()) ? [{
          timestamp: getCurrentLocalTime(),
          note: noteText.trim(),
      }] : [];

      const newLog: ReadingLog = {
          id: `${getCurrentLocalTime()}_${readingObject.bookName.replace(/\s+/g, '_')}`,
          TimeStart: getCurrentLocalTime(),
          TimeEnd: getCurrentLocalTime(),
          Object: readingObject,
          TrackerAndMetric: trackerEntries,
          Notes: notes,
      };

      setReadingLogs(prevLogs => {
          const updatedLogs = [...prevLogs, newLog];
          try {
              localStorage.setItem('sterodoro-reading-logs', JSON.stringify(updatedLogs));
          } catch (error) {
              console.error("Failed to save reading logs to local storage", error);
          }
          return updatedLogs;
      });

      // Also save to Supabase if user is authenticated
      if (user) {
        logReadingDB({
          readingObjectId: readingObject.id,
          timeStart: startTime,
          timeEnd: endTime,
          trackerMetrics: trackerMetrics,
          notes: notes.map(note => ({ timestamp: note.timestamp, note: note.note }))
        }).catch(error => {
          console.error("Failed to save reading log to Supabase", error);
        });
      }
  }, [user]);

  const handleLogNote = useCallback((data: {
    title?: string;
    content: string;
    timestamp: string;
    trackerMetrics?: Record<string, number>;
    relatedActivities?: Pick<ActivityObject, 'id' | 'name' | 'category'>[];
  }) => {
    const { title, content, timestamp, trackerMetrics, relatedActivities } = data;

    const trackerEntries: TrackerEntry[] = trackerMetrics ? [{
        timestamp: getCurrentLocalTime(),
        metrics: trackerMetrics,
    }] : [];

    const newLog: NoteLog = {
        id: `${getCurrentLocalTime()}_${(title || 'note').replace(/\s+/g, '_')}_${Math.random().toString(36).slice(2)}`,
        timestamp: getCurrentLocalTime(),
        title: title?.trim(),
        content: content.trim(),
        TrackerAndMetric: trackerEntries,
        relatedActivities,
    };

    setNoteLogs(prevLogs => {
        const updatedLogs = [...prevLogs, newLog];
        try {
            localStorage.setItem('sterodoro-note-logs', JSON.stringify(updatedLogs));
        } catch (error) {
            console.error("Failed to save note logs to local storage", error);
        }
        return updatedLogs;
    });

    // Also save to Supabase if user is authenticated
    if (user) {
      logNoteDB({
        title: title?.trim(),
        content: content.trim(),
        timestamp: timestamp,
        trackerMetrics: trackerMetrics,
        relatedActivities: relatedActivities
      }).catch(error => {
        console.error("Failed to save note log to Supabase", error);
      });
    }
  }, [user]);

  const handleCancelPromptNote = () => {
    if (isFinalTracking) {
        saveSessionLog(performanceLogs, sessionNotes);
    } else {
        if (config) {
            setTimerState(prev => ({
                ...prev,
                isBreak: true,
                timeRemaining: config.timerSettings.breakDuration,
                madeTime: 0,
            }));
        }
        setView('TIMER');
    }
  }
  
  const allLogs = useMemo(() => {
    const combined: AppLog[] = [...sessionLogs, ...intakeLogs, ...readingLogs, ...noteLogs];
    // Sort by end time for sessions, and timestamp for intakes/notes
    return combined.sort((a, b) => {
        const timeA = 'TimeEnd' in a ? a.TimeEnd : a.timestamp;
        const timeB = 'TimeEnd' in b ? b.TimeEnd : b.timestamp;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
  }, [sessionLogs, intakeLogs, readingLogs, noteLogs]);

  const renderContent = () => {
    switch (view) {
      case 'TIMER':
        return config && (
          <TimerScreen
            config={config}
            timerState={timerState}
            setTimerState={setTimerState}
            onBreakStart={handleBreakStart}
            onSessionStart={handleSessionStart}
            onTimerEnd={handleTimerEnd}
            onGoHome={handleGoHome}
            onAddNote={handleAddNote}
            notesCount={sessionNotes.length}
            soundEnabled={soundEnabled}
          />
        );
      case 'TRACKER':
        return config && <TrackerScreen activities={activities} config={config} onSave={handleTrackerSave} isFinalTracking={isFinalTracking} />;
      case 'PROMPT_NOTE':
        return <NotePromptScreen onSave={handleSavePromptedNote} onCancel={handleCancelPromptNote} isFinalNote={isFinalTracking} />;
      case 'HISTORY':
        return <HistoryScreen 
          logs={allLogs} 
          onBack={handleGoHome}
          onDeleteSessionLog={handleDeleteSessionLog}
          onDeleteIntakeLog={handleDeleteIntakeLog}
          onDeleteReadingLog={handleDeleteReadingLog}
          onDeleteNoteLog={handleDeleteNoteLog}
        />;
      case 'SETUP':
      default:
        return <SetupScreen 
          onStartTimer={handleStartTimer} 
          onLogActivity={handleLogActivity} 
          onShowHistory={handleShowHistory} 
          activities={activities} 
          onAddNewActivity={handleAddNewActivity}
          onDeleteActivity={handleDeleteActivity}
          intakes={intakes}
          onAddNewIntake={handleAddNewIntake}
          onDeleteIntake={handleDeleteIntake}
          onLogIntake={handleLogIntake}
          readingObjects={readingObjects}
          onAddNewReadingObject={handleAddNewReadingObject}
          onDeleteReadingObject={handleDeleteReadingObject}
          onLogReading={handleLogReading}
          onLogNote={handleLogNote}
          soundEnabled={soundEnabled}
          onSoundEnabledChange={setSoundEnabled}
        />;
    }
  };

  // ===== DELETE FUNCTIONS =====

  const handleDeleteActivity = useCallback(async (id: string) => {
    try {
      // Delete from offline storage first
      await offlineStorage.deleteActivity(id);
      setActivities(prev => prev.filter(activity => activity.id !== id));
      // Also remove related session logs from local state
      setSessionLogs(prev => prev.filter(log => log.Object.id !== id));
      
      // Add delete operation to sync queue
      await syncManager.addToRetryQueue({
        type: 'delete',
        entity: 'activity',
        data: { id },
        maxRetries: 3
      });
    } catch (error) {
      console.error("Failed to delete activity", error);
      alert('Failed to delete activity. Please try again.');
    }
  }, []);

  const handleDeleteIntake = useCallback(async (id: string) => {
    try {
      // Delete from offline storage first
      await offlineStorage.deleteIntake(id);
      setIntakes(prev => prev.filter(intake => intake.id !== id));
      // Also remove related intake logs from local state
      setIntakeLogs(prev => prev.filter(log => log.intake.id !== id));
      
      // Add delete operation to sync queue
      await syncManager.addToRetryQueue({
        type: 'delete',
        entity: 'intake',
        data: { id },
        maxRetries: 3
      });
    } catch (error) {
      console.error("Failed to delete intake", error);
      alert('Failed to delete intake. Please try again.');
    }
  }, []);

  const handleDeleteReadingObject = useCallback(async (id: string) => {
    try {
      // Delete from offline storage first
      await offlineStorage.deleteReadingObject(id);
      setReadingObjects(prev => prev.filter(reading => reading.id !== id));
      // Also remove related reading logs from local state
      setReadingLogs(prev => prev.filter(log => log.Object.id !== id));
      
      // Add delete operation to sync queue
      await syncManager.addToRetryQueue({
        type: 'delete',
        entity: 'readingObject',
        data: { id },
        maxRetries: 3
      });
    } catch (error) {
      console.error("Failed to delete reading object", error);
      alert('Failed to delete reading object. Please try again.');
    }
  }, []);

  const handleDeleteSessionLog = useCallback(async (id: string) => {
    try {
      // Delete from offline storage first
      await offlineStorage.deleteSessionLog(id);
      setSessionLogs(prev => prev.filter(log => log.id !== id));
      
      // Add delete operation to sync queue
      await syncManager.addToRetryQueue({
        type: 'delete',
        entity: 'sessionLog',
        data: { id },
        maxRetries: 3
      });
    } catch (error) {
      console.error("Failed to delete session log", error);
      alert('Failed to delete session log. Please try again.');
    }
  }, []);

  const handleDeleteIntakeLog = useCallback(async (id: string) => {
    try {
      // Delete from offline storage first
      await offlineStorage.deleteIntakeLog(id);
      setIntakeLogs(prev => prev.filter(log => log.id !== id));
      
      // Add delete operation to sync queue
      await syncManager.addToRetryQueue({
        type: 'delete',
        entity: 'intakeLog',
        data: { id },
        maxRetries: 3
      });
    } catch (error) {
      console.error("Failed to delete intake log", error);
      alert('Failed to delete intake log. Please try again.');
    }
  }, []);

  const handleDeleteReadingLog = useCallback(async (id: string) => {
    try {
      // Delete from offline storage first
      await offlineStorage.deleteReadingLog(id);
      setReadingLogs(prev => prev.filter(log => log.id !== id));
      
      // Add delete operation to sync queue
      await syncManager.addToRetryQueue({
        type: 'delete',
        entity: 'readingLog',
        data: { id },
        maxRetries: 3
      });
    } catch (error) {
      console.error("Failed to delete reading log", error);
      alert('Failed to delete reading log. Please try again.');
    }
  }, []);

  const handleDeleteNoteLog = useCallback(async (id: string) => {
    try {
      // Delete from offline storage first
      await offlineStorage.deleteNoteLog(id);
      setNoteLogs(prev => prev.filter(log => log.id !== id));
      
      // Add delete operation to sync queue
      await syncManager.addToRetryQueue({
        type: 'delete',
        entity: 'noteLog',
        data: { id },
        maxRetries: 3
      });
    } catch (error) {
      console.error("Failed to delete note log", error);
      alert('Failed to delete note log. Please try again.');
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="bg-gray-900 text-gray-50 min-h-screen font-sans flex flex-col items-center justify-center p-4">
        {/* Development tools - hidden in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 space-y-2 max-w-md">
            <AuthStatusChecker />
            <IOSNotificationHelper />
            <NotificationPermission />
            <SoundTest />
            <BackgroundSyncTest />
            <OfflineStorageTest />
            <SyncQueueViewer />
            <PushNotificationManager />
            <PushNotificationDebug />
          </div>
        )}
        
        {/* Show AuthForm if not authenticated, otherwise show main app */}
        {!user ? (
          <AuthForm />
        ) : (
          <div className="w-full max-w-sm h-[80vh] max-h-[700px] bg-black rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-gray-700">
            {renderContent()}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;