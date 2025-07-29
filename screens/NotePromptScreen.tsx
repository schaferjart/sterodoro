
import React, { useState } from 'react';
import { ChevronLeftIcon } from '../components/Icons';

interface NotePromptScreenProps {
  onSave: (note: string) => void;
  onCancel: () => void;
  isFinalNote: boolean;
}

const NotePromptScreen: React.FC<NotePromptScreenProps> = ({ onSave, onCancel, isFinalNote }) => {
  const [noteText, setNoteText] = useState('');

  const handleSave = () => {
    // Also save if note is empty, to continue the flow.
    // The parent can decide if an empty note is saved.
    onSave(noteText.trim());
  };

  return (
    <div className="flex flex-col h-full bg-black text-white animate-fade-in">
      <header className="p-4 border-b border-gray-800 flex items-center justify-center relative sticky top-0 bg-black z-10">
        <button onClick={onCancel} className="absolute left-4 p-2 rounded-full hover:bg-gray-800 transition-colors" aria-label="Cancel">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">{isFinalNote ? 'Final Note' : 'Break Note'}</h1>
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
          {isFinalNote ? "Save & Finish" : "Save & Start Break"}
        </button>
      </footer>
    </div>
  );
};

export default NotePromptScreen;
