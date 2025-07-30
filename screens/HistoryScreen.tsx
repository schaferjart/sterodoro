
import React, { useState } from 'react';
import { formatLocalDate, formatLocalDateOnly, getRelativeTimeString } from '../lib/time-utils';
import { SessionLog, IntakeLog, AppLog, ReadingLog, NoteLog } from '../types';
import { ChevronLeftIcon, NoteIcon, DownloadIcon } from '../components/Icons';

const formatDateTime = (timestamp: string | number) => {
  return formatLocalDate(timestamp, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (ms: number) => {
  if (!ms || ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const DetailItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return <p className="text-gray-300"><span className="font-semibold text-gray-400">{label}:</span> {value}</p>;
};

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
            <p className="font-semibold text-indigo-400">{formatDuration(durationMs)}</p>
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
              <h4 className="font-bold text-gray-200 mb-1 flex items-center gap-2">
                <NoteIcon className="w-4 h-4"/> Notes ({log.Notes.length})
              </h4>
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
              <p className="font-semibold text-cyan-400">{formatDuration(durationMs)}</p>
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
                <h4 className="font-bold text-gray-200 mb-1 flex items-center gap-2">
                    <NoteIcon className="w-4 h-4"/> Notes ({log.Notes.length})
                </h4>
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
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{log.title || 'Note'}</p>
              <p className="text-sm text-gray-400 truncate">{log.content}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-sm text-gray-400">{formatDateTime(log.timestamp)}</p>
            </div>
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete this note log "${log.title || 'Note'}"?`)) {
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
              <h4 className="font-bold text-gray-200 mb-1 flex items-center gap-2">
                  <NoteIcon className="w-4 h-4"/> Content
              </h4>
              <div className="pl-4 border-l-2 border-gray-700 space-y-2 text-xs">
                  {log.title && <DetailItem label="Title" value={log.title} />}
                  <p className="text-gray-300 whitespace-pre-wrap">{log.content}</p>
              </div>
            </div>

            {log.relatedActivities && log.relatedActivities.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-200 mb-1">Related Activities</h4>
                <div className="pl-4 border-l-2 border-gray-700 space-y-1 text-xs">
                  {log.relatedActivities.map(act => (
                    <p key={act.id} className="text-gray-300">
                      <span className="font-semibold text-indigo-400">{act.category}:</span> {act.name}
                    </p>
                  ))}
                </div>
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


const HistoryScreen: React.FC<{ 
  logs: AppLog[]; 
  onBack: () => void;
  onDeleteSessionLog: (id: string) => Promise<void>;
  onDeleteIntakeLog: (id: string) => Promise<void>;
  onDeleteReadingLog: (id: string) => Promise<void>;
  onDeleteNoteLog: (id: string) => Promise<void>;
}> = ({ logs, onBack, onDeleteSessionLog, onDeleteIntakeLog, onDeleteReadingLog, onDeleteNoteLog }) => {
  const handleExport = () => {
    if (logs.length === 0) return;

    try {
      const jsonString = JSON.stringify(logs, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = formatLocalDateOnly(new Date());
      link.href = url;
      link.download = `sterodoro-logs_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export logs:", error);
      alert("Could not export logs. See console for details.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <header className="p-4 border-b border-gray-800 flex items-center justify-center relative sticky top-0 bg-black z-10">
        <button onClick={onBack} className="absolute left-4 p-2 rounded-full hover:bg-gray-800 transition-colors" aria-label="Back to setup">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">History</h1>
        <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="absolute right-4 p-2 rounded-full text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            aria-label="Export logs"
          >
            <DownloadIcon className="w-6 h-6" />
        </button>
      </header>
      <main className="flex-grow overflow-y-auto p-4">
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
      </main>
    </div>
  );
};

export default HistoryScreen;