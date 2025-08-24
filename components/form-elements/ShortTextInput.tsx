import React from 'react';
import { fontSizes, spacing, radii, strokes, colors } from '../../lib/design-system';

interface ShortTextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const ShortTextInput: React.FC<ShortTextInputProps> = ({ label, value, onChange, placeholder }) => {
  const style = (styles: React.CSSProperties): React.CSSProperties => styles;

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
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

export default ShortTextInput;
