
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
      <div className="bg-gray-900 rounded-t-2xl p-2 sm:p-4 space-y-2 sm:space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-center">Add New Activity to "{category}"</h3>
        <InputField label="Name*" value={name} onChange={setName} placeholder="e.g., Project Phoenix" />
        <InputField label="Sub-Activity" value={subActivity} onChange={setSubActivity} placeholder="e.g., UI Design" />
        <InputField label="Sub-Sub-Activity" value={subSubActivity} onChange={setSubSubActivity} placeholder="e.g., Login Screen" />
        <InputField label="Info" value={info} onChange={setInfo} placeholder="e.g., Focus on component library" />
        <div className="flex gap-2 sm:gap-4 pt-2">
            <button onClick={onClose} className="w-full p-2 sm:p-3 rounded-xl font-bold border min-h-[44px]" style={{ backgroundColor: '#374151', color: '#ffffff', borderColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid' }}>Cancel</button>
            <button onClick={handleSave} disabled={!name.trim()} className="w-full p-2 sm:p-3 rounded-xl font-bold border min-h-[44px]" style={{ backgroundColor: !name.trim() ? '#374151' : '#4f46e5', color: '#ffffff', borderColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid' }}>Save</button>
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
        <div className="bg-gray-900 rounded-t-2xl p-2 sm:p-4 space-y-2 sm:space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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

          <div className="flex gap-2 sm:gap-4 pt-2">
              <button onClick={onClose} className="w-full p-2 sm:p-3 rounded-xl font-bold border min-h-[44px]" style={{ backgroundColor: '#374151', color: '#ffffff', borderColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid' }}>Cancel</button>
              <button onClick={handleSave} disabled={!name.trim() || !defaultQuantity || !defaultUnit} className="w-full p-2 sm:p-3 rounded-xl font-bold border min-h-[44px]" style={{ backgroundColor: (!name.trim() || !defaultQuantity || !defaultUnit) ? '#374151' : '#4f46e5', color: '#ffffff', borderColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid' }}>Save</button>
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
        <div className="bg-gray-900 rounded-t-2xl p-2 sm:p-4 space-y-2 sm:space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-center">Add New Book</h3>
          <InputField label="Book Name*" value={bookName} onChange={setBookName} placeholder="e.g., The Midnight Library" />
          <InputField label="Author*" value={author} onChange={setAuthor} placeholder="e.g., Matt Haig" />
          <InputField label="Year Published" value={year} onChange={setYear} placeholder="e.g., 2020" type="number" />
          <InputField label="Info (Optional)" value={info} onChange={setInfo} placeholder="e.g., Fiction, Fantasy" />
          <div className="flex gap-2 sm:gap-4 pt-2">
              <button onClick={onClose} className="w-full p-2 sm:p-3 rounded-xl font-bold border min-h-[44px]" style={{ backgroundColor: '#374151', color: '#ffffff', borderColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid' }}>Cancel</button>
              <button onClick={handleSave} disabled={!bookName.trim() || !author.trim()} className="w-full p-2 sm:p-3 rounded-xl font-bold border min-h-[44px]" style={{ backgroundColor: (!bookName.trim() || !author.trim()) ? '#374151' : '#4f46e5', color: '#ffffff', borderColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid' }}>Save</button>
          </div>
        </div>
      </div>
    );
};

const DetailItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <p className="text-gray-300">
      <span className="font-semibold text-gray-400">{label}:</span> {value}
    </p>
  );
};

const ColorPicker: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm">{label}</span>
    <div className="flex items-center gap-2">
      <div 
        className="w-8 h-8 rounded-lg border-2 cursor-pointer"
        style={{ 
          backgroundColor: value,
          borderColor: '#ffffff'
        }}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'color';
          input.value = value;
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            onChange(target.value);
          };
          input.click();
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 px-2 py-1 text-xs rounded border focus:outline-none"
        placeholder="#000000"
      />
    </div>
  </div>
);

const SessionLogItem: React.FC<{ log: SessionLog; onDelete: (id: string) => Promise<void> }> = ({ log, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const durationMs = new Date(log.TimeEnd).getTime() - new Date(log.TimeStart).getTime();

  return (
    <li className="bg-gray-800 rounded-lg overflow-hidden transition-all duration-300">
      <div className="flex justify-between items-center p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 text-left flex justify-between items-center"
          aria-expanded={isExpanded}
        >
          <div>
            <p className="font-bold text-white">{log.Object.name}</p>
            <p className="text-sm text-gray-400">{formatDateTime(log.TimeStart)}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-indigo-400">{formatDurationMs(durationMs)}</p>
          </div>
        </button>
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
      </div>
      {isExpanded && (
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 space-y-4 animate-fade-in text-sm">
          <div>
            <h4 className="font-bold text-gray-200 mb-1">Details</h4>
            <div className="pl-4 border-l-2 border-gray-700 space-y-1 text-xs">
              <DetailItem label="Category" value={log.Object.type} />
              <DetailItem label="Sub-Activity" value={log.Object.subActivity} />
              <DetailItem label="Sub-Sub-Activity" value={log.Object.subSubActivity} />
              <DetailItem label="Info" value={log.Object.info} />
            </div>
          </div>
          
          {log.Notes.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-200 mb-1">Notes ({log.Notes.length})</h4>
              <ul className="pl-4 border-l-2 border-gray-700 space-y-2 text-xs">
                {log.Notes.map((note) => (
                    <li key={note.timestamp}>
                        <p className="text-gray-400 font-mono">{formatDateTime(note.timestamp)}</p>
                        <p className="text-gray-300 whitespace-pre-wrap">{note.note}</p>
                    </li>
                ))}
              </ul>
            </div>
          )}

          {log.TrackerAndMetric.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-200 mb-1">Performance</h4>
              <ul className="pl-4 border-l-2 border-gray-700 space-y-2 text-xs">
                {log.TrackerAndMetric.map((entry, i) => (
                  <li key={entry.timestamp}>
                     <p className="text-gray-400 font-semibold">Break {i+1} @ {formatDateTime(entry.timestamp)}</p>
                     <p className="text-gray-300">{Object.entries(entry.metrics).map(([key, val]) => `${key}: ${val}/10`).join(' • ')}</p>
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

const IntakeLogItem: React.FC<{ log: IntakeLog; onDelete: (id: string) => Promise<void> }> = ({ log, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
  
    return (
      <li className="bg-gray-800 rounded-lg overflow-hidden transition-all duration-300">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 text-left flex justify-between items-center"
            aria-expanded={isExpanded}
          >
            <div>
              <p className="font-bold text-white">{log.intake.name}</p>
              <p className="text-sm text-gray-400">{formatDateTime(log.timestamp)}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-teal-400">{log.quantity} {log.unit}</p>
            </div>
          </button>
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
        </div>
        {isExpanded && (
          <div className="p-4 border-t border-gray-700 bg-gray-800/50 space-y-4 animate-fade-in text-sm">
            <div>
              <h4 className="font-bold text-gray-200 mb-1">Details</h4>
              <div className="pl-4 border-l-2 border-gray-700 space-y-1 text-xs">
                <DetailItem label="Type" value={log.intake.type} />
                <DetailItem label="Info" value={log.intake.info} />
              </div>
            </div>
          </div>
        )}
      </li>
    );
};

const ReadingLogItem: React.FC<{ log: ReadingLog; onDelete: (id: string) => Promise<void> }> = ({ log, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const durationMs = new Date(log.TimeEnd).getTime() - new Date(log.TimeStart).getTime();
  
    return (
      <li className="bg-gray-800 rounded-lg overflow-hidden transition-all duration-300">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 text-left flex justify-between items-center"
            aria-expanded={isExpanded}
          >
            <div>
              <p className="font-bold text-white">{log.Object.bookName}</p>
              <p className="text-sm text-gray-400">{log.Object.author}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-cyan-400">{formatDurationMs(durationMs)}</p>
              <p className="text-sm text-gray-400">{formatDateTime(log.TimeStart)}</p>
            </div>
          </button>
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
        </div>
        {isExpanded && (
            <div className="p-4 border-t border-gray-700 bg-gray-800/50 space-y-4 animate-fade-in text-sm">
            <div>
                <h4 className="font-bold text-gray-200 mb-1">Details</h4>
                <div className="pl-4 border-l-2 border-gray-700 space-y-1 text-xs">
                    <DetailItem label="Year" value={log.Object.year} />
                    <DetailItem label="Info" value={log.Object.info} />
                </div>
            </div>
            
            {log.Notes.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-200 mb-1">Notes ({log.Notes.length})</h4>
                <ul className="pl-4 border-l-2 border-gray-700 space-y-2 text-xs">
                  {log.Notes.map((note) => (
                      <li key={note.timestamp}>
                          <p className="text-gray-400 font-mono">{formatDateTime(note.timestamp)}</p>
                          <p className="text-gray-300 whitespace-pre-wrap">{note.note}</p>
                      </li>
                  ))}
                </ul>
              </div>
            )}

            {log.TrackerAndMetric.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-200 mb-1">Performance</h4>
                <ul className="pl-4 border-l-2 border-gray-700 space-y-2 text-xs">
                  {log.TrackerAndMetric.map((entry, i) => (
                    <li key={entry.timestamp}>
                       <p className="text-gray-400 font-semibold">Entry @ {formatDateTime(entry.timestamp)}</p>
                       <p className="text-gray-300">{Object.entries(entry.metrics).map(([key, val]) => `${key}: ${val}/10`).join(' • ')}</p>
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

const NoteLogItem: React.FC<{ log: NoteLog; onDelete: (id: string) => Promise<void> }> = ({ log, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
  
    return (
      <li className="bg-gray-800 rounded-lg overflow-hidden transition-all duration-300">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 text-left flex justify-between items-center"
            aria-expanded={isExpanded}
          >
            <div>
              <p className="font-bold text-white">{log.title || 'Untitled Note'}</p>
              <p className="text-sm text-gray-400">{formatDateTime(log.timestamp)}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-yellow-400">{log.content.length} chars</p>
            </div>
          </button>
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
        </div>
        {isExpanded && (
          <div className="p-4 border-t border-gray-700 bg-gray-800/50 space-y-4 animate-fade-in text-sm">
            <div>
              <h4 className="font-bold text-gray-200 mb-1">Content</h4>
              <div className="pl-4 border-l-2 border-gray-700">
                <p className="text-gray-300 whitespace-pre-wrap text-xs">{log.content}</p>
              </div>
            </div>
            
            {log.TrackerAndMetric.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-200 mb-1">Performance</h4>
                <ul className="pl-4 border-l-2 border-gray-700 space-y-2 text-xs">
                  {log.TrackerAndMetric.map((entry, i) => (
                    <li key={entry.timestamp}>
                       <p className="text-gray-400 font-semibold">Entry @ {formatDateTime(entry.timestamp)}</p>
                       <p className="text-gray-300">{Object.entries(entry.metrics).map(([key, val]) => `${key}: ${val}/10`).join(' • ')}</p>
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
  const [mode, setMode] = useState<'TIMER' | 'RECORD' | 'INTAKE' | 'READING' | 'NOTE' | 'DATA' | 'SETTINGS'>('TIMER');
  const [settingsSubMode, setSettingsSubMode] = useState<'USER' | 'APPLICATION_LOOK'>('USER');
  
  // Color customization state
  const [appColors, setAppColors] = useState({
    background: '#ffffff',
    surface: '#ffffff',
    primary: '#4f46e5',
    text: '#000000',
    accent: '#10b981',
    // Button hierarchy system
    buttonUnselected: {
      background: '#ffffff',
      stroke: '#000000',
      strokeWeight: 1,
      text: '#000000',
      fontWeight: 'normal'
    },
    buttonSelected: {
      background: '#b8b8b8',
      stroke: '#000000',
      strokeWeight: 2,
      text: '#000000',
      fontWeight: 'normal'
    }
  });

  // Predefined theme presets
  const themePresets = {
    dark: {
      name: 'Dark',
      colors: {
        background: '#000000',
        surface: '#000000',
        primary: '#4f46e5',
        text: '#ffffff',
        accent: '#10b981',
        buttonUnselected: {
          background: '#ffffff',
          stroke: '#ffffff',
          strokeWeight: 1,
          text: '#000000',
          fontWeight: 'normal'
        },
        buttonSelected: {
          background: '#b8b8b8',
          stroke: '#ffffff',
          strokeWeight: 2,
          text: '#000000',
          fontWeight: 'normal'
        }
      }
    },
    light: {
      name: 'Light',
      colors: {
        background: '#ffffff',
        surface: '#ffffff',
        primary: '#4f46e5',
        text: '#000000',
        accent: '#10b981',
        buttonUnselected: {
          background: '#ffffff',
          stroke: '#000000',
          strokeWeight: 1,
          text: '#000000',
          fontWeight: 'normal'
        },
        buttonSelected: {
          background: '#b8b8b8',
          stroke: '#000000',
          strokeWeight: 2,
          text: '#000000',
          fontWeight: 'normal'
        }
      }
    }
  };
  
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

  // Color customization handlers
  const handleColorChange = (colorKey: keyof typeof appColors, value: string) => {
    setAppColors(prev => ({ ...prev, [colorKey]: value }));
  };

  const handleThemePreset = (presetKey: keyof typeof themePresets) => {
    const preset = themePresets[presetKey];
    setAppColors(preset.colors);
  };

  // Hierarchical button styling system
  const getButtonStyle = (isActive: boolean = false, isDisabled: boolean = false) => {
    if (isDisabled) {
      return {
        backgroundColor: appColors.surface,
        color: appColors.text,
        borderColor: appColors.text,
        borderWidth: '1px',
        borderStyle: 'solid',
        fontWeight: 'normal'
      };
    }
    
    const buttonConfig = isActive ? appColors.buttonSelected : appColors.buttonUnselected;
    return {
      backgroundColor: buttonConfig.background,
      color: buttonConfig.text,
      borderColor: buttonConfig.stroke,
      borderWidth: `${buttonConfig.strokeWeight}px`,
      borderStyle: 'solid',
      fontWeight: buttonConfig.fontWeight
    };
  };

  const getContainerStyle = () => ({
    backgroundColor: appColors.surface,
    borderColor: appColors.text
  });
  
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
            {TRACKERS.map(tracker => ( 
              <button 
                key={tracker.id} 
                onClick={() => handleTrackerSelect(tracker.id)} 
                className="p-3 rounded-lg text-sm transition-colors text-center border"
                style={getButtonStyle(selectedTrackerId === tracker.id)}
              >
                {tracker.name}
              </button>
            ))}
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
    <>
      <GlobalStyles appColors={appColors} />
      <div 
        className="flex flex-col min-h-screen relative"
        style={{ 
          backgroundColor: appColors.background,
          color: appColors.text
        }}
      >
      {/* Header removed to eliminate unnecessary spacing */}
      
      <main className="flex-1 overflow-y-auto pb-24">
        <div 
          className="divide-y"
          style={{ borderColor: appColors.surface }}
        >
          <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button 
                    onClick={() => setMode('TIMER')} 
                    className={`p-3 sm:p-4 rounded-lg font-bold transition-colors text-xs sm:text-sm md:text-base border min-h-[44px] min-w-[44px] ${mode === 'TIMER' ? 'btn-selected' : 'btn-unselected'}`}
                  >
                    Timer
                  </button>
                  <button 
                    onClick={() => setMode('RECORD')} 
                    className={`p-3 sm:p-4 rounded-lg font-bold transition-colors text-xs sm:text-sm md:text-base border min-h-[44px] min-w-[44px] ${mode === 'RECORD' ? 'btn-selected' : 'btn-unselected'}`}
                  >
                    Record
                  </button>
                  <button 
                    onClick={() => setMode('INTAKE')} 
                    className="p-3 sm:p-4 rounded-lg font-bold transition-colors text-xs sm:text-sm md:text-base border min-h-[44px] min-w-[44px]"
                    style={getButtonStyle(mode === 'INTAKE')}
                  >
                    Intake
                  </button>
                  <button 
                    onClick={() => setMode('READING')} 
                    className="p-3 sm:p-4 rounded-lg font-bold transition-colors text-xs sm:text-sm md:text-base border min-h-[44px] min-w-[44px]"
                    style={getButtonStyle(mode === 'READING')}
                  >
                    Reading
                  </button>
                  <button 
                    onClick={() => setMode('NOTE')} 
                    className="p-3 sm:p-4 rounded-lg font-bold transition-colors text-xs sm:text-sm md:text-base border min-h-[44px] min-w-[44px]"
                    style={getButtonStyle(mode === 'NOTE')}
                  >
                    Note
                  </button>
                  <div className="p-4 rounded-lg bg-transparent"></div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button 
                    onClick={() => setMode('DATA')} 
                    className="p-3 sm:p-4 rounded-lg font-bold transition-colors text-xs sm:text-sm md:text-base border min-h-[44px] min-w-[44px]"
                    style={getButtonStyle(mode === 'DATA')}
                  >
                    Data
                  </button>
                  <button 
                    onClick={() => setMode('SETTINGS')} 
                    className="p-3 sm:p-4 rounded-lg font-bold transition-colors text-xs sm:text-sm md:text-base border min-h-[44px] min-w-[44px]"
                    style={getButtonStyle(mode === 'SETTINGS')}
                  >
                    Settings
                  </button>
                  <div className="p-4 rounded-lg bg-transparent"></div>
              </div>
          </div>
          
          {mode === 'INTAKE' ? (
            <>
              <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
                {renderSectionHeader('Select Intake Item(s)')}
                {intakes.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">No intake items yet</p>
                        <button onClick={() => setIsAddingIntake(true)} className="px-6 py-3 rounded-lg font-medium border" style={{ backgroundColor: '#4f46e5', color: '#ffffff', borderColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid' }}>
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
                                            className="w-full p-3 rounded-lg text-sm transition-colors text-center truncate border"
                                            style={getButtonStyle(isSelected)}
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
                            <button onClick={() => setIsAddingIntake(true)} className="p-3 rounded-lg text-sm transition-colors text-center border" style={getButtonStyle(false)}>Add New...</button>
                        </div>
                )}
              </div>
              {selectedIntakeIds.length > 0 && (
                <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
                  <DateTimeField label="Time of Intake (for all items)" value={intakeTime} onChange={setIntakeTime} />
                </div>
              )}
            </>
          ) : mode === 'READING' ? (
            <>
              <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
                  {renderSectionHeader('Book')}
                  {readingObjects.length === 0 ? (
                      <div className="text-center py-8">
                          <p className="text-gray-400 mb-4">No books yet</p>
                          <button onClick={() => setIsAddingReadingObject(true)} className="px-6 py-3 rounded-lg font-medium border" style={{ backgroundColor: '#4f46e5', color: '#ffffff', borderColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid' }}>
                              Add Your First Book
                          </button>
                      </div>
                  ) : (
                      <div className="grid grid-cols-3 gap-2">
                          {readingObjects.map(book => (
                              <div key={book.id} className="relative group">
                                  <button 
                                      onClick={() => setSelectedReadingObject(book)} 
                                      className="w-full p-3 rounded-lg text-sm transition-colors text-center truncate border"
                                      style={getButtonStyle(selectedReadingObject?.id === book.id)}
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
                          <button onClick={() => setIsAddingReadingObject(true)} className="p-3 rounded-lg text-sm transition-colors text-center border" style={getButtonStyle(false)}>Other...</button>
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
                                        <button key={activity.id} onClick={() => handleToggleNoteActivity(activity.id)} className="p-3 rounded-lg text-sm transition-colors text-center truncate border" style={getButtonStyle(isSelected)}>{activity.name}</button>
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
              <div className="p-4 space-y-3">
                {renderSectionHeader('Activity Type')}
                <div className="grid grid-cols-3 gap-2">
                      {Object.values(ActivityCategory).map(cat => ( 
                        <button 
                          key={cat} 
                          onClick={() => { setSelectedCategory(cat); setSelectedActivity(null); }} 
                          className="p-3 rounded-lg text-sm transition-colors text-center border"
                          style={getButtonStyle(selectedCategory === cat)}
                        >
                          {cat}
                        </button>
                      ))}
                </div>
              </div>
              {selectedCategory && (
                  <div className="p-4 space-y-3">
                      {renderSectionHeader('Activity')}
                      {filteredActivities.length === 0 ? (
                          <div className="text-center py-8">
                              <p className="text-gray-400 mb-4">No activities yet for {selectedCategory}</p>
                                  <button onClick={() => setIsAddingActivity(true)} className="px-6 py-3 rounded-lg font-medium border" style={{ backgroundColor: '#4f46e5', color: '#ffffff', borderColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid' }}>
                                  Create Your First Activity
                              </button>
                          </div>
                      ) : (
                          <div className="grid grid-cols-3 gap-2">
                              {filteredActivities.map(act => (
                                <div key={act.id} className="relative group">
                                  <button 
                                    onClick={() => setSelectedActivity(act)} 
                                        className="w-full p-3 rounded-lg text-sm transition-colors text-center truncate border"
                                        style={getButtonStyle(selectedActivity?.id === act.id)}
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
                                  <button onClick={() => setIsAddingActivity(true)} className="p-3 rounded-lg text-sm transition-colors text-center border" style={getButtonStyle(false)}>Other...</button>
                          </div>
                      )}
                  </div>
                  )}
                </>
              )}
              {selectedActivity && mode === 'TIMER' && (
                <>
                  <div className="p-4 space-y-3">
                      {renderSectionHeader('Timer Settings')}
                      <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => setActiveSlider(activeSlider === 'session' ? null : 'session')} className="p-2 rounded-lg text-center transition-colors flex flex-col justify-center items-center h-20 border" style={getButtonStyle(activeSlider === 'session')}>
                              <span className="text-sm block">Session</span>
                              <span className="font-bold text-lg">{formatDuration(sessionDuration)}</span>
                          </button>
                          <button onClick={() => setActiveSlider(activeSlider === 'break' ? null : 'break')} className="p-2 rounded-lg text-center transition-colors flex flex-col justify-center items-center h-20 border" style={getButtonStyle(activeSlider === 'break')}>
                              <span className="text-sm block">Break</span>
                              <span className="font-bold text-lg">{formatDuration(breakDuration)}</span>
                          </button>
                          <button onClick={() => setActiveSlider(activeSlider === 'count' ? null : 'count')} className="p-2 rounded-lg text-center transition-colors flex flex-col justify-center items-center h-20 border" style={getButtonStyle(activeSlider === 'count')}>
                              <span className="text-sm block">Sessions</span>
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
                      {allTrackers.map(tracker => ( 
                        <button 
                          key={tracker.id} 
                          onClick={() => handleTrackerSelect(tracker.id)} 
                          className="p-3 rounded-lg text-sm transition-colors text-center border"
                          style={getButtonStyle(selectedTrackerId === tracker.id)}
                        >
                          {tracker.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedTrackerId && (<div className="p-4 space-y-3">
                      {renderSectionHeader('Frequency')}
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setTrackerFrequency('every_break')} className="p-3 rounded-lg text-sm transition-colors text-center border" style={getButtonStyle(trackerFrequency === 'every_break')}>Every Break</button>
                        <button onClick={() => setTrackerFrequency('end_of_session')} className="p-3 rounded-lg text-sm transition-colors text-center border" style={getButtonStyle(trackerFrequency === 'end_of_session')}>End of Session</button>
                        <div className="p-3 rounded-lg text-sm text-center border opacity-50" style={getContainerStyle()}>-</div>
                      </div>
                  </div>)}
                  <div className="p-4 space-y-3">
                      {renderSectionHeader('Sound Notifications')}
                      <div className="p-3 rounded-lg border" style={getContainerStyle()}>
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
                                      className="p-2 rounded-lg transition-colors border"
                                      style={getButtonStyle(false, !soundEnabled)}
                                      title="Test sound"
                                  >
                                      🔊
                                  </button>
                                  <button
                                      onClick={() => onSoundEnabledChange(!soundEnabled)}
                                      className="px-3 py-1 rounded text-sm transition-colors border"
                                      style={getButtonStyle(soundEnabled)}
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
              {mode === 'DATA' && (
                <>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      {renderSectionHeader('Data Management')}
                      <button 
                        onClick={() => {
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
                        }}
                        className="px-4 py-2 rounded-lg font-medium transition-colors border"
                        style={{ backgroundColor: '#4f46e5', color: '#ffffff', borderColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid' }}
                      >
                        Download All Data
                      </button>
                    </div>
                    
                    <div className="space-y-4 overflow-y-auto max-h-[60vh]">
                      {logs.length === 0 ? (
                        <div className="text-center text-gray-400 mt-20 flex flex-col items-center h-full justify-center">
                          <p className="text-lg">No saved logs yet.</p>
                          <p className="text-sm">Complete a session or log an intake to see it here.</p>
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {logs.map((log) => {
                            if ('intake' in log) {
                              return <IntakeLogItem key={log.id} log={log as IntakeLog} onDelete={onDeleteIntakeLog} />;
                            }
                            if ('Object' in log && 'bookName' in (log as ReadingLog).Object) {
                              return <ReadingLogItem key={log.id} log={log as ReadingLog} onDelete={onDeleteReadingLog} />;
                            }
                            if ('TimeStart' in log) {
                              return <SessionLogItem key={log.id} log={log as SessionLog} onDelete={onDeleteSessionLog} />;
                            }
                            if ('content' in log) {
                              return <NoteLogItem key={log.id} log={log as NoteLog} onDelete={onDeleteNoteLog} />;
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
                  <div className="p-4 space-y-3">
                    {renderSectionHeader('Settings')}
                    
                    {/* Settings Sub-Navigation */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button 
                        onClick={() => setSettingsSubMode('USER')} 
                        className="p-3 rounded-lg font-medium transition-colors text-sm border"
                        style={getButtonStyle(settingsSubMode === 'USER')}
                      >
                        User
                      </button>
                      <button 
                        onClick={() => setSettingsSubMode('APPLICATION_LOOK')} 
                        className="p-3 rounded-lg font-medium transition-colors text-sm border"
                        style={getButtonStyle(settingsSubMode === 'APPLICATION_LOOK')}
                      >
                        Application Look
                      </button>
                    </div>

                    {/* User Settings Section */}
                    {settingsSubMode === 'USER' && (
                      <div className="p-4 rounded-lg space-y-4 border" style={getContainerStyle()}>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">User Information</h3>
                          <div className="space-y-2">
                            <DetailItem label="Email" value={userEmail} />
                            <DetailItem label="User ID" value={userEmail?.split('@')[0]} />
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-700">
                          <h3 className="text-lg font-semibold text-white mb-2">Account Actions</h3>
                          <button 
                            onClick={onLogout}
                            className="w-full px-4 py-3 rounded-lg font-medium transition-colors border"
                            style={{ backgroundColor: '#dc2626', color: '#ffffff', borderColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid' }}
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Application Look Settings Section */}
                    {settingsSubMode === 'APPLICATION_LOOK' && (
                      <div className="p-4 rounded-lg space-y-6 border" style={getContainerStyle()}>
                        {/* Theme Presets */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Theme</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(themePresets).map(([key, preset]) => (
                              <button
                                key={key}
                                onClick={() => handleThemePreset(key as keyof typeof themePresets)}
                                className="p-4 rounded-lg border-2 transition-colors text-center"
                                style={{
                                  backgroundColor: preset.colors.surface,
                                  color: preset.colors.text,
                                  borderColor: preset.colors.primary
                                }}
                              >
                                <div className="text-base font-medium">{preset.name}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Color Customization */}
                        <div className="pt-4 border-t border-gray-700">
                          <h3 className="text-lg font-semibold text-white mb-3">Custom Colors</h3>
                          <div className="space-y-4">
                            <ColorPicker 
                              label="Background" 
                              value={appColors.background} 
                              onChange={(value) => handleColorChange('background', value)} 
                            />
                            <ColorPicker 
                              label="Surface" 
                              value={appColors.surface} 
                              onChange={(value) => handleColorChange('surface', value)} 
                            />
                            <ColorPicker 
                              label="Primary" 
                              value={appColors.primary} 
                              onChange={(value) => handleColorChange('primary', value)} 
                            />
                            <ColorPicker 
                              label="Text" 
                              value={appColors.text} 
                              onChange={(value) => handleColorChange('text', value)} 
                            />
                            <ColorPicker 
                              label="Accent" 
                              value={appColors.accent} 
                              onChange={(value) => handleColorChange('accent', value)} 
                            />
                          </div>
                        </div>

                        {/* Button Styling */}
                        <div className="pt-4 border-t border-gray-700">
                          <h3 className="text-lg font-semibold text-white mb-3">Button Styling</h3>
                          
                          {/* Unselected Buttons */}
                          <div className="mb-6">
                            <h4 className="text-md font-medium text-white mb-3">Unselected Buttons</h4>
                            <div className="space-y-3">
                              <ColorPicker 
                                label="Background" 
                                value={appColors.buttonUnselected.background} 
                                onChange={(value) => setAppColors(prev => ({ 
                                  ...prev, 
                                  buttonUnselected: { ...prev.buttonUnselected, background: value }
                                }))} 
                              />
                              <ColorPicker 
                                label="Stroke Color" 
                                value={appColors.buttonUnselected.stroke} 
                                onChange={(value) => setAppColors(prev => ({ 
                                  ...prev, 
                                  buttonUnselected: { ...prev.buttonUnselected, stroke: value }
                                }))} 
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white">Stroke Weight</span>
                                <input
                                  type="range"
                                  min="1"
                                  max="5"
                                  value={appColors.buttonUnselected.strokeWeight}
                                  onChange={(e) => setAppColors(prev => ({ 
                                    ...prev, 
                                    buttonUnselected: { ...prev.buttonUnselected, strokeWeight: parseInt(e.target.value) }
                                  }))}
                                  className="w-20"
                                />
                                <span className="text-sm text-white w-8">{appColors.buttonUnselected.strokeWeight}px</span>
                              </div>
                              <ColorPicker 
                                label="Text Color" 
                                value={appColors.buttonUnselected.text} 
                                onChange={(value) => setAppColors(prev => ({ 
                                  ...prev, 
                                  buttonUnselected: { ...prev.buttonUnselected, text: value }
                                }))} 
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white">Font Weight</span>
                                <select
                                  value={appColors.buttonUnselected.fontWeight}
                                  onChange={(e) => setAppColors(prev => ({ 
                                    ...prev, 
                                    buttonUnselected: { ...prev.buttonUnselected, fontWeight: e.target.value }
                                  }))}
                                  className="px-2 py-1 bg-gray-700 text-white text-xs rounded border border-gray-600"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="bold">Bold</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Selected Buttons */}
                          <div>
                            <h4 className="text-md font-medium text-white mb-3">Selected Buttons</h4>
                            <div className="space-y-3">
                              <ColorPicker 
                                label="Background" 
                                value={appColors.buttonSelected.background} 
                                onChange={(value) => setAppColors(prev => ({ 
                                  ...prev, 
                                  buttonSelected: { ...prev.buttonSelected, background: value }
                                }))} 
                              />
                              <ColorPicker 
                                label="Stroke Color" 
                                value={appColors.buttonSelected.stroke} 
                                onChange={(value) => setAppColors(prev => ({ 
                                  ...prev, 
                                  buttonSelected: { ...prev.buttonSelected, stroke: value }
                                }))} 
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white">Stroke Weight</span>
                                <input
                                  type="range"
                                  min="1"
                                  max="5"
                                  value={appColors.buttonSelected.strokeWeight}
                                  onChange={(e) => setAppColors(prev => ({ 
                                    ...prev, 
                                    buttonSelected: { ...prev.buttonSelected, strokeWeight: parseInt(e.target.value) }
                                  }))}
                                  className="w-20"
                                />
                                <span className="text-sm text-white w-8">{appColors.buttonSelected.strokeWeight}px</span>
                              </div>
                              <ColorPicker 
                                label="Text Color" 
                                value={appColors.buttonSelected.text} 
                                onChange={(value) => setAppColors(prev => ({ 
                                  ...prev, 
                                  buttonSelected: { ...prev.buttonSelected, text: value }
                                }))} 
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white">Font Weight</span>
                                <select
                                  value={appColors.buttonSelected.fontWeight}
                                  onChange={(e) => setAppColors(prev => ({ 
                                    ...prev, 
                                    buttonSelected: { ...prev.buttonSelected, fontWeight: e.target.value }
                                  }))}
                                  className="px-2 py-1 bg-gray-700 text-white text-xs rounded border border-gray-600"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="bold">Bold</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Live Preview */}
                        <div className="pt-4 border-t border-gray-700">
                          <h3 className="text-lg font-semibold text-white mb-3">Live Preview</h3>
                          <div 
                            className="p-4 rounded-lg border-2 border-gray-600"
                            style={{ backgroundColor: appColors.background }}
                          >
                            <div className="space-y-4">
                              <div 
                                className="p-3 rounded-lg"
                                style={{ backgroundColor: appColors.surface }}
                              >
                                <h4 style={{ color: appColors.text }} className="font-semibold mb-3">Button Hierarchy</h4>
                                <div className="space-y-2">
                                  <button 
                                    className="px-4 py-2 rounded-lg transition-colors"
                                    style={getButtonStyle(false)}
                                  >
                                    Unselected Button
                                  </button>
                                  <button 
                                    className="px-4 py-2 rounded-lg transition-colors"
                                    style={getButtonStyle(true)}
                                  >
                                    Selected Button
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span style={{ color: appColors.text }} className="text-sm">Accent color:</span>
                                <div 
                                  className="w-6 h-6 rounded"
                                  style={{ backgroundColor: appColors.accent }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Sound Settings */}
                        <div className="pt-4 border-t border-gray-700">
                          <h3 className="text-lg font-semibold text-white mb-2">Sound Settings</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Timer Sound</span>
                            <button 
                              onClick={() => onSoundEnabledChange(!soundEnabled)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                soundEnabled 
                                  ? 'bg-green-600 text-white hover:bg-green-700' 
                                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                              }`}
                            >
                              {soundEnabled ? 'Enabled' : 'Disabled'}
                            </button>
                          </div>
                        </div>
                        
                        {/* App Information */}
                        <div className="pt-4 border-t border-gray-700">
                          <h3 className="text-lg font-semibold text-white mb-2">App Information</h3>
                          <div className="space-y-2 text-sm text-gray-400">
                            <p>Version: 1.0.0</p>
                            <p>Productivity Timer</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </main>

      <footer 
        className="p-2 sm:p-4 border-t fixed bottom-0 left-0 right-0 z-10 pb-safe"
        style={{ 
          backgroundColor: appColors.background,
          borderColor: appColors.surface,
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))'
        }}
      >
        <button 
          onClick={handleAction} 
          disabled={actionButtonDisabled} 
          className="w-full p-3 sm:p-4 rounded-xl font-bold text-base sm:text-lg transition-colors disabled:cursor-not-allowed border min-h-[44px]"
          style={getButtonStyle(false, actionButtonDisabled)}
        >
            {actionButtonText}
        </button>
      </footer>
      {isAddingActivity && selectedCategory && <AddActivityModal category={selectedCategory} onClose={() => setIsAddingActivity(false)} onSave={handleAddNewActivityAndSelect} />}
      {isAddingIntake && <AddIntakeModal onClose={() => setIsAddingIntake(false)} onSave={handleAddNewIntakeAndSelect} />}
      {isAddingReadingObject && <AddReadingModal onClose={() => setIsAddingReadingObject(false)} onSave={handleAddNewReadingObjectAndSelect} />}
    </div>
    </>
  );
};

export default SetupScreen;