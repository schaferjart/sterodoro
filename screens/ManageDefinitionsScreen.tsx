import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../lib/stores/dataStore';
import { ObjectDefinition, FieldDefinition, SystemFunction } from '../types/flexible-database';
import { colors, fontSizes, radii, spacing, strokes } from '../lib/design-system';

const NewDefinitionForm: React.FC<{
    systemFunctions: SystemFunction[];
    onCreate: (definition: Omit<ObjectDefinition, 'id' | 'user_id' | 'created_at'>) => void;
    onCancel: () => void;
}> = ({ systemFunctions, onCreate, onCancel }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [fields, setFields] = useState<Omit<FieldDefinition, 'systemFunctionId'> & { systemFunctionId: string | '' }>([
        { fieldName: '', systemFunctionId: '', isMandatory: false }
    ]);

    const handleFieldChange = (index: number, prop: keyof typeof fields[0], value: any) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [prop]: value };
        setFields(newFields);
    };

    const addField = () => {
        setFields([...fields, { fieldName: '', systemFunctionId: '', isMandatory: false }]);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            alert('Definition name is required.');
            return;
        }
        const finalFields = fields
            .filter(f => f.fieldName.trim() && f.systemFunctionId)
            .map(f => f as FieldDefinition);

        if (finalFields.length === 0) {
            alert('You must define at least one field.');
            return;
        }

        onCreate({
            name,
            description,
            structure: finalFields,
        });
    };

    return (
        <div style={{ backgroundColor: colors.surface, padding: spacing[6], borderRadius: radii.lg, marginBottom: spacing[8] }}>
            <h2 style={{ fontSize: fontSizes.xl, marginBottom: spacing[4] }}>New Object Definition</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                <input
                    type="text"
                    placeholder="Definition Name (e.g., Book, Movie, Workout)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ padding: spacing[2], fontSize: fontSizes.base, borderRadius: radii.DEFAULT }}
                />
                <textarea
                    placeholder="Description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    style={{ padding: spacing[2], fontSize: fontSizes.base, borderRadius: radii.DEFAULT }}
                />

                <h3 style={{ fontSize: fontSizes.lg, marginTop: spacing[4], borderTop: `${strokes[1]} solid ${colors.border}`, paddingTop: spacing[4] }}>Fields</h3>
                {fields.map((field, index) => (
                    <div key={index} style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Field Name"
                            value={field.fieldName}
                            onChange={(e) => handleFieldChange(index, 'fieldName', e.target.value)}
                            style={{ flex: 1, padding: spacing[2], borderRadius: radii.DEFAULT }}
                        />
                        <select
                            value={field.systemFunctionId}
                            onChange={(e) => handleFieldChange(index, 'systemFunctionId', e.target.value)}
                            style={{ flex: 1, padding: spacing[2], borderRadius: radii.DEFAULT }}
                        >
                            <option value="" disabled>Select a type</option>
                            {systemFunctions.map(sf => (
                                <option key={sf.id} value={sf.id}>{sf.name}</option>
                            ))}
                        </select>
                        <label style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                            <input
                                type="checkbox"
                                checked={field.isMandatory}
                                onChange={(e) => handleFieldChange(index, 'isMandatory', e.target.checked)}
                            />
                            Required
                        </label>
                        <button onClick={() => removeField(index)}>&times;</button>
                    </div>
                ))}
                <button onClick={addField}>+ Add Field</button>
            </div>
            <div style={{ marginTop: spacing[6], display: 'flex', gap: spacing[4] }}>
                <button onClick={handleSubmit}>Create Definition</button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
};


const ManageDefinitionsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { objectDefinitions, fetchObjectDefinitions, createObjectDefinition, deleteObjectDefinition, systemFunctions } = useDataStore();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Data is initialized in the store, just need to fetch the latest definitions
    fetchObjectDefinitions();
  }, [fetchObjectDefinitions]);

  const handleCreateDefinition = async (definition: Omit<ObjectDefinition, 'id' | 'user_id' | 'created_at'>) => {
    try {
      await createObjectDefinition(definition);
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create definition", error);
      alert("Error: Could not create definition.");
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Object Definitions</h1>
        <button onClick={() => navigate('/')}>Back to Dashboard</button>
      </header>

      {!isCreating && (
        <button onClick={() => setIsCreating(true)} style={{ marginBottom: '1rem' }}>
          + Create New Definition
        </button>
      )}

      {isCreating && (
        <NewDefinitionForm
            systemFunctions={systemFunctions}
            onCreate={handleCreateDefinition}
            onCancel={() => setIsCreating(false)}
        />
      )}

      <div>
        <h2>Your Definitions</h2>
        {objectDefinitions.length === 0 ? (
            <p>You have no object definitions. Click the button above to create one.</p>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: spacing[4] }}>
            {objectDefinitions.map(def => (
                <div key={def.id} style={{ border: `${strokes[1]} solid ${colors.border}`, padding: spacing[4], borderRadius: radii.md }}>
                <h3 style={{ fontSize: fontSizes.lg, fontWeight: 'bold' }}>{def.name}</h3>
                <p style={{ color: colors['text-secondary'], marginBottom: spacing[3] }}>{def.description}</p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {def.structure.map(field => (
                        <li key={field.fieldName}>{field.fieldName} {field.isMandatory && '*'}</li>
                    ))}
                </ul>
                <button onClick={() => deleteObjectDefinition(def.id)} style={{color: 'red', marginTop: '1rem'}}>Delete</button>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default ManageDefinitionsScreen;
