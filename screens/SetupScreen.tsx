
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { formatDateForInput, getCurrentLocalTime } from '../lib/time-utils';
import { ActivityCategory, ActivityObject, SessionConfig, TrackerFrequency, IntakeObject, IntakeType, IntakeUnit, ReadingObject, TrackerEntry } from '../types';
import { TRACKERS, READING_OBJECTS } from '../constants';
import { HistoryIcon } from '../components/Icons';
import Slider from '../components/Slider';

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
  onShowHistory: () => void;
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
}

const formatDuration = (seconds: number): string => {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m}min` : `${m}m ${s}s`;
  }
  return `${seconds}s`;
};

const InputField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
}> = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
    </div>
);

const DateTimeField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
    <div className="flex-1">
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input
            type="datetime-local"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
    </div>
);

const AddActivityModal: React.FC<{
  category: ActivityCategory;
  onSave: (activityData: Omit<ActivityObject, 'id' | 'category'>) => void;
  onClose: () => void;
}> = ({ category, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [subActivity, setSubActivity] = useState('');
  const [subSubActivity, setSubSubActivity] = useState('');
  const [info, setInfo] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave({ name, subActivity, subSubActivity, info });
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 flex flex-col justify-end z-20 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 rounded-t-2xl p-4 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-center">Add New Activity to "{category}"</h3>
        <InputField label="Name*" value={name} onChange={setName} placeholder="e.g., Project Phoenix" />
        <InputField label="Sub-Activity" value={subActivity} onChange={setSubActivity} placeholder="e.g., UI Design" />
        <InputField label="Sub-Sub-Activity" value={subSubActivity} onChange={setSubSubActivity} placeholder="e.g., Login Screen" />
        <InputField label="Info" value={info} onChange={setInfo} placeholder="e.g., Focus on component library" />
        <div className="flex gap-4 pt-2">
            <button onClick={onClose} className="w-full p-3 rounded-xl bg-gray-700 text-white font-bold">Cancel</button>
            <button onClick={handleSave} disabled={!name.trim()} className="w-full p-3 rounded-xl bg-indigo-600 text-white font-bold disabled:bg-gray-600">Save</button>
        </div>
      </div>
    </div>
  );
};

const AddIntakeModal: React.FC<{
    onSave: (intakeData: Omit<IntakeObject, 'id'>) => void;
    onClose: () => void;
  }> = ({ onSave, onClose }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<IntakeType>(IntakeType.Food);
    const [info, setInfo] = useState('');
    const [defaultQuantity, setDefaultQuantity] = useState('');
    const [defaultUnit, setDefaultUnit] = useState<IntakeUnit | ''>('');

  
    const handleSave = () => {
      if (name.trim() && defaultQuantity && defaultUnit) {
        onSave({ 
            name, 
            type, 
            info,
            defaultQuantity: parseFloat(defaultQuantity),
            defaultUnit: defaultUnit as IntakeUnit,
        });
      }
    };
  
    return (
      <div className="absolute inset-0 bg-black/80 flex flex-col justify-end z-20 animate-fade-in" onClick={onClose}>
        <div className="bg-gray-900 rounded-t-2xl p-4 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-center">Add New Intake Item</h3>
          <InputField label="Name*" value={name} onChange={setName} placeholder="e.g., Coffee" />
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value as IntakeType)} className="w-full bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {Object.values(IntakeType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <InputField label="Info (Optional)" value={info} onChange={setInfo} placeholder="e.g., 200mg Caffeine" />
          <InputField label="Default Quantity" value={defaultQuantity} onChange={setDefaultQuantity} placeholder="e.g., 1" type="number" />
           <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Default Unit</label>
            <select value={defaultUnit} onChange={e => setDefaultUnit(e.target.value as IntakeUnit)} className="w-full bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="" disabled>Select a unit</option>
                {Object.values(IntakeUnit).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="flex gap-4 pt-2">
              <button onClick={onClose} className="w-full p-3 rounded-xl bg-gray-700 text-white font-bold">Cancel</button>
              <button onClick={handleSave} disabled={!name.trim() || !defaultQuantity || !defaultUnit} className="w-full p-3 rounded-xl bg-indigo-600 text-white font-bold disabled:bg-gray-600">Save</button>
          </div>
        </div>
      </div>
    );
};

const AddReadingModal: React.FC<{
    onSave: (readingData: Omit<ReadingObject, 'id'>) => void;
    onClose: () => void;
  }> = ({ onSave, onClose }) => {
    const [bookName, setBookName] = useState('');
    const [author, setAuthor] = useState('');
    const [year, setYear] = useState('');
    const [info, setInfo] = useState('');

    const handleSave = () => {
      if (bookName.trim() && author.trim()) {
        onSave({ 
            bookName, 
            author,
            year: year ? parseInt(year, 10) : undefined,
            info,
        });
      }
    };
  
    return (
      <div className="absolute inset-0 bg-black/80 flex flex-col justify-end z-20 animate-fade-in" onClick={onClose}>
        <div className="bg-gray-900 rounded-t-2xl p-4 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-center">Add New Book</h3>
          <InputField label="Book Name*" value={bookName} onChange={setBookName} placeholder="e.g., The Midnight Library" />
          <InputField label="Author*" value={author} onChange={setAuthor} placeholder="e.g., Matt Haig" />
          <InputField label="Year Published" value={year} onChange={setYear} placeholder="e.g., 2020" type="number" />
          <InputField label="Info (Optional)" value={info} onChange={setInfo} placeholder="e.g., Fiction, Fantasy" />
          <div className="flex gap-4 pt-2">
              <button onClick={onClose} className="w-full p-3 rounded-xl bg-gray-700 text-white font-bold">Cancel</button>
              <button onClick={handleSave} disabled={!bookName.trim() || !author.trim()} className="w-full p-3 rounded-xl bg-indigo-600 text-white font-bold disabled:bg-gray-600">Save</button>
          </div>
        </div>
      </div>
    );
};


const SetupScreen: React.FC<SetupScreenProps> = ({ soundEnabled, onSoundEnabledChange, ...props }) => {
  const { onStartTimer, onLogActivity, onLogIntake, onLogReading, onLogNote, onShowHistory, activities, onAddNewActivity, onDeleteActivity, intakes, onAddNewIntake, onDeleteIntake, readingObjects, onAddNewReadingObject, onDeleteReadingObject } = props;
  const [mode, setMode] = useState<'TIMER' | 'RECORD' | 'INTAKE' | 'READING' | 'NOTE'>('TIMER');
  
  // Activity states
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityObject | null>(null);
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  // Timer mode state
  const [sessionDuration, setSessionDuration] = useState(5);
  const [breakDuration, setBreakDuration] = useState(1);
  const [sessionCount, setSessionCount] = useState(2);
  const [trackerFrequency, setTrackerFrequency] = useState<TrackerFrequency>('every_break');
  const [activeSlider, setActiveSlider] = useState<'session' | 'break' | 'count' | null>(null);

  // Record/Reading mode state
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [noteText, setNoteText] = useState('');
  const [trackerMetrics, setTrackerMetrics] = useState<Record<string, number> | null>(null);

  // Intake mode state
  const [selectedIntakeIds, setSelectedIntakeIds] = useState<string[]>([]);
  const [intakeTime, setIntakeTime] = useState('');
  const [isAddingIntake, setIsAddingIntake] = useState(false);
  
  // Reading mode state
  const [selectedReadingObject, setSelectedReadingObject] = useState<ReadingObject | null>(null);
  const [isAddingReadingObject, setIsAddingReadingObject] = useState(false);

  // Note mode state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteRelatedActivityIds, setNoteRelatedActivityIds] = useState<string[]>([]);

  // Common state
  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);

  const allTrackers = useMemo(() => [ ...TRACKERS, { id: 'note', name: 'Note', metrics: [] } ], []);
  const filteredActivities = useMemo(() => selectedCategory ? activities.filter(a => a.category === selectedCategory) : [], [selectedCategory, activities]);
  const groupedActivities = useMemo(() => {
    return activities.reduce((acc, act) => {
        (acc[act.category] = acc[act.category] || []).push(act);
        return acc;
    }, {} as Record<ActivityCategory, ActivityObject[]>);
  }, [activities]);

  // formatDateForInput is now imported from time-utils
  
  const resetForms = useCallback(() => {
    setSelectedCategory(null);
    setSelectedActivity(null);
    setSelectedReadingObject(null);
    setSessionDuration(5);
    setBreakDuration(1);
    setSessionCount(2);
    setTrackerFrequency('every_break');
    setActiveSlider(null);
    setNoteText('');
    setNoteTitle('');
    setNoteContent('');
    setTrackerMetrics(null);
    setSelectedTrackerId(null);
    setNoteRelatedActivityIds([]);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    setEndTime(formatDateForInput(now));
    setStartTime(formatDateForInput(oneHourAgo));
    setSelectedIntakeIds([]);
    setIntakeTime(formatDateForInput(new Date()));
  }, []);

  useEffect(() => {
    resetForms();
  }, [mode, resetForms]);

  const handleAddNewActivityAndSelect = async (activityData: Omit<ActivityObject, 'id' | 'category'>) => {
    if (!selectedCategory) {
      alert('Please select a category first');
      return;
    }
    
    try {
      const newActivity = await onAddNewActivity({ ...activityData, category: selectedCategory });
      setSelectedActivity(newActivity);
      setIsAddingActivity(false);
    } catch (error) {
      console.error('Failed to add new activity:', error);
      alert('Failed to add new activity. Please try again.');
    }
  };
  
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
  
  const handleAddNewReadingObjectAndSelect = async (readingData: Omit<ReadingObject, 'id'>) => {
    try {
      const newReadingObject = await onAddNewReadingObject(readingData);
      setSelectedReadingObject(newReadingObject);
      setIsAddingReadingObject(false);
    } catch (error) {
      console.error('Failed to add new reading object:', error);
      alert('Failed to add new reading object. Please try again.');
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
          default: return { disabled: true, text: 'Select Mode' };
      }
  };

  const { disabled: actionButtonDisabled, text: actionButtonText } = getActionButtonState();

  const renderSectionHeader = (title: string) => (
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">{title}</h3></div>
  );

  const renderOptionalTrackers = () => (
    <>
      <div className="p-4 space-y-3">
          {renderSectionHeader('Trackers (Optional)')}
          <div className="grid grid-cols-3 gap-2">
            {TRACKERS.map(tracker => ( <button key={tracker.id} onClick={() => handleTrackerSelect(tracker.id)} className={`p-3 rounded-lg text-sm transition-colors text-center ${selectedTrackerId === tracker.id ? 'bg-indigo-600' : 'bg-gray-800'}`}>{tracker.name}</button>))}
          </div>
      </div>
      {selectedTrackerId && trackerMetrics && (
          <div className="p-4 space-y-3">
              {renderSectionHeader(TRACKERS.find(t => t.id === selectedTrackerId)?.name || 'Tracker')}
              <div className="space-y-6 px-2 pt-2">
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
        <div className="p-4 space-y-3">
            {renderSectionHeader('Notes (Optional)')}
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add notes about this session..." className="w-full h-24 bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
      </>
  );

  return (
    <div className="flex flex-col h-full bg-black text-white relative">
      <header className="p-4 border-b border-gray-800 text-center relative flex items-center justify-center sticky top-0 bg-black z-10">
        <h1 className="text-xl font-bold">Sterodoro</h1>
        <button onClick={onShowHistory} className="absolute right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors" aria-label="Session History">
          <HistoryIcon className="w-6 h-6" />
        </button>
      </header>
      
      <main className="flex-grow overflow-y-auto">
        <div className="divide-y divide-gray-800">
          <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setMode('TIMER')} className={`p-3 rounded-lg font-bold transition-colors ${mode === 'TIMER' ? 'bg-indigo-600' : 'bg-gray-800'}`}>Timer</button>
                  <button onClick={() => setMode('RECORD')} className={`p-3 rounded-lg font-bold transition-colors ${mode === 'RECORD' ? 'bg-indigo-600' : 'bg-gray-800'}`}>Record</button>
                  <button onClick={() => setMode('INTAKE')} className={`p-3 rounded-lg font-bold transition-colors ${mode === 'INTAKE' ? 'bg-indigo-600' : 'bg-gray-800'}`}>Intake</button>
                  <button onClick={() => setMode('READING')} className={`p-3 rounded-lg font-bold transition-colors ${mode === 'READING' ? 'bg-indigo-600' : 'bg-gray-800'}`}>Reading</button>
                  <button onClick={() => setMode('NOTE')} className={`p-3 rounded-lg font-bold transition-colors ${mode === 'NOTE' ? 'bg-indigo-600' : 'bg-gray-800'}`}>Note</button>
              </div>
          </div>
          
          {mode === 'INTAKE' ? (
            <>
              <div className="p-4 space-y-3">
                {renderSectionHeader('Select Intake Item(s)')}
                {intakes.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">No intake items yet</p>
                        <button onClick={() => setIsAddingIntake(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
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
                                            className={`w-full p-3 rounded-lg text-sm transition-colors text-center truncate ${isSelected ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-gray-800'}`}
                                        >
                                            {intake.name}
                                        </button>
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
                                    </div>
                                )
                            })}
                            <button onClick={() => setIsAddingIntake(true)} className="p-3 rounded-lg text-sm transition-colors bg-gray-800 text-center">Add New...</button>
                        </div>
                )}
              </div>
              {selectedIntakeIds.length > 0 && (
                <div className="p-4 space-y-3">
                  <DateTimeField label="Time of Intake (for all items)" value={intakeTime} onChange={setIntakeTime} />
                </div>
              )}
            </>
          ) : mode === 'READING' ? (
            <>
              <div className="p-4 space-y-3">
                  {renderSectionHeader('Book')}
                  {readingObjects.length === 0 ? (
                      <div className="text-center py-8">
                          <p className="text-gray-400 mb-4">No books yet</p>
                          <button onClick={() => setIsAddingReadingObject(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                              Add Your First Book
                          </button>
                      </div>
                  ) : (
                      <div className="grid grid-cols-3 gap-2">
                          {readingObjects.map(book => (
                              <div key={book.id} className="relative group">
                                  <button 
                                      onClick={() => setSelectedReadingObject(book)} 
                                      className={`w-full p-3 rounded-lg text-sm transition-colors text-center truncate ${selectedReadingObject?.id === book.id ? 'bg-indigo-600' : 'bg-gray-800'}`}
                                  >
                                      {book.bookName}
                                  </button>
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
                              </div>
                          ))}
                          <button onClick={() => setIsAddingReadingObject(true)} className="p-3 rounded-lg text-sm transition-colors bg-gray-800 text-center">Other...</button>
                      </div>
                  )}
              </div>
              {selectedReadingObject && (
                  <>
                    <div className="p-4 space-y-3">
                      {renderSectionHeader('Reading Time')}
                      <div className="flex gap-2">
                        <DateTimeField label="Start Time" value={startTime} onChange={setStartTime} />
                        <DateTimeField label="End Time" value={endTime} onChange={setEndTime} />
                      </div>
                    </div>
                    {renderTrackerAndNotes()}
                  </>
              )}
            </>
          ) : mode === 'NOTE' ? (
            <>
              <div className="p-4 space-y-3">
                {renderSectionHeader('Note')}
                <InputField label="Title (Optional)" value={noteTitle} onChange={setNoteTitle} placeholder="e.g., Project Ideas" />
                <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Write down your thoughts..." className="w-full h-32 bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="p-4 space-y-3">
                {renderSectionHeader('Relate to Activities (Optional)')}
                <div className="space-y-3">
                    {Object.entries(groupedActivities).map(([category, acts]) => (
                        <div key={category}>
                            <h4 className="font-bold text-indigo-400 mb-2 text-sm">{category}</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {acts.map(activity => {
                                    const isSelected = noteRelatedActivityIds.includes(activity.id);
                                    return (
                                        <button key={activity.id} onClick={() => handleToggleNoteActivity(activity.id)} className={`p-3 rounded-lg text-sm transition-colors text-center truncate ${isSelected ? 'bg-indigo-600' : 'bg-gray-800'}`}>{activity.name}</button>
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
              <div className="p-4 space-y-3">
                {renderSectionHeader('Activity Type')}
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(ActivityCategory).map(cat => ( <button key={cat} onClick={() => { setSelectedCategory(cat); setSelectedActivity(null); }} className={`p-3 rounded-lg text-sm transition-colors text-center ${selectedCategory === cat ? 'bg-indigo-600' : 'bg-gray-800'}`}>{cat}</button>))}
                </div>
              </div>
              {selectedCategory && (
                  <div className="p-4 space-y-3">
                      {renderSectionHeader('Activity')}
                      {filteredActivities.length === 0 ? (
                          <div className="text-center py-8">
                              <p className="text-gray-400 mb-4">No activities yet for {selectedCategory}</p>
                              <button onClick={() => setIsAddingActivity(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                                  Create Your First Activity
                              </button>
                          </div>
                      ) : (
                          <div className="grid grid-cols-3 gap-2">
                              {filteredActivities.map(act => (
                                <div key={act.id} className="relative group">
                                  <button 
                                    onClick={() => setSelectedActivity(act)} 
                                    className={`w-full p-3 rounded-lg text-sm transition-colors text-center truncate ${selectedActivity?.id === act.id ? 'bg-indigo-600' : 'bg-gray-800'}`}
                                  >
                                    {act.name}
                                  </button>
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
                                </div>
                              ))}
                              <button onClick={() => setIsAddingActivity(true)} className="p-3 rounded-lg text-sm transition-colors bg-gray-800 text-center">Other...</button>
                          </div>
                      )}
                  </div>
              )}
              {selectedActivity && mode === 'TIMER' && (
                <>
                  <div className="p-4 space-y-3">
                      {renderSectionHeader('Timer Settings')}
                      <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => setActiveSlider(activeSlider === 'session' ? null : 'session')} className={`p-2 rounded-lg text-center transition-colors flex flex-col justify-center items-center h-20 ${activeSlider === 'session' ? 'bg-indigo-600' : 'bg-gray-800'}`}>
                              <span className="text-sm text-gray-300 block">Session</span>
                              <span className="font-bold text-lg">{formatDuration(sessionDuration)}</span>
                          </button>
                          <button onClick={() => setActiveSlider(activeSlider === 'break' ? null : 'break')} className={`p-2 rounded-lg text-center transition-colors flex flex-col justify-center items-center h-20 ${activeSlider === 'break' ? 'bg-indigo-600' : 'bg-gray-800'}`}>
                              <span className="text-sm text-gray-300 block">Break</span>
                              <span className="font-bold text-lg">{formatDuration(breakDuration)}</span>
                          </button>
                          <button onClick={() => setActiveSlider(activeSlider === 'count' ? null : 'count')} className={`p-2 rounded-lg text-center transition-colors flex flex-col justify-center items-center h-20 ${activeSlider === 'count' ? 'bg-indigo-600' : 'bg-gray-800'}`}>
                              <span className="text-sm text-gray-300 block">Sessions</span>
                              <span className="font-bold text-lg">{sessionCount}</span>
                          </button>
                      </div>
                      {activeSlider === 'session' && <div className="pt-3"><Slider min={5} max={20} step={1} value={sessionDuration} onChange={setSessionDuration} label={formatDuration(sessionDuration)} /></div>}
                      {activeSlider === 'break' && <div className="pt-3"><Slider min={1} max={10} step={1} value={breakDuration} onChange={setBreakDuration} label={formatDuration(breakDuration)} /></div>}
                      {activeSlider === 'count' && <div className="pt-3"><Slider min={1} max={10} step={1} value={sessionCount} onChange={setSessionCount} label={`${sessionCount} sessions`} /></div>}
                  </div>
                  <div className="p-4 space-y-3">
                    {renderSectionHeader('Trackers')}
                    <div className="grid grid-cols-3 gap-2">
                      {allTrackers.map(tracker => ( <button key={tracker.id} onClick={() => handleTrackerSelect(tracker.id)} className={`p-3 rounded-lg text-sm transition-colors text-center ${selectedTrackerId === tracker.id ? 'bg-indigo-600' : 'bg-gray-800'}`}>{tracker.name}</button>))}
                    </div>
                  </div>
                  {selectedTrackerId && (<div className="p-4 space-y-3">
                      {renderSectionHeader('Frequency')}
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setTrackerFrequency('every_break')} className={`p-3 rounded-lg text-sm transition-colors text-center ${trackerFrequency === 'every_break' ? 'bg-indigo-600' : 'bg-gray-800'}`}>Every Break</button>
                        <button onClick={() => setTrackerFrequency('end_of_session')} className={`p-3 rounded-lg text-sm transition-colors text-center ${trackerFrequency === 'end_of_session' ? 'bg-indigo-600' : 'bg-gray-800'}`}>End of Session</button>
                      </div>
                  </div>)}
                  <div className="p-4 space-y-3">
                      {renderSectionHeader('Sound Notifications')}
                      <div className="bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                              <div>
                                  <p className="text-white font-medium">Session & Break Sounds</p>
                                  <p className="text-gray-400 text-sm">Play notification sounds when sessions and breaks end</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <button 
                                      onClick={() => {
                                          if (soundEnabled) {
                                              const audio = new Audio('/sound.mp3');
                                              audio.play().catch(console.warn);
                                          }
                                      }}
                                      disabled={!soundEnabled}
                                      className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600'}`}
                                      title="Test sound"
                                  >
                                      🔊
                                  </button>
                                  <button
                                      onClick={() => onSoundEnabledChange(!soundEnabled)}
                                      className={`px-3 py-1 rounded text-sm transition-colors ${soundEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                                  >
                                      {soundEnabled ? '✓ Enabled' : '✗ Disabled'}
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
                </>
              )}
              {selectedActivity && mode === 'RECORD' && (
                  <>
                    <div className="p-4 space-y-3">
                      {renderSectionHeader('Activity Time')}
                      <div className="flex gap-2">
                        <DateTimeField label="Start Time" value={startTime} onChange={setStartTime} />
                        <DateTimeField label="End Time" value={endTime} onChange={setEndTime} />
                      </div>
                    </div>
                    {renderTrackerAndNotes()}
                  </>
              )}
            </>
          )}

        </div>
      </main>

      <footer className="p-4 border-t border-gray-800 sticky bottom-0 bg-black">
        <button onClick={handleAction} disabled={actionButtonDisabled} className="w-full p-4 rounded-xl bg-indigo-600 text-white font-bold text-lg transition-colors hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed">
            {actionButtonText}
        </button>
      </footer>
      {isAddingActivity && selectedCategory && <AddActivityModal category={selectedCategory} onClose={() => setIsAddingActivity(false)} onSave={handleAddNewActivityAndSelect} />}
      {isAddingIntake && <AddIntakeModal onClose={() => setIsAddingIntake(false)} onSave={handleAddNewIntakeAndSelect} />}
      {isAddingReadingObject && <AddReadingModal onClose={() => setIsAddingReadingObject(false)} onSave={handleAddNewReadingObjectAndSelect} />}
    </div>
  );
};

export default SetupScreen;