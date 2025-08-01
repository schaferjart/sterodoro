import React from 'react';

interface ModalSelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const ModalSelectField: React.FC<ModalSelectFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  options,
  placeholder 
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-theme-text mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-theme-surface text-theme-text p-2 rounded-lg border border-theme-border focus:outline-none focus:ring-2 focus:ring-theme-border focus:border-theme-border modal-input min-h-[44px]"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModalSelectField; 