
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  label: string;
}

const Slider: React.FC<SliderProps> = ({ min, max, step, value, onChange, label }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getPercentage = useCallback(() => {
    return ((value - min) / (max - min)) * 100;
  }, [value, min, max]);

  const handleValueChange = useCallback((e: MouseEvent | TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    const newValue = Math.round(((percentage / 100) * (max - min) + min) / step) * step;
    onChange(newValue);
  }, [min, max, step, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleValueChange(e);
    }
  }, [isDragging, handleValueChange]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) {
      handleValueChange(e);
    }
  }, [isDragging, handleValueChange]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleValueChange(e.nativeEvent);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleValueChange(e.nativeEvent);
  };


  return (
    <div className="w-full px-4" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
      <div ref={sliderRef} className="relative w-full h-2 bg-gray-700 rounded-full cursor-pointer">
        <div style={{ width: `${getPercentage()}%` }} className="absolute h-2 bg-indigo-500 rounded-full"></div>
        <div style={{ left: `calc(${getPercentage()}% - 12px)` }} className="absolute -top-2 w-6 h-6 bg-white rounded-full shadow border-2 border-indigo-500 flex items-center justify-center">
          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
        </div>
      </div>
      <p className="text-center text-sm text-gray-400 mt-3">{label}</p>
    </div>
  );
};

export default Slider;
