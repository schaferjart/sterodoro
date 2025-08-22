
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { formatDateForInput, getCurrentLocalTime } from '../lib/time-utils';
import { ActivityCategory, ActivityObject, SessionConfig, TrackerFrequency, IntakeObject, IntakeType, IntakeUnit, ReadingObject, AppLog, SessionLog, IntakeLog, ReadingLog, NoteLog } from '../types';
import { TRACKERS } from '../constants';

import Slider from '../components/Slider';
import GlobalStyles from '../components/GlobalStyles';


type IntakeLogPayload = {
    intakeObject: IntakeObject;
    quantity: number;
    unit: IntakeUnit;
    timestamp: string;
};

type ReadingLogPayload = {
    readingObject: ReadingObject;
    startTime: string;
    endTime: string;
    trackerMetrics?: Record<string, number>;
    noteText?: string;
}

type NoteLogPayload = {
    title?: string;
    content: string;
    timestamp: string;
    trackerMetrics?: Record<string, number>;
    relatedActivities?: Pick<ActivityObject, 'id' | 'name' | 'category'>[];
}

interface SetupScreenProps {
  onStartTimer: (config: SessionConfig) => void;
  onLogActivity: (data: {
      activity: ActivityObject;
      startTime: string;
      endTime: string;
      trackerMetrics?: Record<string, number>;
      noteText?: string;
  }) => void;
  onLogIntake: (data: IntakeLogPayload[]) => void;
  onLogReading: (data: ReadingLogPayload) => void;
  onLogNote: (data: NoteLogPayload) => void;
  activities: ActivityObject[];
  onAddNewActivity: (newActivity: Omit<ActivityObject, 'id'>) => Promise<ActivityObject>;
  onDeleteActivity: (id: string) => Promise<void>;
  intakes: IntakeObject[];
  onAddNewIntake: (newIntake: Omit<IntakeObject, 'id'>) => Promise<IntakeObject>;
  onDeleteIntake: (id: string) => Promise<void>;
  readingObjects: ReadingObject[];
  onAddNewReadingObject: (newReadingObject: Omit<ReadingObject, 'id'>) => Promise<ReadingObject>;
  onDeleteReadingObject: (id: string) => Promise<void>;
  soundEnabled: boolean;
  onSoundEnabledChange: (enabled: boolean) => void;
  userEmail?: string;
  logs: AppLog[];
  onDeleteSessionLog: (id: string) => Promise<void>;
  onDeleteIntakeLog: (id: string) => Promise<void>;
  onDeleteReadingLog: (id: string) => Promise<void>;
  onDeleteNoteLog: (id: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

const formatDateTime = (timestamp: string | number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (seconds: number): string => {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m}min` : `${m}m ${s}s`;
  }
  return `${seconds}s`;
};

const formatDurationMs = (ms: number) => {
  if (!ms || ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const InputField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
}> = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div>
        <label className="block text-sm font-medium text-theme-text mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-theme-surface text-theme-text p-2 rounded-lg border border-theme-border focus:outline-none focus:ring-2 focus:ring-theme-border focus:border-theme-border modal-input"
        />
    </div>
);

const DateTimeField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
    <div className="flex-1">
        <label className="block text-sm font-medium text-theme-text mb-1">{label}</label>
        <input
            type="datetime-local"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-theme-surface text-theme-text p-2 rounded-lg border border-theme-border focus:outline-none focus:ring-2 focus:ring-theme-border focus:border-theme-border modal-input"
        />
    </div>
);

const DateTimeButton: React.FC<{
    value: string;
    onChange: (value: string) => void;
    label: string;
    isExpanded: boolean;
    onToggle: () => void;
}> = ({ value, label, isExpanded, onToggle }) => {
    // Format the datetime value for display
    const formatDateTime = (dateTimeString: string) => {
        if (!dateTimeString) {
            const now = new Date();
            // Default start time to 1 hour ago, end time to now
            const defaultTime = label === "Start Time" 
                ? new Date(now.getTime() - 60 * 60 * 1000) 
                : now;
            return {
                time: defaultTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                date: defaultTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')
            };
        }
        
        const date = new Date(dateTimeString);
        return {
            time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')
        };
    };
    
    const { time, date } = formatDateTime(value);
  
        return (
        <div className="flex-1">
            <button
                type="button"
                onClick={onToggle}
                className={`w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${isExpanded ? 'btn-selected' : 'btn-unselected'}`}
            >
                <div className="leading-tight">
                    <div className="font-medium">{time}</div>
                    <div className="text-xs opacity-75">{date}</div>
          </div>
            </button>
      </div>
    );
};



const DetailItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <p className="text-theme-text">
      <span className="font-semibold text-theme-text opacity-70">{label}:</span> {value}
    </p>
  );
};



const SessionLogItem: React.FC<{ log: SessionLog; onDelete: (id: string) => Promise<void>; deleteProtectionEnabled: boolean }> = ({ log, onDelete, deleteProtectionEnabled }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const durationMs = new Date(log.TimeEnd).getTime() - new Date(log.TimeStart).getTime();

  return (
    <li className="bg-theme-surface rounded-lg overflow-hidden transition-all duration-300 border border-theme-border">
      <div className="flex justify-between items-center p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 text-left flex justify-between items-center"
          aria-expanded={isExpanded}
        >
          <div>
            <p className="text-theme-text">{log.Object.name}</p>
            <p className="text-xs sm:text-sm text-theme-text opacity-70">{formatDateTime(log.TimeStart)}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-theme-text">{formatDurationMs(durationMs)}</p>
          </div>
        </button>
        {!deleteProtectionEnabled && (
        <button
          onClick={() => {
            if (confirm(`Delete this session log for "${log.Object.name}"?`)) {
              onDelete(log.id);
            }
          }}
          className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
          title="Delete log"
        >
          ×
        </button>
        )}
      </div>
      {isExpanded && (
        <div className="p-3 border-t border-theme-border bg-theme-surface/50 space-y-2 animate-fade-in text-xs sm:text-sm">
          <div>
            <h4 className="font-bold text-theme-text mb-1">Details</h4>
            <div className="pl-4 border-l-2 border-theme-border space-y-1 text-xs sm:text-sm">
              <DetailItem label="Category" value={log.Object.type} />
              <DetailItem label="Sub-Activity" value={log.Object.subActivity} />
              <DetailItem label="Sub-Sub-Activity" value={log.Object.subSubActivity} />
              <DetailItem label="Info" value={log.Object.info} />
            </div>
          </div>
          
          {log.Notes.length > 0 && (
            <div>
              <h4 className="text-theme-text mb-1 text-xs sm:text-sm">Notes ({log.Notes.length})</h4>
              <ul className="pl-4 border-l-2 border-theme-border space-y-2 text-xs sm:text-sm">
                {log.Notes.map((note) => (
                    <li key={note.timestamp}>
                        <p className="text-theme-text opacity-70 font-mono">{formatDateTime(note.timestamp)}</p>
                        <p className="text-theme-text whitespace-pre-wrap">{note.note}</p>
                    </li>
                ))}
              </ul>
            </div>
          )}

          {log.TrackerAndMetric.length > 0 && (
            <div>
              <h4 className="text-theme-text mb-1 text-xs sm:text-sm">Performance</h4>
              <ul className="pl-4 border-l-2 border-theme-border space-y-2 text-xs sm:text-sm">
                {log.TrackerAndMetric.map((entry, i) => (
                  <li key={entry.timestamp}>
                     <p className="text-theme-text opacity-70 font-semibold">Break {i+1} @ {formatDateTime(entry.timestamp)}</p>
                     <p className="text-theme-text">{Object.entries(entry.metrics).map(([key, val]) => `${key}: ${val}/10`).join(' • ')}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
};

const IntakeLogItem: React.FC<{ log: IntakeLog; onDelete: (id: string) => Promise<void>; deleteProtectionEnabled: boolean }> = ({ log, onDelete, deleteProtectionEnabled }) => {
    const [isExpanded, setIsExpanded] = useState(false);
  
    return (
    <li className="bg-theme-surface rounded-lg overflow-hidden transition-all duration-300 border border-theme-border">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 text-left flex justify-between items-center"
            aria-expanded={isExpanded}
          >
            <div>
              <p className="text-theme-text">{log.intake.name}</p>
              <p className="text-xs sm:text-sm text-theme-text opacity-70">{formatDateTime(log.timestamp)}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-theme-text">{log.quantity} {log.unit}</p>
            </div>
          </button>
          {!deleteProtectionEnabled && (
          <button
            onClick={() => {
              if (confirm(`Delete this intake log for "${log.intake.name}"?`)) {
                onDelete(log.id);
              }
            }}
            className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
            title="Delete log"
          >
            ×
          </button>
        )}
        </div>
        {isExpanded && (
          <div className="p-3 border-t border-theme-border bg-theme-surface/50 space-y-2 animate-fade-in text-xs sm:text-sm">
            <div>
              <h4 className="text-theme-text mb-1 text-xs sm:text-sm">Details</h4>
              <div className="pl-4 border-l-2 border-theme-border space-y-1 text-xs sm:text-sm">
                <DetailItem label="Type" value={log.intake.type} />
                <DetailItem label="Info" value={log.intake.info} />
              </div>
            </div>
          </div>
        )}
      </li>
    );
};

const ReadingLogItem: React.FC<{ log: ReadingLog; onDelete: (id: string) => Promise<void>; deleteProtectionEnabled: boolean }> = ({ log, onDelete, deleteProtectionEnabled }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const durationMs = new Date(log.TimeEnd).getTime() - new Date(log.TimeStart).getTime();
  
    return (
    <li className="bg-theme-surface rounded-lg overflow-hidden transition-all duration-300 border border-theme-border">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 text-left flex justify-between items-center"
            aria-expanded={isExpanded}
          >
            <div>
              <p className="text-theme-text">{log.Object.bookName}</p>
              <p className="text-xs sm:text-sm text-theme-text opacity-70">{log.Object.author}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-theme-text">{formatDurationMs(durationMs)}</p>
              <p className="text-xs sm:text-sm text-theme-text opacity-70">{formatDateTime(log.TimeStart)}</p>
            </div>
          </button>
          {!deleteProtectionEnabled && (
          <button
            onClick={() => {
              if (confirm(`Delete this reading log for "${log.Object.bookName}"?`)) {
                onDelete(log.id);
              }
            }}
            className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
            title="Delete log"
          >
            ×
          </button>
        )}
        </div>
        {isExpanded && (
            <div className="p-3 border-t border-theme-border bg-theme-surface/50 space-y-2 animate-fade-in text-xs sm:text-sm">
            <div>
                <h4 className="text-theme-text mb-1 text-xs sm:text-sm">Details</h4>
                <div className="pl-4 border-l-2 border-theme-border space-y-1 text-xs sm:text-sm">
                    <DetailItem label="Year" value={log.Object.year} />
                    <DetailItem label="Info" value={log.Object.info} />
                </div>
            </div>
            
            {log.Notes.length > 0 && (
              <div>
                <h4 className="text-theme-text mb-1 text-xs sm:text-sm">Notes ({log.Notes.length})</h4>
                <ul className="pl-4 border-l-2 border-theme-border space-y-2 text-xs sm:text-sm">
                  {log.Notes.map((note) => (
                      <li key={note.timestamp}>
                          <p className="text-theme-text opacity-70 font-mono">{formatDateTime(note.timestamp)}</p>
                          <p className="text-theme-text whitespace-pre-wrap">{note.note}</p>
                      </li>
                  ))}
                </ul>
              </div>
            )}

            {log.TrackerAndMetric.length > 0 && (
              <div>
                <h4 className="text-theme-text mb-1 text-xs sm:text-sm">Performance</h4>
                <ul className="pl-4 border-l-2 border-theme-border space-y-2 text-xs sm:text-sm">
                  {log.TrackerAndMetric.map((entry) => (
                    <li key={entry.timestamp}>
                       <p className="text-theme-text opacity-70 font-semibold">Entry @ {formatDateTime(entry.timestamp)}</p>
                       <p className="text-theme-text">{Object.entries(entry.metrics).map(([key, val]) => `${key}: ${val}/10`).join(' • ')}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </li>
    );
};

const NoteLogItem: React.FC<{ log: NoteLog; onDelete: (id: string) => Promise<void>; deleteProtectionEnabled: boolean }> = ({ log, onDelete, deleteProtectionEnabled }) => {
    const [isExpanded, setIsExpanded] = useState(false);
  
    return (
    <li className="bg-theme-surface rounded-lg overflow-hidden transition-all duration-300 border border-theme-border">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 text-left flex justify-between items-center"
            aria-expanded={isExpanded}
          >
            <div>
              <p className="text-theme-text">{log.title || 'Untitled Note'}</p>
              <p className="text-xs sm:text-sm text-theme-text opacity-70">{formatDateTime(log.timestamp)}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-theme-text">{log.content.length} chars</p>
            </div>
          </button>
          {!deleteProtectionEnabled && (
          <button
            onClick={() => {
              if (confirm(`Delete this note log?`)) {
                onDelete(log.id);
              }
            }}
            className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
            title="Delete log"
          >
            ×
          </button>
        )}
        </div>
        {isExpanded && (
          <div className="p-3 border-t border-theme-border bg-theme-surface/50 space-y-2 animate-fade-in text-xs sm:text-sm">
            <div>
              <h4 className="text-theme-text mb-1 text-xs sm:text-sm">Content</h4>
              <div className="pl-4 border-l-2 border-theme-border">
                <p className="text-theme-text whitespace-pre-wrap text-xs sm:text-sm">{log.content}</p>
              </div>
            </div>
            
            {log.TrackerAndMetric.length > 0 && (
              <div>
                <h4 className="text-theme-text mb-1 text-xs sm:text-sm">Performance</h4>
                <ul className="pl-4 border-l-2 border-theme-border space-y-2 text-xs sm:text-sm">
                  {log.TrackerAndMetric.map((entry) => (
                    <li key={entry.timestamp}>
                       <p className="text-theme-text opacity-70 font-semibold">Entry @ {formatDateTime(entry.timestamp)}</p>
                       <p className="text-theme-text">{Object.entries(entry.metrics).map(([key, val]) => `${key}: ${val}/10`).join(' • ')}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </li>
    );
};

const SetupScreen: React.FC<SetupScreenProps> = ({ soundEnabled, onSoundEnabledChange, userEmail, ...props }) => {
  const { onStartTimer, onLogActivity, onLogIntake, onLogReading, onLogNote, activities, onAddNewActivity, onDeleteActivity, intakes, onAddNewIntake, onDeleteIntake, readingObjects, onAddNewReadingObject, onDeleteReadingObject, logs, onDeleteSessionLog, onDeleteIntakeLog, onDeleteReadingLog, onDeleteNoteLog, onLogout } = props;
  const [mode, setMode] = useState<'TIMER' | 'RECORD' | 'INTAKE' | 'READING' | 'NOTE' | 'DATA' | 'SETTINGS' | null>(null);
  // Simplified theme - no state needed, uses CSS variables
  
  // Activity states
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityObject | null>(null);
  // const [isAddingActivity, setIsAddingActivity] = useState(false); // TODO: Will be re-added for inline forms

  // Timer mode state
  const [sessionDuration, setSessionDuration] = useState(1500); // 25 minutes in seconds
  const [breakDuration, setBreakDuration] = useState(300); // 5 minutes in seconds
  const [sessionCount, setSessionCount] = useState(4);
  const [trackerFrequency, setTrackerFrequency] = useState<TrackerFrequency>('every_break');
  const [activeSlider, setActiveSlider] = useState<'session' | 'break' | 'count' | null>(null);
  
  // Delete protection toggle
  const [deleteProtectionEnabled, setDeleteProtectionEnabled] = useState(() => {
    const saved = localStorage.getItem('deleteProtectionEnabled');
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  const handleDeleteProtectionToggle = () => {
    const newValue = !deleteProtectionEnabled;
    setDeleteProtectionEnabled(newValue);
    localStorage.setItem('deleteProtectionEnabled', JSON.stringify(newValue));
  };

  // Record/Reading mode state
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [noteText, setNoteText] = useState('');
  const [trackerMetrics, setTrackerMetrics] = useState<Record<string, number> | null>(null);
  const [expandedDateTimePicker, setExpandedDateTimePicker] = useState<'start' | 'end' | null>(null);

  // Intake mode state
  const [selectedIntakeIds, setSelectedIntakeIds] = useState<string[]>([]);
  const [intakeTime, setIntakeTime] = useState('');
  const [isAddingIntake, setIsAddingIntake] = useState(false);
  const [newIntakeName, setNewIntakeName] = useState('');
  const [newIntakeType, setNewIntakeType] = useState<IntakeType>(IntakeType.Food);
  const [newIntakeQuantity, setNewIntakeQuantity] = useState('');
  const [newIntakeUnit, setNewIntakeUnit] = useState<IntakeUnit | ''>('');
  const [newIntakeInfo, setNewIntakeInfo] = useState('');
  // Inline dropdown open states for custom button-like selects
  const [isIntakeTypeOpen, setIsIntakeTypeOpen] = useState(false);
  const [isIntakeUnitOpen, setIsIntakeUnitOpen] = useState(false);
  
  // Inline activity form states
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivitySubActivity, setNewActivitySubActivity] = useState('');
  const [newActivitySubSubActivity, setNewActivitySubSubActivity] = useState('');
  const [newActivityInfo, setNewActivityInfo] = useState('');
  
  // Inline reading form states
  const [isAddingReadingObject, setIsAddingReadingObject] = useState(false);
  const [newReadingBookName, setNewReadingBookName] = useState('');
  const [newReadingAuthor, setNewReadingAuthor] = useState('');
  const [newReadingYear, setNewReadingYear] = useState('');
  const [newReadingInfo, setNewReadingInfo] = useState('');
  
  // Reading mode state
  const [selectedReadingObject, setSelectedReadingObject] = useState<ReadingObject | null>(null);

  // Note mode state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteRelatedActivityIds, setNoteRelatedActivityIds] = useState<string[]>([]);

  // Common state
  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);

  const allTrackers = useMemo(() => [ ...TRACKERS, { id: 'note', name: 'Note', metrics: [] } ], []);
  // For timer and record modes, show all activities. For creation, filter by selected category.
  const filteredActivities = useMemo(() => {
    if (mode === 'TIMER' || mode === 'RECORD') {
      return activities; // Show all activities for timer and record modes
    }
    return selectedCategory ? activities.filter(a => a.category === selectedCategory) : [];
  }, [selectedCategory, activities, mode]);
  const groupedActivities = useMemo(() => {
    return activities.reduce((acc, act) => {
        (acc[act.category] = acc[act.category] || []).push(act);
        return acc;
    }, {} as Record<ActivityCategory, ActivityObject[]>);
  }, [activities]);

  // formatDateForInput is now imported from time-utils
  
  const resetForms = useCallback(() => {
    // Only reset category selection for modes that use it (when creating new activities)
    if (mode !== 'TIMER' && mode !== 'RECORD') {
      setSelectedCategory(null);
    }
    setSelectedActivity(null);
    setSelectedReadingObject(null);
          setSessionDuration(1500); // 25 minutes in seconds
      setBreakDuration(300); // 5 minutes in seconds
      setSessionCount(4);
    setTrackerFrequency('every_break');
    setActiveSlider(null);
    setNoteText('');
    setNoteTitle('');
    setNoteContent('');
    setTrackerMetrics(null);
    setSelectedTrackerId(null);
    setNoteRelatedActivityIds([]);
    // Reset activity creation form
    setIsAddingActivity(false);
    setNewActivityName('');
    setNewActivitySubActivity('');
    setNewActivitySubSubActivity('');
    setNewActivityInfo('');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    setEndTime(formatDateForInput(now));
    setStartTime(formatDateForInput(oneHourAgo));
    setSelectedIntakeIds([]);
    setIntakeTime(formatDateForInput(new Date()));
  }, [mode]);

  useEffect(() => {
    resetForms();
  }, [mode, resetForms]);

  // TODO: Will be re-added for inline activity forms
  // const handleAddNewActivityAndSelect = async (activityData: Omit<ActivityObject, 'id' | 'category'>) => { ... }
  
  const handleToggleIntake = (intakeId: string) => {
    const newIds = selectedIntakeIds.includes(intakeId)
        ? selectedIntakeIds.filter(id => id !== intakeId)
        : [...selectedIntakeIds, intakeId];
    
    setSelectedIntakeIds(newIds);
  };

  const handleAddNewIntakeAndSelect = async (intakeData: Omit<IntakeObject, 'id'>) => {
    try {
      const newIntake = await onAddNewIntake(intakeData);
      if (!selectedIntakeIds.includes(newIntake.id)) {
          handleToggleIntake(newIntake.id);
      }
      setIsAddingIntake(false);
    } catch (error) {
      console.error('Failed to add new intake:', error);
      alert('Failed to add new intake. Please try again.');
    }
  };
  
  const handleSaveInlineIntake = async () => {
    if (!newIntakeName.trim() || !newIntakeQuantity || !newIntakeUnit) return;
    
    try {
      const intakeData = {
        name: newIntakeName,
        type: newIntakeType,
        info: newIntakeInfo,
        defaultQuantity: parseFloat(newIntakeQuantity),
        defaultUnit: newIntakeUnit as IntakeUnit,
      };
      
      await handleAddNewIntakeAndSelect(intakeData);
      
      // Reset form and close
      setNewIntakeName('');
      setNewIntakeType(IntakeType.Food);
      setNewIntakeQuantity('');
      setNewIntakeUnit('');
      setNewIntakeInfo('');
      setIsAddingIntake(false);
    } catch (error) {
      console.error('Failed to save inline intake:', error);
    }
  };

  const handleAddNewActivityAndSelect = async (activityData: Omit<ActivityObject, 'id'>) => {
    try {
      const newActivity = await onAddNewActivity(activityData);
      setSelectedActivity(newActivity);
      setIsAddingActivity(false);
    } catch (error) {
      console.error('Failed to add new activity:', error);
      alert('Failed to add new activity. Please try again.');
    }
  };

  const handleSaveInlineActivity = async () => {
    if (!newActivityName.trim() || !selectedCategory) return;
    
    try {
      const activityData = {
        name: newActivityName,
        category: selectedCategory,
        subActivity: newActivitySubActivity || undefined,
        subSubActivity: newActivitySubSubActivity || undefined,
        info: newActivityInfo || undefined,
      };
      
      await handleAddNewActivityAndSelect(activityData);
      
      // Reset form and close
      setNewActivityName('');
      setNewActivitySubActivity('');
      setNewActivitySubSubActivity('');
      setNewActivityInfo('');
      setIsAddingActivity(false);
    } catch (error) {
      console.error('Failed to save inline activity:', error);
    }
  };
  
  const handleAddNewReadingObjectAndSelect = async (readingData: Omit<ReadingObject, 'id'>) => {
    try {
      const newReadingObject = await onAddNewReadingObject(readingData);
      setSelectedReadingObject(newReadingObject);
      setIsAddingReadingObject(false);
    } catch (error) {
      console.error('Failed to add new reading object:', error);
      alert('Failed to add new book. Please try again.');
    }
  };

  const handleSaveInlineReadingObject = async () => {
    if (!newReadingBookName.trim()) return;
    
    try {
      const readingData = {
        bookName: newReadingBookName,
        author: newReadingAuthor,
        year: newReadingYear ? parseInt(newReadingYear) : undefined,
        info: newReadingInfo || undefined,
      };
      
      await handleAddNewReadingObjectAndSelect(readingData);
      
      // Reset form and close
      setNewReadingBookName('');
      setNewReadingAuthor('');
      setNewReadingYear('');
      setNewReadingInfo('');
      setIsAddingReadingObject(false);
    } catch (error) {
      console.error('Failed to save inline reading object:', error);
    }
  };

  const handleToggleNoteActivity = (activityId: string) => {
    setNoteRelatedActivityIds(prev =>
        prev.includes(activityId)
            ? prev.filter(id => id !== activityId)
            : [...prev, activityId]
    );
  };

  const handleTrackerSelect = (id: string) => {
    const newId = selectedTrackerId === id ? null : id;
    setSelectedTrackerId(newId);
    if (mode === 'RECORD' || mode === 'READING' || mode === 'NOTE') {
      if (newId && newId !== 'note') {
        const tracker = TRACKERS.find(t => t.id === newId);
        if (tracker) {
          const initialMetrics = tracker.metrics.reduce((acc, name) => {
            acc[name] = 5; return acc;
          }, {} as Record<string, number>);
          setTrackerMetrics(initialMetrics);
        }
      } else {
        setTrackerMetrics(null);
      }
    }
  };

  const handleMetricChange = (name: string, value: number) => {
    setTrackerMetrics(prev => prev ? { ...prev, [name]: value } : null);
  };

  // Simplified button styling using CSS classes
  const getButtonStyle = (isActive: boolean = false, isDisabled: boolean = false) => {
    if (isDisabled) {
      return 'btn-unselected opacity-50 cursor-not-allowed';
    }
    return isActive ? 'btn-selected' : 'btn-unselected';
  };
  
  const isRecordInvalid = !selectedActivity || !startTime || !endTime || new Date(startTime) >= new Date(endTime);
  const isReadingInvalid = !selectedReadingObject || !startTime || !endTime || new Date(startTime) >= new Date(endTime);
  const isNoteInvalid = !noteContent.trim();
  
  const isIntakeInvalid = useMemo(() => {
    if (selectedIntakeIds.length === 0 || !intakeTime) {
      return true;
    }
    // Defensive check for malformed data from old versions (e.g. in localStorage)
    return selectedIntakeIds.some(id => {
        const intakeObject = intakes.find(i => i.id === id);
        return !intakeObject || intakeObject.defaultQuantity == null || intakeObject.defaultUnit == null;
    });
  }, [selectedIntakeIds, intakeTime, intakes]);

  const handleAction = () => {
    if (mode === 'TIMER') {
        if (!selectedActivity) return;
        onStartTimer({
            activity: selectedActivity,
            timerSettings: { sessionDuration, breakDuration, sessionCount },
            trackerSettings: { selectedTrackerId, frequency: trackerFrequency },
        });
    } else if (mode === 'RECORD') {
        if (isRecordInvalid) return;
        onLogActivity({
            activity: selectedActivity,
            startTime,
            endTime,
            trackerMetrics: trackerMetrics ?? undefined,
            noteText
        });
        resetForms();
        setMode('TIMER');
    } else if (mode === 'INTAKE') {
        if (isIntakeInvalid) return;
        const logsToCreate = selectedIntakeIds.map(id => {
            const intakeObject = intakes.find(i => i.id === id);
            // This is safe because isIntakeInvalid checks for this
            if (!intakeObject) return null;
    
            return {
                intakeObject,
                quantity: intakeObject.defaultQuantity,
                unit: intakeObject.defaultUnit,
                timestamp: intakeTime
            };
        }).filter((log): log is IntakeLogPayload => log !== null);

        if (logsToCreate.length > 0) {
            onLogIntake(logsToCreate);
            // alert(`Logged ${logsToCreate.length} intake(s) successfully!`);
            resetForms();
            setMode('TIMER');
        }
    } else if (mode === 'READING') {
        if (isReadingInvalid) return;
        onLogReading({
            readingObject: selectedReadingObject,
            startTime,
            endTime,
            trackerMetrics: trackerMetrics ?? undefined,
            noteText
        });
        resetForms();
        setMode('TIMER');
    } else if (mode === 'NOTE') {
        if (isNoteInvalid) return;
        const relatedActivities = activities
            .filter(act => noteRelatedActivityIds.includes(act.id))
            .map(act => ({ id: act.id, name: act.name, category: act.category }));

        onLogNote({
            title: noteTitle,
            content: noteContent,
            timestamp: getCurrentLocalTime(),
            trackerMetrics: trackerMetrics ?? undefined,
            relatedActivities: relatedActivities.length > 0 ? relatedActivities : undefined,
        });
        resetForms();
        setMode('TIMER');
    } else if (mode === 'DATA') {
        if (logs.length === 0) return;
        
        try {
            const jsonString = JSON.stringify(logs, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `productivity-logs_${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export logs:", error);
            alert("Could not export logs. See console for details.");
        }
    }
  };
  
