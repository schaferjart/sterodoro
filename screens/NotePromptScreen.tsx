import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '../components/Icons';
import { useSessionStore } from '../lib/stores/sessionStore';

const NotePromptScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isFinalTracking, addSessionNote, resetSession, setTimerState, config } = useSessionStore();
  const [noteText, setNoteText] = useState('');

  const handleSave = () => {
    if (noteText.trim()) {
      addSessionNote({
        timestamp: new Date().toISOString(),
        note: noteText.trim(),
      });
    }

    if (isFinalTracking) {
      resetSession();
      navigate('/');
    } else {
      setTimerState({
        isBreak: true,
        timeRemaining: config?.timerSettings.breakDuration ?? 300,
        madeTime: 0,
      });
      navigate('/timer');
    }
  };

  const handleCancel = () => {
    if (isFinalTracking) {
        resetSession();
        navigate('/');
    } else {
        setTimerState({
            isBreak: true,
            timeRemaining: config?.timerSettings.breakDuration ?? 300,
            madeTime: 0,
        });
        navigate('/timer');
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white animate-fade-in">
      <header className="p-4 border-b border-gray-800 flex items-center justify-center relative sticky top-0 bg-black z-10">
        <button onClick={handleCancel} className="absolute left-4 p-2 rounded-full hover:bg-gray-800 transition-colors" aria-label="Cancel">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">{isFinalTracking ? 'Final Note' : 'Break Note'}</h1>
      </header>
      <main className="flex-grow p-4 flex flex-col">
        <label htmlFor="note-textarea" className="text-gray-400 mb-2">How was the last session? Add a note.</label>
        <textarea
          id="note-textarea"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="w-full flex-grow bg-gray-800 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Type your thoughts here..."
          autoFocus
        />
      </main>
      <footer className="p-4 border-t border-gray-800">
        <button onClick={handleSave} className="w-full p-4 rounded-xl bg-indigo-600 text-white font-bold text-lg transition-colors hover:bg-indigo-700">
          {isFinalTracking ? "Save & Finish" : "Save & Start Break"}
        </button>
      </footer>
    </div>
  );
};

export default NotePromptScreen;
