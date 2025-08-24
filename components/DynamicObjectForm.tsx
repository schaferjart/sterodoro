import React, { useState, useEffect } from 'react';
import { ObjectDefinition, ObjectInstance } from '../types/flexible-database';
import { useDataStore } from '../lib/stores/dataStore';
import { colors, radii, spacing, strokes } from '../lib/design-system';

import ShortTextInput from './form-elements/ShortTextInput';
import LongTextInput from './form-elements/LongTextInput';
import NumberInput from './form-elements/NumberInput';
import BooleanInput from './form-elements/BooleanInput';

interface DynamicObjectFormProps {
  definition: ObjectDefinition;
  instance?: ObjectInstance; // For editing existing objects
  onSubmit: (formData: Record<string, any>) => void;
  onCancel: () => void;
  submitButtonText?: string;
}

const DynamicObjectForm: React.FC<DynamicObjectFormProps> = ({
  definition,
  instance,
  onSubmit,
  onCancel,
  submitButtonText = 'Submit',
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const systemFunctions = useDataStore((state) => state.systemFunctions);

  // Initialize form data when definition or instance changes
  useEffect(() => {
    const initialData: Record<string, any> = {};
    definition.structure.forEach(field => {
      const systemFunction = systemFunctions.find(f => f.id === field.systemFunctionId);
      let defaultValue: any = ''; // Default for text
      if (systemFunction) {
        switch (systemFunction.data_type) {
          case 'NUMERIC':
            defaultValue = 0;
            break;
          case 'BOOLEAN':
            defaultValue = false;
            break;
        }
      }
      initialData[field.fieldName] = instance?.data[field.fieldName] ?? defaultValue;
    });
    setFormData(initialData);
  }, [definition, instance, systemFunctions]);

  const handleChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderField = (field: ObjectDefinition['structure'][0]) => {
    const systemFunction = systemFunctions.find(f => f.id === field.systemFunctionId);
    if (!systemFunction) {
      return <div key={field.fieldName}>Error: Unknown field type for "{field.fieldName}"</div>;
    }

    const commonProps = {
      key: field.fieldName,
      label: field.fieldName,
      value: formData[field.fieldName],
    };

    switch (systemFunction.component_key) {
      case 'ShortText':
        return <ShortTextInput {...commonProps} onChange={(value) => handleChange(field.fieldName, value)} />;
      case 'LongText':
        return <LongTextInput {...commonProps} onChange={(value) => handleChange(field.fieldName, value)} />;
      case 'Number':
        return <NumberInput {...commonProps} onChange={(value) => handleChange(field.fieldName, value)} />;
      case 'Boolean':
        return <BooleanInput {...commonProps} onChange={(value) => handleChange(field.fieldName, value)} />;
      // Add cases for 'Date', 'Select', 'MultiSelect' here later
      default:
        return <p key={field.fieldName}>Unsupported field type: {systemFunction.name}</p>;
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: colors.surface, padding: spacing[6], borderRadius: radii.lg }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: colors.text }}>{definition.name}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {definition.structure.map(renderField)}
      </div>
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button
          type="submit"
          style={{
            backgroundColor: colors.primary,
            color: 'white',
            padding: `${spacing[2]} ${spacing[4]}`,
            borderRadius: radii.md,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {submitButtonText}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            backgroundColor: 'transparent',
            color: colors.text,
            padding: `${spacing[2]} ${spacing[4]}`,
            borderRadius: radii.md,
            border: `${strokes[1]} solid ${colors.border}`,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DynamicObjectForm;