  const getActionButtonState = () => {
      switch(mode) {
          case 'TIMER': return { disabled: !selectedActivity, text: 'Start Timer' };
          case 'RECORD': return { disabled: isRecordInvalid, text: 'Log Activity' };
          case 'READING': return { disabled: isReadingInvalid, text: 'Log Reading' };
          case 'NOTE': return { disabled: isNoteInvalid, text: 'Save Note' };
          case 'INTAKE': 
            const num = selectedIntakeIds.length;
            const text = `Log ${num > 0 ? num : ''} Intake${num !== 1 ? 's' : ''}`;
            return { disabled: isIntakeInvalid, text };
          case 'DATA': return { disabled: logs.length === 0, text: 'Export All Data' };
          default: return { disabled: true, text: 'Select Mode' };
      }
  };

  const { disabled: actionButtonDisabled, text: actionButtonText } = getActionButtonState();



  const renderOptionalTrackers = () => (
    <>
      <div className="p-2 sm:p-3 space-y-2">
          
          <div className="grid grid-cols-3 gap-2">
            {TRACKERS.map(tracker => ( 
              <button 
                key={tracker.id} 
                onClick={() => handleTrackerSelect(tracker.id)} 
                className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${getButtonStyle(selectedTrackerId === tracker.id)}`}
              >
                {tracker.name}
              </button>
            ))}
          </div>
      </div>
      {selectedTrackerId && trackerMetrics && (
          <div className="p-2 sm:p-3 space-y-2">
              {(TRACKERS.find(t => t.id === selectedTrackerId)?.name || 'Tracker')}
              <div className="space-y-4 px-2 pt-2">
                  {Object.entries(trackerMetrics).map(([metricName, metricValue]) => (
                      <div key={metricName}>
                          <div className="flex justify-between items-baseline mb-3">
                              <span className="font-semibold">{metricName}</span>
                              <span className="text-indigo-400 font-mono text-lg">{metricValue}/10</span>
                          </div>
                          <Slider min={0} max={10} step={1} value={metricValue} onChange={(value) => handleMetricChange(metricName, value)} label={''} />
                      </div>
                  ))}
              </div>
          </div>
      )}
    </>
  );

  const renderTrackerAndNotes = () => (
      <>
        {renderOptionalTrackers()}
        <div className="p-2 sm:p-3 space-y-2">
            
                            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add notes about this session..." className="w-full h-24 bg-theme-surface text-theme-text p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-border focus:border-theme-border resize-none border border-theme-border" />
        </div>
      </>
  );

  return (
    <>
      <GlobalStyles />
      <div className="flex flex-col min-h-screen relative bg-theme-background text-theme-text safe-area-top safe-area-left safe-area-right">
      {/* Header removed to eliminate unnecessary spacing */}
      
      <main className="flex-1 overflow-y-auto pb-24">
        <div>
          <div className="p-2 sm:p-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setMode('TIMER')} 
                    className={`p-2 sm:p-3 rounded-lg transition-colors text-xs sm:text-sm text-center border btn-mobile ${getButtonStyle(mode === 'TIMER')}`}
                  >
                    Timer
                  </button>
                  <button 
                    onClick={() => setMode('RECORD')} 
                    className={`p-2 sm:p-3 rounded-lg transition-colors text-xs sm:text-sm text-center border btn-mobile ${getButtonStyle(mode === 'RECORD')}`}
                  >
                    Record
                  </button>
                  <button 
                    onClick={() => setMode('INTAKE')} 
                    className={`p-2 sm:p-3 rounded-lg transition-colors text-xs sm:text-sm text-center border btn-mobile ${getButtonStyle(mode === 'INTAKE')}`}
                  >
                    Intake
                  </button>
                  <button 
                    onClick={() => setMode('READING')} 
                    className={`p-2 sm:p-3 rounded-lg transition-colors text-xs sm:text-sm text-center border btn-mobile ${getButtonStyle(mode === 'READING')}`}
                  >
                    Reading
                  </button>
                  <button 
                    onClick={() => setMode('NOTE')} 
                    className={`p-2 sm:p-3 rounded-lg transition-colors text-xs sm:text-sm text-center border btn-mobile ${getButtonStyle(mode === 'NOTE')}`}
                  >
                    Note
                  </button>
                  <div className="p-4 rounded-lg bg-transparent"></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setMode('DATA')} 
                    className={`p-2 sm:p-3 rounded-lg transition-colors text-xs sm:text-sm text-center border btn-mobile ${getButtonStyle(mode === 'DATA')}`}
                  >
                    Data
                  </button>
                  <button 
                    onClick={() => setMode('SETTINGS')} 
                    className={`p-2 sm:p-3 rounded-lg transition-colors text-xs sm:text-sm text-center border btn-mobile ${getButtonStyle(mode === 'SETTINGS')}`}
                  >
                    Settings
                  </button>
                  <div className="p-4 rounded-lg bg-transparent"></div>
              </div>
          </div>
          

          
          {mode === 'INTAKE' ? (
            <>
              <div className="p-2 sm:p-3 space-y-2">
                
                {intakes.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-black mb-2">No intake items yet</p>
                        <button onClick={() => setIsAddingIntake(true)} className={`p-2 sm:p-3 rounded-lg font-bold border btn-mobile ${getButtonStyle(false)}`}>
                            Create Your First Intake Item
                        </button>
                    </div>
                ) : (
                                            <div className="grid grid-cols-3 gap-2">
                            {intakes.map(intake => {
                                const isSelected = selectedIntakeIds.includes(intake.id);
                                return (
                                    <div key={intake.id} className="relative group">
                                        <button 
                                            onClick={() => handleToggleIntake(intake.id)} 
                                            className={`w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center truncate border btn-mobile ${getButtonStyle(isSelected)}`}
                                        >
                                            {intake.name}
                                        </button>
                                        {!deleteProtectionEnabled && (
                                          <button 
                                              onClick={() => {
                                                  if (confirm(`Delete "${intake.name}"? This will permanently delete this intake and ALL intake logs that used it.`)) {
                                                      onDeleteIntake(intake.id);
                                                  }
                                              }}
                                              className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                              title="Delete intake"
                                          >
                                              ×
                                          </button>
                                        )}
                                    </div>
                                )
                            })}
                            <button 
                              onClick={isAddingIntake ? handleSaveInlineIntake : () => setIsAddingIntake(true)} 
                              disabled={isAddingIntake && (!newIntakeName.trim() || !newIntakeQuantity || !newIntakeUnit)}
                              className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${isAddingIntake ? ((!newIntakeName.trim() || !newIntakeQuantity || !newIntakeUnit) ? 'btn-unselected opacity-50 cursor-not-allowed' : 'btn-selected') : getButtonStyle(false)}`}
                            >
                              {isAddingIntake ? 'Save' : 'Other...'}
                            </button>
                        </div>
                )}
                {isAddingIntake && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {/* Name as editable div */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onFocus={e => { if (!newIntakeName) e.currentTarget.textContent = ''; }}
                        onBlur={e => setNewIntakeName(e.currentTarget.textContent || '')}
                        className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                      >
                        {newIntakeName || 'Name'}
                      </div>
                      {/* Type as custom dropdown */}
                      <div className="relative w-full">
                        <button
                          type="button"
                          onClick={() => setIsIntakeTypeOpen(o => !o)}
                          className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                        >
                          {newIntakeType}
                        </button>
                        {isIntakeTypeOpen && (
                          <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-40 overflow-auto">
                            {Object.values(IntakeType).map(t => (
                              <li
                                key={t}
                                onClick={() => { setNewIntakeType(t); setIsIntakeTypeOpen(false); }}
                                className="px-4 py-2 hover:bg-theme-surface/70 cursor-pointer"
                              >
                                {t}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {/* Quantity as editable div */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onFocus={e => { if (!newIntakeQuantity) e.currentTarget.textContent = ''; }}
                        onBlur={e => setNewIntakeQuantity(e.currentTarget.textContent || '')}
                        className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                      >
                        {newIntakeQuantity || 'Quantity'}
                      </div>
                      {/* Unit as custom dropdown */}
                      <div className="relative w-full">
                        <button
                          type="button"
                          onClick={() => setIsIntakeUnitOpen(o => !o)}
                          className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                        >
                          {newIntakeUnit || 'Unit'}
                        </button>
                        {isIntakeUnitOpen && (
                          <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-40 overflow-auto">
                            {Object.values(IntakeUnit).map(u => (
                              <li
                                key={u}
                                onClick={() => { setNewIntakeUnit(u); setIsIntakeUnitOpen(false); }}
                                className="px-4 py-2 hover:bg-theme-surface/70 cursor-pointer"
                              >
                                {u}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {/* Info as editable div */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onFocus={e => { if (!newIntakeInfo) e.currentTarget.textContent = ''; }}
                        onBlur={e => setNewIntakeInfo(e.currentTarget.textContent || '')}
                        className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                      >
                        {newIntakeInfo || 'Info'}
                      </div>
                        </div>
                )}
              </div>
              {selectedIntakeIds.length > 0 && (
                <div className="p-2 sm:p-3 space-y-2">
                  <DateTimeField label="Time of Intake (for all items)" value={intakeTime} onChange={setIntakeTime} />
                </div>
              )}
            </>
          ) : mode === 'READING' ? (
            <>
              <div className="p-2 sm:p-3 space-y-2">
                  
                  {readingObjects.length === 0 ? (
                      <div className="text-center py-6">
                          <p className="text-black mb-2">No books yet</p>
                          <button 
                            onClick={isAddingReadingObject ? handleSaveInlineReadingObject : () => setIsAddingReadingObject(true)}
                            disabled={isAddingReadingObject && !newReadingBookName.trim()}
                            className={`p-2 sm:p-3 rounded-lg font-bold border btn-mobile ${isAddingReadingObject ? (!newReadingBookName.trim() ? 'btn-unselected opacity-50 cursor-not-allowed' : 'btn-selected') : getButtonStyle(false)}`}
                          >
                            {isAddingReadingObject ? 'Save Book' : 'Add Your First Book'}
                          </button>
                      </div>
                  ) : (
                      <div className="grid grid-cols-3 gap-2">
                          {readingObjects.map(book => (
                              <div key={book.id} className="relative group">
                                  <button 
                                      onClick={() => setSelectedReadingObject(book)} 
                                      className={`w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center truncate border btn-mobile ${getButtonStyle(selectedReadingObject?.id === book.id)}`}
                                  >
                                      {book.bookName}
                                  </button>
                                  {!deleteProtectionEnabled && (
                                    <button 
                                        onClick={() => {
                                            if (confirm(`Delete "${book.bookName}"? This will permanently delete this book and ALL reading logs that used it.`)) {
                                                onDeleteReadingObject(book.id);
                                            }
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete book"
                                    >
                                        ×
                                    </button>
                                  )}
                              </div>
                          ))}
                          <button 
                            onClick={isAddingReadingObject ? handleSaveInlineReadingObject : () => setIsAddingReadingObject(true)}
                            disabled={isAddingReadingObject && !newReadingBookName.trim()}
                            className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${isAddingReadingObject ? (!newReadingBookName.trim() ? 'btn-unselected opacity-50 cursor-not-allowed' : 'btn-selected') : getButtonStyle(false)}`}
                          >
                            {isAddingReadingObject ? 'Save' : 'Other...'}
                          </button>
                      </div>
                  )}
                  {isAddingReadingObject && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {/* Book Name as editable div */}
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onFocus={e => { if (!newReadingBookName) e.currentTarget.textContent = ''; }}
                          onBlur={e => setNewReadingBookName(e.currentTarget.textContent || '')}
                          className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                        >
                          {newReadingBookName || 'Book Name'}
                        </div>
                        {/* Author as editable div */}
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onFocus={e => { if (!newReadingAuthor) e.currentTarget.textContent = ''; }}
                          onBlur={e => setNewReadingAuthor(e.currentTarget.textContent || '')}
                          className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                        >
                          {newReadingAuthor || 'Author'}
                        </div>
                        {/* Year as editable div */}
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onFocus={e => { if (!newReadingYear) e.currentTarget.textContent = ''; }}
                          onBlur={e => setNewReadingYear(e.currentTarget.textContent || '')}
                          className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                        >
                          {newReadingYear || 'Year'}
                        </div>
                        {/* Info as editable div */}
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onFocus={e => { if (!newReadingInfo) e.currentTarget.textContent = ''; }}
                          onBlur={e => setNewReadingInfo(e.currentTarget.textContent || '')}
                          className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                        >
                          {newReadingInfo || 'Info'}
                        </div>
                      </div>
                  )}
              </div>
              {selectedReadingObject && (
                  <>
                    <div className="p-2 sm:p-3 space-y-2">
                      
                      <div className="grid grid-cols-3 gap-2">
                        <DateTimeButton 
                          label="Start Time" 
                          value={startTime} 
                          onChange={setStartTime}
                          isExpanded={expandedDateTimePicker === 'start'}
                          onToggle={() => setExpandedDateTimePicker(expandedDateTimePicker === 'start' ? null : 'start')}
                        />
                        <DateTimeButton 
                          label="End Time" 
                          value={endTime} 
                          onChange={setEndTime}
                          isExpanded={expandedDateTimePicker === 'end'}
                          onToggle={() => setExpandedDateTimePicker(expandedDateTimePicker === 'end' ? null : 'end')}
                        />
                        <button className="p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile btn-unselected">
                          Note
                        </button>
                      </div>
                      
                      {/* Inline Time/Date Pickers */}
                      {expandedDateTimePicker && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {expandedDateTimePicker === 'start' && (
                            <>
                              <input
                                type="time"
                                value={startTime ? new Date(startTime).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5)}
                                onChange={(e) => {
                                  const currentDate = startTime ? new Date(startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                                  setStartTime(`${currentDate}T${e.target.value}`);
                                }}
                                style={{
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'none',
                                  backgroundColor: 'var(--background-unselected)',
                                  color: 'var(--text-color-unselected)',
                                  border: 'var(--stroke-weight-unselected) solid var(--stroke-color-unselected)',
                                  borderRadius: 'var(--radius-lg)',
                                  padding: 'var(--btn-padding)',
                                  transition: 'var(--transition-fast)',
                                  fontFamily: 'inherit',
                                  fontSize: 'inherit',
                                  textAlign: 'center',
                                  width: '100%'
                                }}
                                className="text-xs sm:text-sm"
                              />
                              <input
                                type="date"
                                value={startTime ? new Date(startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                onChange={(e) => {
                                  const currentTime = startTime ? new Date(startTime).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5);
                                  setStartTime(`${e.target.value}T${currentTime}`);
                                }}
                                style={{
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'none',
                                  backgroundColor: 'var(--background-unselected)',
                                  color: 'var(--text-color-unselected)',
                                  border: 'var(--stroke-weight-unselected) solid var(--stroke-color-unselected)',
                                  borderRadius: 'var(--radius-lg)',
                                  padding: 'var(--btn-padding)',
                                  transition: 'var(--transition-fast)',
                                  fontFamily: 'inherit',
                                  fontSize: 'inherit',
                                  textAlign: 'center',
                                  width: '100%'
                                }}
                                className="text-xs sm:text-sm"
                              />
                              <div></div>
                            </>
                          )}
                          {expandedDateTimePicker === 'end' && (
                            <>
                              <input
                                type="time"
                                value={endTime ? new Date(endTime).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5)}
                                onChange={(e) => {
                                  const currentDate = endTime ? new Date(endTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                                  setEndTime(`${currentDate}T${e.target.value}`);
                                }}
                                style={{
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'none',
                                  backgroundColor: 'var(--background-unselected)',
                                  color: 'var(--text-color-unselected)',
                                  border: 'var(--stroke-weight-unselected) solid var(--stroke-color-unselected)',
                                  borderRadius: 'var(--radius-lg)',
                                  padding: 'var(--btn-padding)',
                                  transition: 'var(--transition-fast)',
                                  fontFamily: 'inherit',
                                  fontSize: 'inherit',
                                  textAlign: 'center',
                                  width: '100%'
                                }}
                                className="text-xs sm:text-sm"
                              />
                              <input
                                type="date"
                                value={endTime ? new Date(endTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                onChange={(e) => {
                                  const currentTime = endTime ? new Date(endTime).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5);
                                  setEndTime(`${e.target.value}T${currentTime}`);
                                }}
                                style={{
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'none',
                                  backgroundColor: 'var(--background-unselected)',
                                  color: 'var(--text-color-unselected)',
                                  border: 'var(--stroke-weight-unselected) solid var(--stroke-color-unselected)',
                                  borderRadius: 'var(--radius-lg)',
                                  padding: 'var(--btn-padding)',
                                  transition: 'var(--transition-fast)',
                                  fontFamily: 'inherit',
                                  fontSize: 'inherit',
                                  textAlign: 'center',
                                  width: '100%'
                                }}
                                className="text-xs sm:text-sm"
                              />
                              <div></div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {renderTrackerAndNotes()}
                  </>
              )}
            </>
          ) : mode === 'NOTE' ? (
            <>
              <div className="p-2 sm:p-3 space-y-2">
                
                <InputField label="Title (Optional)" value={noteTitle} onChange={setNoteTitle} placeholder="e.g., Project Ideas" />
                <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Write down your thoughts..." className="w-full h-32 bg-theme-surface text-theme-text p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-border focus:border-theme-border resize-none border border-theme-border" />
              </div>
              <div className="p-2 sm:p-3 space-y-2">
                
                <div className="space-y-2">
                    {Object.entries(groupedActivities).map(([category, acts]) => (
                        <div key={category}>
                            <h4 className="text-theme-text mb-2 text-xs sm:text-sm">{category}</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {acts.map(activity => {
                                    const isSelected = noteRelatedActivityIds.includes(activity.id);
                                    return (
                                        <button key={activity.id} onClick={() => handleToggleNoteActivity(activity.id)} className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center truncate border btn-mobile ${getButtonStyle(isSelected)}`}>{activity.name}</button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
              </div>
              {renderOptionalTrackers()}
            </>
          ) : (
            <>
              {(mode === 'TIMER' || mode === 'RECORD') && (
            <>
              <div className="p-2 sm:p-3 space-y-2">
                
                {filteredActivities.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-black mb-2">No activities yet</p>
                        <button 
                          onClick={() => { setSelectedCategory(ActivityCategory.Work); setIsAddingActivity(true); }}
                          className={`p-2 sm:p-3 rounded-lg font-bold border btn-mobile ${getButtonStyle(false)}`}
                        >
                          Create Your First Activity
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {filteredActivities.map(act => (
                          <div key={act.id} className="relative group">
                            <button 
                              onClick={() => setSelectedActivity(act)} 
                                  className={`w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center truncate border btn-mobile ${getButtonStyle(selectedActivity?.id === act.id)}`}
                            >
                              {act.name}
                            </button>
                            {!deleteProtectionEnabled && (
                              <button 
                                onClick={() => {
                                  if (confirm(`Delete "${act.name}"? This will permanently delete this activity and ALL session logs that used it.`)) {
                                    onDeleteActivity(act.id);
                                  }
                                }}
                                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete activity"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => { setSelectedCategory(ActivityCategory.Work); setIsAddingActivity(true); }} 
                          className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${getButtonStyle(false)}`}
                        >
                          Other...
                        </button>
                    </div>
                )}
                {isAddingActivity && (
                    <>
                      {/* Category Selection for new activity */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="col-span-3 text-xs sm:text-sm text-theme-text opacity-70 mb-2">Select category for new activity:</div>
                        {Object.values(ActivityCategory).map(cat => ( 
                          <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)} 
                            className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${getButtonStyle(selectedCategory === cat)}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      {selectedCategory && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {/* Name as editable div */}
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={e => { if (!newActivityName) e.currentTarget.textContent = ''; }}
                            onBlur={e => setNewActivityName(e.currentTarget.textContent || '')}
                            className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                          >
                            {newActivityName || 'Name'}
                          </div>
                          {/* Sub Activity as editable div */}
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={e => { if (!newActivitySubActivity) e.currentTarget.textContent = ''; }}
                            onBlur={e => setNewActivitySubActivity(e.currentTarget.textContent || '')}
                            className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                          >
                            {newActivitySubActivity || 'Sub Activity'}
                          </div>
                          {/* Sub Sub Activity as editable div */}
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={e => { if (!newActivitySubSubActivity) e.currentTarget.textContent = ''; }}
                            onBlur={e => setNewActivitySubSubActivity(e.currentTarget.textContent || '')}
                            className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                          >
                            {newActivitySubSubActivity || 'Sub Sub Activity'}
                          </div>
                          {/* Info as editable div */}
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={e => { if (!newActivityInfo) e.currentTarget.textContent = ''; }}
                            onBlur={e => setNewActivityInfo(e.currentTarget.textContent || '')}
                            className="w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center truncate border btn-mobile btn-unselected"
                          >
                            {newActivityInfo || 'Info'}
                          </div>
                          <button 
                            onClick={handleSaveInlineActivity} 
                            disabled={!newActivityName.trim()}
                            className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${!newActivityName.trim() ? 'btn-unselected opacity-50 cursor-not-allowed' : 'btn-selected'}`}
                          >
                            Save Activity
                          </button>
                        </div>
                      )}
                    </>
                )}
              </div>
                </>
              )}
              {selectedActivity && mode === 'TIMER' && (
                <>
                  <div className="p-2 sm:p-3 space-y-2">
                      
                      <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => setActiveSlider(activeSlider === 'session' ? null : 'session')} className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${getButtonStyle(activeSlider === 'session' || sessionDuration !== 1500)}`}>
                              {sessionDuration !== 1500 ? `Session ${formatDuration(sessionDuration)}` : 'Session'}
                          </button>
                          <button onClick={() => setActiveSlider(activeSlider === 'break' ? null : 'break')} className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${getButtonStyle(activeSlider === 'break' || breakDuration !== 300)}`}>
                              {breakDuration !== 300 ? `Break ${formatDuration(breakDuration)}` : 'Break'}
                          </button>
                          <button onClick={() => setActiveSlider(activeSlider === 'count' ? null : 'count')} className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${getButtonStyle(activeSlider === 'count' || sessionCount !== 4)}`}>
                              {sessionCount !== 4 ? `Sessions ${sessionCount}` : 'Sessions'}
                          </button>
                      </div>
                      {activeSlider === 'session' && <div className="pt-3"><Slider min={300} max={18000} step={60} value={sessionDuration} onChange={setSessionDuration} label={formatDuration(sessionDuration)} /></div>}
                      {activeSlider === 'break' && <div className="pt-3"><Slider min={60} max={900} step={60} value={breakDuration} onChange={setBreakDuration} label={formatDuration(breakDuration)} /></div>}
                      {activeSlider === 'count' && <div className="pt-3"><Slider min={1} max={10} step={1} value={sessionCount} onChange={setSessionCount} label={`${sessionCount} sessions`} /></div>}
                  </div>
                  <div className="p-2 sm:p-3 space-y-2">
                    
                    <div className="grid grid-cols-3 gap-2">
                      {allTrackers.map(tracker => ( 
                        <button 
                          key={tracker.id} 
                          onClick={() => handleTrackerSelect(tracker.id)} 
                          className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${getButtonStyle(selectedTrackerId === tracker.id)}`}
                        >
                          {tracker.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedTrackerId && (<div className="p-2 sm:p-3 space-y-2">
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setTrackerFrequency('every_break')} className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${getButtonStyle(trackerFrequency === 'every_break')}`}>Every Break</button>
                        <button onClick={() => setTrackerFrequency('end_of_session')} className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${getButtonStyle(trackerFrequency === 'end_of_session')}`}>End of Session</button>
                        <div className="p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center border opacity-50 bg-theme-surface border-theme-border">-</div>
                      </div>
                  </div>)}
                  <div className="p-2 sm:p-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                                  <button 
                                  onClick={() => onSoundEnabledChange(!soundEnabled)}
                          className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${getButtonStyle(soundEnabled)}`}
                              >
                          {soundEnabled ? 'Sound Enabled' : 'Sound Disabled'}
                                  </button>
                      <div></div>
                      <div></div>
                              </div>
                          </div>
                </>
              )}
              {selectedActivity && mode === 'RECORD' && (
                  <>
                    <div className="p-2 sm:p-3 space-y-2">
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedDateTimePicker(expandedDateTimePicker === 'start' ? null : 'start')}
                          className={`w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${expandedDateTimePicker === 'start' ? 'btn-selected' : 'btn-unselected'}`}
                        >
                          <div className="leading-tight">
                            <div className="font-medium">{startTime ? new Date(startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-xs opacity-75">{startTime ? new Date(startTime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-') : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')}</div>
                      </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedDateTimePicker(expandedDateTimePicker === 'end' ? null : 'end')}
                          className={`w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${expandedDateTimePicker === 'end' ? 'btn-selected' : 'btn-unselected'}`}
                        >
                          <div className="leading-tight">
                            <div className="font-medium">{endTime ? new Date(endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-xs opacity-75">{endTime ? new Date(endTime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-') : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')}</div>
                  </div>
                        </button>
                        <button className="p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile btn-unselected">
                          Note
                        </button>
                      </div>
                      
                      {/* Inline Time/Date Pickers */}
                      {expandedDateTimePicker && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {expandedDateTimePicker === 'start' && (
                            <>
                              <input
                                type="time"
                                value={startTime ? new Date(startTime).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5)}
                                onChange={(e) => {
                                  const currentDate = startTime ? new Date(startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                                  setStartTime(`${currentDate}T${e.target.value}`);
                                }}
                                style={{
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'none',
                                  backgroundColor: 'var(--background-unselected)',
                                  color: 'var(--text-color-unselected)',
                                  border: 'var(--stroke-weight-unselected) solid var(--stroke-color-unselected)',
                                  borderRadius: 'var(--radius-lg)',
                                  padding: 'var(--btn-padding)',
                                  transition: 'var(--transition-fast)',
                                  fontFamily: 'inherit',
                                  fontSize: 'inherit',
                                  textAlign: 'center',
                                  width: '100%'
                                }}
                                className="text-xs sm:text-sm"
                              />
                              <input
                                type="date"
                                value={startTime ? new Date(startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                onChange={(e) => {
                                  const currentTime = startTime ? new Date(startTime).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5);
                                  setStartTime(`${e.target.value}T${currentTime}`);
                                }}
                                style={{
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'none',
                                  backgroundColor: 'var(--background-unselected)',
                                  color: 'var(--text-color-unselected)',
                                  border: 'var(--stroke-weight-unselected) solid var(--stroke-color-unselected)',
                                  borderRadius: 'var(--radius-lg)',
                                  padding: 'var(--btn-padding)',
                                  transition: 'var(--transition-fast)',
                                  fontFamily: 'inherit',
                                  fontSize: 'inherit',
                                  textAlign: 'center',
                                  width: '100%'
                                }}
                                className="text-xs sm:text-sm"
                              />
                              <div></div>
                </>
              )}
                          {expandedDateTimePicker === 'end' && (
                            <>
                              <input
                                type="time"
                                value={endTime ? new Date(endTime).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5)}
                                onChange={(e) => {
                                  const currentDate = endTime ? new Date(endTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                                  setEndTime(`${currentDate}T${e.target.value}`);
                                }}
                                style={{
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'none',
                                  backgroundColor: 'var(--background-unselected)',
                                  color: 'var(--text-color-unselected)',
                                  border: 'var(--stroke-weight-unselected) solid var(--stroke-color-unselected)',
                                  borderRadius: 'var(--radius-lg)',
                                  padding: 'var(--btn-padding)',
                                  transition: 'var(--transition-fast)',
                                  fontFamily: 'inherit',
                                  fontSize: 'inherit',
                                  textAlign: 'center',
                                  width: '100%'
                                }}
                                className="text-xs sm:text-sm"
                              />
                              <input
                                type="date"
                                value={endTime ? new Date(endTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                onChange={(e) => {
                                  const currentTime = endTime ? new Date(endTime).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5);
                                  setEndTime(`${e.target.value}T${currentTime}`);
                                }}
                                style={{
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'none',
                                  backgroundColor: 'var(--background-unselected)',
                                  color: 'var(--text-color-unselected)',
                                  border: 'var(--stroke-weight-unselected) solid var(--stroke-color-unselected)',
                                  borderRadius: 'var(--radius-lg)',
                                  padding: 'var(--btn-padding)',
                                  transition: 'var(--transition-fast)',
                                  fontFamily: 'inherit',
                                  fontSize: 'inherit',
                                  textAlign: 'center',
                                  width: '100%'
                                }}
                                className="text-xs sm:text-sm"
                              />
                              <div></div>
                            </>
                          )}
                      </div>
                      )}
                    </div>
                    {renderTrackerAndNotes()}
                  </>
              )}
              {mode === 'DATA' && (
                <>
                  <div className="p-2 sm:p-3 space-y-2">
                    <div className="space-y-2 overflow-y-auto max-h-[60vh]">
                      {logs.length === 0 ? (
                        <div className="text-center text-theme-text opacity-70 mt-12 flex flex-col items-center h-full justify-center">
                          <p className="text-xs sm:text-sm">No saved logs yet.</p>
                          <p className="text-xs sm:text-sm opacity-70">Complete a session or log an intake to see it here.</p>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {logs.map((log) => {
                            if ('intake' in log) {
                              return <IntakeLogItem key={log.id} log={log as IntakeLog} onDelete={onDeleteIntakeLog} deleteProtectionEnabled={deleteProtectionEnabled} />;
                            }
                            if ('Object' in log && 'bookName' in (log as ReadingLog).Object) {
                              return <ReadingLogItem key={log.id} log={log as ReadingLog} onDelete={onDeleteReadingLog} deleteProtectionEnabled={deleteProtectionEnabled} />;
                            }
                            if ('TimeStart' in log) {
                              return <SessionLogItem key={log.id} log={log as SessionLog} onDelete={onDeleteSessionLog} deleteProtectionEnabled={deleteProtectionEnabled} />;
                            }
                            if ('content' in log) {
                              return <NoteLogItem key={log.id} log={log as NoteLog} onDelete={onDeleteNoteLog} deleteProtectionEnabled={deleteProtectionEnabled} />;
                            }
                            return null;
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
            </>
          )}
              {mode === 'SETTINGS' && (
                <>
                  <div className="p-2 sm:p-3 space-y-2">
                    
                    


                    {/* User Settings Section */}
                    <div className="p-4 rounded-lg space-y-2 border bg-theme-surface border-theme-border">
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-2">User Information</h3>
                          <div className="space-y-2">
                            <DetailItem label="Email" value={userEmail} />
                            <DetailItem label="User ID" value={userEmail?.split('@')[0]} />
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-theme-border">
                          <h3 className="text-sm font-semibold text-white mb-2">App Settings</h3>
                          <div className="space-y-2">
                            <button
                              onClick={handleDeleteProtectionToggle}
                              className={`w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-center border btn-mobile ${getButtonStyle(!deleteProtectionEnabled)}`}
                            >
                              {deleteProtectionEnabled ? 'Delete Protection: ON' : 'Delete Protection: OFF'}
                            </button>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-theme-border">
                          <h3 className="text-sm font-semibold text-white mb-2">Account Actions</h3>
                          <button 
                            onClick={onLogout}
                            className="w-full px-4 py-2 rounded-lg font-medium transition-colors border bg-red-600 text-white border-white"
                          >
                            Logout
                          </button>
                        </div>
                      </div>


                  </div>
                </>
              )}
            </>
          )}

        </div>
      </main>

            <footer className="fixed bottom-0 left-0 right-0 z-10 bg-theme-background" style={{ paddingBottom: "calc(4px + env(safe-area-inset-bottom))" }}>
        <div className="p-2 sm:p-3">
            <button 
              onClick={handleAction} 
              disabled={actionButtonDisabled} 
            className={`w-full p-2 sm:p-3 rounded-lg transition-colors text-xs sm:text-sm text-center border btn-mobile ${actionButtonDisabled ? 'btn-unselected opacity-50 cursor-not-allowed' : 'btn-selected'}`}
            >
              {actionButtonText}
            </button>
        </div>
      </footer>

    </div>
    </>
  );
};

export default SetupScreen;