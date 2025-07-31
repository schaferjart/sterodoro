
import React, { useState, useMemo } from 'react';
import { getCurrentTimestamp } from '../lib/time-utils';
import { SessionConfig, PerformanceUpdate, ActivityObject, ActivityCategory } from '../types';
import { TRACKERS } from '../constants';
import Slider from '../components/Slider';
import { ChevronDownIcon } from '../components/Icons';
import UserID from '../components/UserID';


const ChangeActivityModal: React.FC<{
    activities: ActivityObject[];
    currentActivity: ActivityObject;
    onSelect: (activity: ActivityObject) => void;
    onClose: () => void;
}> = ({ activities, currentActivity, onSelect, onClose }) => {
    const groupedActivities = useMemo(() => {
        return activities.reduce((acc, act) => {
            (acc[act.category] = acc[act.category] || []).push(act);
            return acc;
        }, {} as Record<ActivityCategory, ActivityObject[]>);
    }, [activities]);

    return (
        <div className="absolute inset-0 bg-black/80 flex flex-col justify-end z-20 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900 rounded-t-2xl p-4 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Change Activity</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-2"
                    >
                        ×
                    </button>
                </div>
                <div className="overflow-y-auto space-y-4 flex-1">
                    {Object.entries(groupedActivities).map(([category, acts]) => (
                        <div key={category}>
                            <h4 className="font-bold text-indigo-400 mb-2 sticky top-0 bg-gray-900 py-1">{category}</h4>
                            <div className="space-y-2">
                                {acts.map(act => (
                                    <button
                                        key={act.id}
                                        onClick={() => { onSelect(act); onClose(); }}
                                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${currentActivity.id === act.id ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                                    >
                                        {act.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pt-4 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="w-full p-3 rounded-lg bg-gray-700 text-white font-medium transition-colors hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};


interface TrackerScreenProps {
  config: SessionConfig;
  onSave: (update: PerformanceUpdate, newActivity?: ActivityObject) => void;
  activities: ActivityObject[];
  isFinalTracking: boolean;
  userEmail?: string;
}

const TrackerScreen: React.FC<TrackerScreenProps> = ({ config, onSave, activities, isFinalTracking, userEmail }) => {
  const trackerMetrics = useMemo(() => {
    if (!config.trackerSettings.selectedTrackerId) return [];
    const tracker = TRACKERS.find(t => t.id === config.trackerSettings.selectedTrackerId);
    return tracker ? tracker.metrics : [];
  }, [config.trackerSettings.selectedTrackerId]);

  const initialMetrics = useMemo(() => trackerMetrics.reduce((acc, name) => {
    acc[name] = 5; // Default to 5 on a 0-10 scale
    return acc;
  }, {} as Record<string, number>), [trackerMetrics]);
  
  const [metrics, setMetrics] = useState<Record<string, number>>(initialMetrics);
  const [nextActivity, setNextActivity] = useState<ActivityObject>(config.activity);
  const [isChangingActivity, setIsChangingActivity] = useState(false);

  const handleSliderChange = (name: string, value: number) => {
    setMetrics(prevMetrics => ({
        ...prevMetrics,
        [name]: value
    }));
  };

  const handleSave = () => {
    onSave({
      timestamp: getCurrentTimestamp(),
      metrics: metrics,
    }, isFinalTracking ? undefined : nextActivity);
  };

  return (
    <div className="flex flex-col h-full bg-black text-white animate-fade-in relative overflow-hidden safe-area-inset">
      {/* Fixed Header */}
      <header className="text-center py-4 px-4 flex-shrink-0 bg-black">
        <h1 className="text-xl sm:text-2xl font-bold">Performance Tracker</h1>
        <p className="text-gray-400 text-sm sm:text-base">{isFinalTracking ? "How was the session?" : "How are you feeling?"}</p>
      </header>
      
      {/* Next Activity Section - Fixed */}
      {!isFinalTracking && (
        <div className="text-center py-2 px-4 flex-shrink-0">
          <p className="text-sm text-gray-400 mb-1">Next up:</p>
          <button onClick={() => setIsChangingActivity(true)} className="flex items-center justify-center gap-2 mx-auto text-lg text-indigo-300 bg-gray-800/50 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              {nextActivity.name}
              <ChevronDownIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 sm:space-y-6 min-h-0">
        {Object.keys(metrics).map(metricName => (
          <div key={metricName} className="min-h-[70px] sm:min-h-[80px] flex flex-col justify-center">
            <div className="flex justify-between items-baseline mb-2 sm:mb-3">
              <span className="font-semibold text-sm sm:text-base">{metricName}</span>
              <span className="text-indigo-400 font-mono text-base sm:text-lg">{metrics[metricName]}/10</span>
            </div>
            <Slider
              min={0}
              max={10}
              step={1}
              value={metrics[metricName]}
              onChange={(value) => handleSliderChange(metricName, value)}
              label={''}
            />
          </div>
        ))}
        
        {/* Add some bottom padding to ensure content doesn't get cut off */}
        <div className="h-6 sm:h-4"></div>
      </main>

      {/* Fixed Footer */}
      <footer className="p-4 flex-shrink-0 border-t border-gray-800 bg-black shadow-lg">
        <button
          onClick={handleSave}
          className="w-full p-4 rounded-xl bg-indigo-600 text-white font-bold text-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800 shadow-lg"
        >
          {isFinalTracking ? "Save & Finish" : "Save & Start Break"}
        </button>
      </footer>

      {isChangingActivity && (
          <ChangeActivityModal
            activities={activities}
            currentActivity={nextActivity}
            onSelect={setNextActivity}
            onClose={() => setIsChangingActivity(false)}
          />
      )}
    </div>
  );
};

export default TrackerScreen;
