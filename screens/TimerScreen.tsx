import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SessionConfig } from '../types';
import { NoteIcon, TrackIcon, HomeIcon, ChevronLeftIcon } from '../components/Icons';

interface TimerScreenProps {
  config: SessionConfig;
  timerState: {
    isActive: boolean;
    isBreak: boolean;
    currentSession: number;
    timeRemaining: number;
    madeTime: number;
  };
  setTimerState: React.Dispatch<React.SetStateAction<any>>;
  onBreakStart: () => void;
  onSessionStart: () => void;
  onTimerEnd: () => void;
  onGoHome: () => void;
  onAddNote: (note: string) => void;
  notesCount: number;
  soundEnabled: boolean;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const TimerScreen: React.FC<TimerScreenProps> = ({
  config, timerState, setTimerState, onBreakStart, onSessionStart, onTimerEnd, onGoHome, onAddNote, notesCount, soundEnabled
}) => {
  const { isBreak, currentSession, timeRemaining, madeTime } = timerState;
  const { sessionDuration, breakDuration, sessionCount } = config.timerSettings;
  const totalDuration = isBreak ? breakDuration : sessionDuration;
  
  const [isNoteTaking, setIsNoteTaking] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showTimerEndDialog, setShowTimerEndDialog] = useState(false);
  const [pendingTimerAction, setPendingTimerAction] = useState<(() => void) | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const timerStartTimeRef = useRef<number>(0);
  const isPageVisibleRef = useRef<boolean>(true);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current && soundEnabled) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
            console.warn("Notification sound playback failed.", error);
        });
    }
  }, [soundEnabled]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      
      if (timerState.isActive && !document.hidden) {
        // App came back to foreground, recalculate timer
        const currentTime = Date.now();
        const elapsedSinceStart = Math.floor((currentTime - timerStartTimeRef.current) / 1000);
        const expectedRemaining = Math.max(0, totalDuration - elapsedSinceStart);
        
        setTimerState((prev: any) => ({
          ...prev,
          timeRemaining: expectedRemaining,
          madeTime: Math.min(elapsedSinceStart, totalDuration)
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerState.isActive, totalDuration, setTimerState]);

  // Reset timer start time when timer becomes inactive
  useEffect(() => {
    if (!timerState.isActive) {
      timerStartTimeRef.current = 0;
    }
  }, [timerState.isActive]);


  useEffect(() => {
    if (!timerState.isActive) return;
    
    // Record start time when timer becomes active
    if (timerStartTimeRef.current === 0) {
      timerStartTimeRef.current = Date.now();
    }
    
    let animationFrameId: number;
    let lastUpdateTime = Date.now();
    
    const updateTimer = () => {
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - lastUpdateTime) / 1000);
      
      if (elapsedSeconds >= 1) {
        setTimerState((prev: any) => {
          if (prev.timeRemaining > 0) {
            const newTimeRemaining = Math.max(0, prev.timeRemaining - elapsedSeconds);
            const newMadeTime = prev.madeTime + elapsedSeconds;
            
            return { 
              ...prev, 
              timeRemaining: newTimeRemaining, 
              madeTime: newMadeTime 
            };
          }
          return prev;
        });
        
        lastUpdateTime = currentTime;
      }
      
      animationFrameId = requestAnimationFrame(updateTimer);
    };
    
    animationFrameId = requestAnimationFrame(updateTimer);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [timerState.isActive, setTimerState]);

  useEffect(() => {
    if (timeRemaining <= 0 && timerState.isActive) {
      // Send message to service worker for background notification
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'TIMER_END',
          isBreak: isBreak,
          currentSession: currentSession,
          sessionCount: sessionCount
        });
      }
      
      // Show notification if app is in background
      if (document.hidden) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Sterodoro Timer', {
            body: `${isBreak ? 'Break' : 'Session'} completed!`,
            icon: '/icon-192.png',
            tag: 'timer-end',
            requireInteraction: true
          });
        }
      }
      
      // Add vibration for iOS (works even in background)
      if ('vibrate' in navigator) {
        try {
          // Vibrate pattern: 3 short vibrations
          navigator.vibrate([200, 100, 200, 100, 200]);
        } catch (error) {
          console.log('Vibration not supported or failed:', error);
        }
      }

      // If user is writing a note, handle it gracefully
      if (isNoteTaking && noteText.trim()) {
        setShowTimerEndDialog(true);
        if (isBreak) {
          setPendingTimerAction(() => () => {
            if (currentSession < sessionCount) {
              onSessionStart();
            } else {
              onTimerEnd();
            }
          });
        } else {
          setPendingTimerAction(() => () => {
            if (currentSession < sessionCount && breakDuration > 0) {
              onBreakStart();
            } else if (currentSession >= sessionCount) {
              onTimerEnd();
            } else {
              onSessionStart();
            }
          });
        }
        return;
      }

      // Normal flow when not writing a note
      if (isBreak) {
        // Break ended
        if (currentSession < sessionCount) {
          onSessionStart();
        } else {
          onTimerEnd();
        }
      } else {
        // Session ended
        // Don't go to break if it's the last session
        if (currentSession < sessionCount && breakDuration > 0) {
           onBreakStart();
        } else if (currentSession >= sessionCount) {
            onTimerEnd();
        } else { // Handle case with no breaks
            onSessionStart();
        }
      }
    }
  }, [timeRemaining, timerState.isActive, isBreak, currentSession, sessionCount, breakDuration, onSessionStart, onTimerEnd, onBreakStart, isNoteTaking, noteText]);

  const progress = useMemo(() => {
      if (totalDuration === 0) return 0;
      return (madeTime / totalDuration) * 100;
  }, [madeTime, totalDuration]);

  const handleSaveNote = () => {
    if (noteText.trim()) {
      onAddNote(noteText.trim());
      setNoteText('');
    }
    setIsNoteTaking(false);
  };

  const handleSaveAndContinue = () => {
    if (noteText.trim()) {
      onAddNote(noteText.trim());
      setNoteText('');
    }
    setIsNoteTaking(false);
    setShowTimerEndDialog(false);
    if (pendingTimerAction) {
      pendingTimerAction();
      setPendingTimerAction(null);
    }
  };

  const handleDiscardAndContinue = () => {
    setNoteText('');
    setIsNoteTaking(false);
    setShowTimerEndDialog(false);
    if (pendingTimerAction) {
      pendingTimerAction();
      setPendingTimerAction(null);
    }
  };

  const handleCancelTimerEnd = () => {
    setShowTimerEndDialog(false);
    setPendingTimerAction(null);
  };

  if (isNoteTaking) {
    return (
      <div className="flex flex-col h-full bg-black text-white animate-fade-in">
        <header className="p-4 border-b border-gray-800 flex items-center justify-center relative sticky top-0 bg-black z-10">
          <button onClick={() => setIsNoteTaking(false)} className="absolute left-4 p-2 rounded-full hover:bg-gray-800 transition-colors" aria-label="Back to timer">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Add Session Note</h1>
          {showTimerEndDialog && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                TIMER ENDED
              </div>
            </div>
          )}
        </header>
        <main className="flex-grow p-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full h-full bg-gray-800 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Add a timestamped note for your session..."
            autoFocus
          />
        </main>
        <footer className="p-4 border-t border-gray-800">
          <button onClick={handleSaveNote} className="w-full p-4 rounded-xl bg-indigo-600 text-white font-bold text-lg transition-colors hover:bg-indigo-700">
            Save Note
          </button>
        </footer>

        {/* Timer End Dialog */}
        {showTimerEndDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-white mb-4">
                Timer Ended
              </h3>
              <p className="text-gray-300 mb-6">
                Your {isBreak ? 'break' : 'session'} has ended while you were writing a note. What would you like to do?
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleSaveAndContinue}
                  className="w-full p-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Save Note & Continue
                </button>
                <button
                  onClick={handleDiscardAndContinue}
                  className="w-full p-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Discard Note & Continue
                </button>
                <button
                  onClick={handleCancelTimerEnd}
                  className="w-full p-3 bg-transparent text-gray-400 border border-gray-600 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <audio ref={audioRef} src="/sound.mp3" preload="auto" style={{ display: 'none' }} />
      <header className="p-4 text-center">
        <h2 className="text-gray-400">{config.activity.name}</h2>
        <h1 className="text-2xl font-bold">{isBreak ? 'Break' : `Session ${currentSession}/${sessionCount}`}</h1>

      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {isBreak ? (
          <div className="w-full space-y-4 flex flex-col items-center">
             <div className="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className="absolute h-4 bg-green-500 rounded-l-full rounded-r-full"
                    style={{ width: `${progress}%`, transition: 'width 1s linear'}}
                ></div>
             </div>
             <p className="text-6xl font-mono text-center pt-4">{formatTime(timeRemaining)}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full">
            <p className="text-6xl font-mono">{formatTime(timeRemaining)}</p>
            <p className="text-gray-400 text-sm mb-6">{formatTime(madeTime)} / {formatTime(totalDuration)}</p>
            
            <div className="w-full max-w-xs flex flex-wrap gap-1.5 justify-center">
                {Array.from({ length: totalDuration > 0 ? totalDuration : 0 }).map((_, i) => {
                    const second = i + 1;
                    let state = 'future';
                    if (second <= madeTime) {
                        state = 'done';
                    } else if (second === madeTime + 1 && timeRemaining > 0) {
                        state = 'current';
                    }

                    let cubeClass = 'w-4 h-4 rounded-sm';
                    if(state === 'done') {
                        cubeClass += ' bg-indigo-500';
                    } else if (state === 'current') {
                        cubeClass += ' border-2 border-dashed border-indigo-500 animate-pulse';
                    } else {
                        cubeClass += ' border border-gray-700';
                    }

                    return (
                        <div
                            key={i}
                            className={cubeClass}
                        />
                    );
                })}
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 border-t border-gray-800">
        <div className="flex justify-around items-center p-2 bg-gray-900 rounded-xl">
          <button onClick={() => setIsNoteTaking(true)} className="relative flex flex-col items-center text-gray-400 hover:text-white transition-colors">
            {notesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                    {notesCount}
                </span>
            )}
            <NoteIcon className="w-7 h-7" />
            <span className="text-xs mt-1">Note</span>
          </button>
          <button onClick={onBreakStart} className="flex flex-col items-center text-gray-400 hover:text-white transition-colors disabled:opacity-50" disabled={isBreak || !config.trackerSettings.selectedTrackerId}>
            <TrackIcon className="w-7 h-7" />
            <span className="text-xs mt-1">Track</span>
          </button>
          {!timerState.isActive && (
            <button 
              onClick={playNotificationSound} 
              disabled={!soundEnabled}
              className={`flex flex-col items-center transition-colors ${soundEnabled ? 'text-gray-400 hover:text-white' : 'text-gray-600'}`}
            >
              <span className="text-2xl">🔊</span>
              <span className="text-xs mt-1">Test</span>
            </button>
          )}
          <button onClick={onGoHome} className="flex flex-col items-center text-gray-400 hover:text-white transition-colors">
            <HomeIcon className="w-7 h-7" />
            <span className="text-xs mt-1">Home</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default TimerScreen;
