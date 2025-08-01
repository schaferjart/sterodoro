import React from 'react';

interface ModalInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}

const ModalInputField: React.FC<ModalInputFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'text' 
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-theme-text mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-theme-surface text-theme-text p-2 rounded-lg border border-theme-border focus:outline-none focus:ring-2 focus:ring-theme-border focus:border-theme-border modal-input min-h-[44px]"
      />
    </div>
  );
};

export default ModalInputField; 