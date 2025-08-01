import React from 'react';

interface ModalDateTimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ModalDateTimeField: React.FC<ModalDateTimeFieldProps> = ({ 
  label, 
  value, 
  onChange 
}) => {
  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-theme-text mb-1">
        {label}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-theme-surface text-theme-text p-2 rounded-lg border border-theme-border focus:outline-none focus:ring-2 focus:ring-theme-border focus:border-theme-border modal-input min-h-[44px]"
      />
    </div>
  );
};

export default ModalDateTimeField; 