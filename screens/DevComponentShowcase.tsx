import React, { useState } from 'react';
import { fonts, fontSizes, spacing, radii, strokes, colors } from '../lib/design-system';
import { ObjectDefinition } from '../types/flexible-database';
import DynamicObjectForm from '../components/DynamicObjectForm';
import { useDataStore } from '../lib/stores/dataStore';

const style = (styles: React.CSSProperties): React.CSSProperties => styles;

const ShowcaseHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div style={style({ marginBottom: spacing[6], borderBottom: `${strokes[1]} solid ${colors.border}`, paddingBottom: spacing[3] })}>
        <h1 style={style({ fontSize: fontSizes['2xl'], fontWeight: 'bold', color: colors.text })}>{title}</h1>
        <p style={style({ fontSize: fontSizes.base, color: colors['text-secondary'], marginTop: spacing[1] })}>{subtitle}</p>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section style={style({ marginBottom: spacing[8] })}>
        <h2 style={style({ fontSize: fontSizes.xl, fontWeight: 600, color: colors.text, marginBottom: spacing[4] })}>{title}</h2>
        <div style={style({ backgroundColor: colors.surface, padding: spacing[4], borderRadius: radii.md })}>
            {children}
        </div>
    </section>
);

const ColorSwatch: React.FC<{ name: string; value: string }> = ({ name, value }) => (
    <div style={style({ display: 'flex', alignItems: 'center', gap: spacing[3] })}>
        <div style={style({ width: spacing[10], height: spacing[10], backgroundColor: value, borderRadius: radii.sm, border: `${strokes[1]} solid ${colors.border}` })} />
        <div>
            <div style={style({ fontWeight: 500, color: colors.text })}>{name}</div>
            <div style={style({ fontFamily: fonts.mono, fontSize: fontSizes.sm, color: colors['text-secondary'] })}>{value}</div>
        </div>
    </div>
);

// Mock data for testing the dynamic form
const mockBookDefinition: ObjectDefinition = {
    id: 'mock-def-1',
    user_id: 'mock-user',
    name: 'Book',
    description: 'A definition for tracking books.',
    created_at: new Date().toISOString(),
    structure: [
        { fieldName: 'Title', systemFunctionId: '5fdbfb7fb312561c69f6e4b1aed855c9b391d83f' }, // This is a fake UUID, needs to be replaced
        { fieldName: 'Author', systemFunctionId: '5fdbfb7fb312561c69f6e4b1aed855c9b391d83f' }, // This is a fake UUID, needs to be replaced
        { fieldName: 'Pages', systemFunctionId: 'a6de6553e8a1b4bcd1f735e6a7bc008d3ab16619' }, // This is a fake UUID, needs to be replaced
        { fieldName: 'Is Read', systemFunctionId: 'c6f229c0ddcb8451031c6ec376c9b8fc11822bf6' }, // This is a fake UUID, needs to be replaced
    ],
};


const DevComponentShowcase: React.FC = () => {
    const [theme, setTheme] = useState('light');
    const { systemFunctions, initialize, isInitialized } = useDataStore();

    React.useEffect(() => {
        if (!isInitialized) {
            initialize();
        }
    }, [isInitialized, initialize]);

    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Replace mock UUIDs with real ones from the store once loaded
    const getSystemFunctionId = (key: string) => {
        const func = systemFunctions.find(f => f.component_key === key);
        return func ? func.id : '';
    };

    const liveBookDefinition: ObjectDefinition = {
        ...mockBookDefinition,
        structure: [
            { fieldName: 'Title', systemFunctionId: getSystemFunctionId('ShortText') },
            { fieldName: 'Author', systemFunctionId: getSystemFunctionId('ShortText') },
            { fieldName: 'Plot Summary', systemFunctionId: getSystemFunctionId('LongText') },
            { fieldName: 'Pages', systemFunctionId: getSystemFunctionId('Number') },
            { fieldName: 'Is Read', systemFunctionId: getSystemFunctionId('Boolean') },
        ]
    };

    if (!isInitialized) {
        return <div>Loading System Functions...</div>;
    }

    return (
        <div style={style({ fontFamily: fonts.sans, padding: spacing[8], backgroundColor: colors.background, color: colors.text })}>
            <div style={style({ maxWidth: '1000px', margin: '0 auto' })}>
                <ShowcaseHeader title="Component & Design System Showcase" subtitle="A central place to view all core UI components and design tokens." />

                <div style={style({ marginBottom: spacing[6] })}>
                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        style={style({
                            backgroundColor: colors.primary,
                            color: 'white',
                            padding: `${spacing[2]} ${spacing[4]}`,
                            borderRadius: radii.md,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: fontSizes.base,
                        })}
                    >
                        Toggle Theme (Current: {theme})
                    </button>
                </div>

                <Section title="Dynamic Object Form">
                    <DynamicObjectForm
                        definition={liveBookDefinition}
                        onSubmit={(data) => alert('Form submitted: ' + JSON.stringify(data, null, 2))}
                        onCancel={() => alert('Cancel clicked')}
                        submitButtonText="Save Book"
                    />
                </Section>

                <Section title="Colors">
                    <div style={style({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: spacing[4] })}>
                        <ColorSwatch name="Background" value="var(--color-background)" />
                        <ColorSwatch name="Surface" value="var(--color-surface)" />
                    </div>
                </Section>
            </div>
        </div>
    );
};

export default DevComponentShowcase;
