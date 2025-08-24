import React from 'react';
import { fontSizes, spacing, radii, strokes, colors } from '../../lib/design-system';

interface BooleanInputProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const BooleanInput: React.FC<BooleanInputProps> = ({ label, value, onChange }) => {
  const style = (styles: React.CSSProperties): React.CSSProperties => styles;

  return (
    <div style={style({ display: 'flex', alignItems: 'center', gap: spacing[2] })}>
      <input
        type="checkbox"
        id={label}
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={style({
            width: spacing[4],
            height: spacing[4],
            accentColor: colors.primary,
        })}
      />
      <label
        htmlFor={label}
        style={style({
          fontSize: fontSizes.base,
          color: colors.text,
          textTransform: 'capitalize',
          cursor: 'pointer',
        })}
      >
        {label}
      </label>
    </div>
  );
};

export default BooleanInput;
