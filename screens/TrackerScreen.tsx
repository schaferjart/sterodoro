
import React, { useState, useMemo } from 'react';
import { SessionConfig, PerformanceUpdate, ActivityObject, ActivityCategory } from '../types';
import { TRACKERS } from '../constants';
import Slider from '../components/Slider';
import { ChevronDownIcon } from '../components/Icons';


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
            <div className="bg-gray-900 rounded-t-2xl p-4 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-center mb-4">Change Activity</h3>
                <div className="overflow-y-auto space-y-4">
                    {Object.entries(groupedActivities).map(([category, acts]) => (
                        <div key={category}>
                            <h4 className="font-bold text-indigo-400 mb-2">{category}</h4>
                            <div className="space-y-2">
                                {acts.map(act => (
                                    <button
                                        key={act.id}
                                        onClick={() => { onSelect(act); onClose(); }}
                                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${currentActivity.id === act.id ? 'bg-indigo-600' : 'bg-gray-800'}`}
                                    >
                                        {act.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
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
}

const TrackerScreen: React.FC<TrackerScreenProps> = ({ config, onSave, activities, isFinalTracking }) => {
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
      timestamp: Date.now(),
      metrics: metrics,
    }, isFinalTracking ? undefined : nextActivity);
  };

  return (
    <div className="flex flex-col h-full bg-black text-white p-4 animate-fade-in relative">
      <header className="text-center py-4">
        <h1 className="text-2xl font-bold">Performance Tracker</h1>
        <p className="text-gray-400">{isFinalTracking ? "How was the session?" : "How are you feeling?"}</p>
      </header>
      
      {!isFinalTracking && (
        <div className="my-4 text-center">
          <p className="text-sm text-gray-400 mb-1">Next up:</p>
          <button onClick={() => setIsChangingActivity(true)} className="flex items-center justify-center gap-2 mx-auto text-lg text-indigo-300 bg-gray-800/50 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              {nextActivity.name}
              <ChevronDownIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <main className="flex-grow flex flex-col justify-center space-y-8 px-4">
        {Object.keys(metrics).map(metricName => (
          <div key={metricName}>
            <div className="flex justify-between items-baseline mb-3">
              <span className="font-semibold">{metricName}</span>
              <span className="text-indigo-400 font-mono text-lg">{metrics[metricName]}/10</span>
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
      </main>

      <footer className="p-4">
        <button
          onClick={handleSave}
          className="w-full p-4 rounded-xl bg-indigo-600 text-white font-bold text-lg transition-colors hover:bg-indigo-700"
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
