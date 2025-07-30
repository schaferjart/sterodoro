import React, { useState, useRef } from 'react';

const SoundTest: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const testSound = async () => {
    if (!audioRef.current) return;
    
    setIsPlaying(true);
    setError(null);
    
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      
      // Reset after sound plays
      setTimeout(() => {
        setIsPlaying(false);
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play sound');
      setIsPlaying(false);
    }
  };

  const testBackgroundSound = async () => {
    try {
      // Test if we can play sound when page is not focused
      const audio = new Audio('/sound.mp3');
      audio.currentTime = 0;
      await audio.play();
      
      console.log('Background sound test successful');
    } catch (err) {
      console.error('Background sound test failed:', err);
      setError('Background sound failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-2">🔊 Sound Test</h3>
      
      <div className="space-y-3">
        <div>
          <button
            onClick={testSound}
            disabled={isPlaying}
            className={`px-3 py-2 rounded text-sm ${
              isPlaying 
                ? 'bg-gray-600 text-gray-400' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isPlaying ? 'Playing...' : 'Test Sound'}
          </button>
        </div>
        
        <div>
          <button
            onClick={testBackgroundSound}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Test Background Sound
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900 p-2 rounded text-red-200 text-sm">
            Error: {error}
          </div>
        )}
        
        <div className="text-gray-400 text-xs">
          <div>• Test Sound: Plays sound file directly</div>
          <div>• Background Sound: Tests sound when app not focused</div>
          <div>• Check console for detailed logs</div>
        </div>
      </div>
      
      <audio ref={audioRef} src="/sound.mp3" preload="auto" style={{ display: 'none' }} />
    </div>
  );
};

export default SoundTest; 