
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SessionConfig, PerformanceUpdate, SessionLog, ActivityObject, SessionNote, TrackerEntry, IntakeObject, IntakeLog, IntakeUnit, AppLog, ReadingObject, ReadingLog, NoteLog, ActivityCategory } from './types';
import { ACTIVITIES, INTAKE_OBJECTS, READING_OBJECTS } from './constants';
import SetupScreen from './screens/SetupScreen';
import TimerScreen from './screens/TimerScreen';
import TrackerScreen from './screens/TrackerScreen';
import HistoryScreen from './screens/HistoryScreen';
import NotePromptScreen from './screens/NotePromptScreen';
import AuthForm from './components/AuthForm';

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

      // Load user-created activities
      const savedActivities = localStorage.getItem('sterodoro-user-activities');
       if (savedActivities) {
        const userActivities = JSON.parse(savedActivities);
        setActivities(prev => [...prev.filter(p => !p.id.startsWith('user-')), ...userActivities]);
      }
      
      // Load user-created intakes
      const savedIntakes = localStorage.getItem('sterodoro-user-intakes');
      if (savedIntakes) {
        const userIntakes = JSON.parse(savedIntakes);
        setIntakes(prev => [...prev.filter(p => !p.id.startsWith('user-')), ...userIntakes]);
      }
      
      // Load user-created reading objects
      const savedReadingObjects = localStorage.getItem('sterodoro-user-reading-objects');
      if (savedReadingObjects) {
          const userReadingObjects = JSON.parse(savedReadingObjects);
          setReadingObjects(prev => [...prev.filter(p => !p.id.startsWith('user-')), ...userReadingObjects]);
      }
    } catch (error) {
      console.error("Failed to load data from local storage", error);
    }
  }, []);

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
  }, []);

  const saveSessionLog = useCallback((finalPerformanceLogs: PerformanceUpdate[], finalNotes: SessionNote[]) => {
    if (config) {
      const endTime = Date.now();
      const endTimeISO = new Date(endTime).toISOString();
      const activityName = config.activity.name.replace(/\s+/g, '_');
      
      const newLog: SessionLog = {
        id: `${endTimeISO}_${activityName}`,
        TimeStart: new Date(timerState.startTime).toISOString(),
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
          timestamp: new Date(pLog.timestamp).toISOString(),
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
          timestamp: new Date(endTime).toISOString(),
          metrics: trackerMetrics,
      }] : [];

      const notes: SessionNote[] = (noteText && noteText.trim()) ? [{
          timestamp: new Date(endTime).toISOString(),
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
      startTime: Date.now(),
    });
    setPerformanceLogs([]);
    setSessionNotes([]);
    setIsFinalTracking(false);
    setView('TIMER');
  }, []);

  const handleBreakStart = useCallback(() => {
    if (!config) return;
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
  }, [config]);

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
  }, [config]);
  
  const handleTimerEnd = useCallback(() => {
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
  }, [config, performanceLogs, sessionNotes, saveSessionLog]);
  
  const handleAddNote = useCallback((noteText: string) => {
    const newNote: SessionNote = {
        timestamp: new Date().toISOString(),
        note: noteText,
    };
    setSessionNotes(prevNotes => [...prevNotes, newNote]);
  }, []);

  const handleSavePromptedNote = useCallback((noteText: string) => {
    const newNote: SessionNote = {
        timestamp: new Date().toISOString(),
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
  
  const handleAddNewActivity = useCallback((newActivity: Omit<ActivityObject, 'id'>) => {
      const fullActivity: ActivityObject = {
          ...newActivity,
          id: `user-${Date.now()}`
      };
      setActivities(prev => {
          const updated = [...prev, fullActivity];
          try {
              const userActivities = updated.filter(a => a.id.startsWith('user-'));
              localStorage.setItem('sterodoro-user-activities', JSON.stringify(userActivities));
          } catch (e) {
              console.error("Failed to save new activity", e);
          }
          return updated;
      });
      return fullActivity;
  }, []);

  const handleAddNewIntake = useCallback((newIntake: Omit<IntakeObject, 'id'>): IntakeObject => {
    const fullIntake: IntakeObject = {
        ...newIntake,
        id: `user-${Date.now()}`
    };
    setIntakes(prev => {
        const updated = [...prev, fullIntake];
        try {
            const userIntakes = updated.filter(a => a.id.startsWith('user-'));
            localStorage.setItem('sterodoro-user-intakes', JSON.stringify(userIntakes));
        } catch (e) {
            console.error("Failed to save new intake", e);
        }
        return updated;
    });
    return fullIntake;
  }, []);

  const handleLogIntake = useCallback((data: Array<{
    intakeObject: IntakeObject;
    quantity: number;
    unit: IntakeUnit;
    timestamp: string;
  }>) => {
    const newLogs: IntakeLog[] = data.map(item => ({
        id: `${new Date(item.timestamp).toISOString()}_${item.intakeObject.name.replace(/\s+/g, '_')}_${Math.random().toString(36).slice(2)}`,
        timestamp: new Date(item.timestamp).toISOString(),
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
  }, []);
  
  const handleAddNewReadingObject = useCallback((newReadingObject: Omit<ReadingObject, 'id'>): ReadingObject => {
    const fullReadingObject: ReadingObject = {
        ...newReadingObject,
        id: `user-${Date.now()}`
    };
    setReadingObjects(prev => {
        const updated = [...prev, fullReadingObject];
        try {
            const userReadingObjects = updated.filter(a => a.id.startsWith('user-'));
            localStorage.setItem('sterodoro-user-reading-objects', JSON.stringify(userReadingObjects));
        } catch (e) {
            console.error("Failed to save new reading object", e);
        }
        return updated;
    });
    return fullReadingObject;
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
          timestamp: new Date(endTime).toISOString(),
          metrics: trackerMetrics,
      }] : [];

      const notes: SessionNote[] = (noteText && noteText.trim()) ? [{
          timestamp: new Date(endTime).toISOString(),
          note: noteText.trim(),
      }] : [];

      const newLog: ReadingLog = {
          id: `${new Date(endTime).toISOString()}_${readingObject.bookName.replace(/\s+/g, '_')}`,
          TimeStart: new Date(startTime).toISOString(),
          TimeEnd: new Date(endTime).toISOString(),
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
  }, []);

  const handleLogNote = useCallback((data: {
    title?: string;
    content: string;
    timestamp: string;
    trackerMetrics?: Record<string, number>;
    relatedActivities?: Pick<ActivityObject, 'id' | 'name' | 'category'>[];
  }) => {
    const { title, content, timestamp, trackerMetrics, relatedActivities } = data;

    const trackerEntries: TrackerEntry[] = trackerMetrics ? [{
        timestamp: new Date(timestamp).toISOString(),
        metrics: trackerMetrics,
    }] : [];

    const newLog: NoteLog = {
        id: `${new Date(timestamp).toISOString()}_${(title || 'note').replace(/\s+/g, '_')}_${Math.random().toString(36).slice(2)}`,
        timestamp: new Date(timestamp).toISOString(),
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
  }, []);

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
          />
        );
      case 'TRACKER':
        return config && <TrackerScreen activities={activities} config={config} onSave={handleTrackerSave} isFinalTracking={isFinalTracking} />;
      case 'PROMPT_NOTE':
        return <NotePromptScreen onSave={handleSavePromptedNote} onCancel={handleCancelPromptNote} isFinalNote={isFinalTracking} />;
      case 'HISTORY':
        return <HistoryScreen logs={allLogs} onBack={handleGoHome} />;
      case 'SETUP':
      default:
        return <SetupScreen 
          onStartTimer={handleStartTimer} 
          onLogActivity={handleLogActivity} 
          onShowHistory={handleShowHistory} 
          activities={activities} 
          onAddNewActivity={handleAddNewActivity}
          intakes={intakes}
          onAddNewIntake={handleAddNewIntake}
          onLogIntake={handleLogIntake}
          readingObjects={readingObjects}
          onAddNewReadingObject={handleAddNewReadingObject}
          onLogReading={handleLogReading}
          onLogNote={handleLogNote}
        />;
    }
  };

  return (
    <>
      {!user ? (
        <AuthForm />
      ) : (
        <div className="bg-gray-900 text-gray-50 min-h-screen font-sans flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm h-[80vh] max-h-[700px] bg-black rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-gray-700">
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
};

export default App;