import React from 'react';
import { fontSizes, spacing, radii, strokes, colors } from '../../lib/design-system';

interface NumberInputProps {
  label: string;
  value: number | string; // Can be string while user is typing
  onChange: (value: number) => void;
  placeholder?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, placeholder }) => {
  const style = (styles: React.CSSProperties): React.CSSProperties => styles;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value);
    if (!isNaN(num)) {
      onChange(num);
    } else if (e.target.value === '') {
      onChange(0); // Or handle empty state as you see fit
    }
  };

  return (
    <div>
      <label
        style={style({
          display: 'block',
          marginBottom: spacing[1],
          fontSize: fontSizes.sm,
          color: colors['text-secondary'],
          textTransform: 'capitalize',
        })}
      >
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={handleChange}
        placeholder={placeholder || `Enter ${label}...`}
        style={style({
          width: '100%',
          padding: `${spacing[2]} ${spacing[3]}`,
          fontSize: fontSizes.base,
          borderRadius: radii.DEFAULT,
          border: `${strokes[1]} solid ${colors.border}`,
          backgroundColor: colors.surface,
          color: colors.text,
          transition: 'border-color 0.2s, box-shadow 0.2s',
        })}
        onFocus={e => {
            e.currentTarget.style.borderColor = colors.primary;
            e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
        }}
        onBlur={e => {
            e.currentTarget.style.borderColor = colors.border;
            e.currentTarget.style.boxShadow = 'none';
        }}
      />
    </div>
  );
};

export default NumberInput;
