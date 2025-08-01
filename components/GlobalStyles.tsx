import React from 'react';

interface GlobalStylesProps {
  // No props needed - theme is now centralized
}

const GlobalStyles: React.FC<GlobalStylesProps> = () => {
  return (
    <style>
      {`
        :root {
          /* Neutral Light Theme - White Only Palette */
          --background: #ffffff;
          --surface: #ffffff;
          --text: #000000;
          --border: #000000;
          
          /* Unselected Button State */
          --background-unselected: #ffffff;
          --stroke-color-unselected: #000000;
          --stroke-weight-unselected: 1px;
          --text-color-unselected: #000000;
          --font-weight-unselected: normal;
          
          /* Selected Button State */
          --background-selected: #b8b8b8;
          --stroke-color-selected: #000000;
          --stroke-weight-selected: 2px;
          --text-color-selected: #000000;
          --font-weight-selected: normal;
          
          /* Spacing */
          --spacing-xs: 0.25rem;
          --spacing-sm: 0.5rem;
          --spacing-md: 1rem;
          --spacing-lg: 1.5rem;
          --spacing-xl: 2rem;
          
          /* Border Radius */
          --radius-sm: 0.375rem;
          --radius-md: 0.5rem;
          --radius-lg: 0.75rem;
          --radius-xl: 1rem;
        }
        
        /* Tailwind-compatible utility classes */
        .bg-theme-background { background-color: var(--background); }
        .bg-theme-surface { background-color: var(--surface); }
        .bg-theme-unselected { background-color: var(--background-unselected); }
        .bg-theme-selected { background-color: var(--background-selected); }
        
        .text-theme-text { color: var(--text); }
        .text-theme-unselected { color: var(--text-color-unselected); }
        .text-theme-selected { color: var(--text-color-selected); }
        
        .border-theme-border { border-color: var(--border); }
        .border-theme-unselected { border-color: var(--stroke-color-unselected); }
        .border-theme-selected { border-color: var(--stroke-color-selected); }
        
        /* Button state classes */
        .btn-unselected {
          background-color: var(--background-unselected);
          color: var(--text-color-unselected);
          border: var(--stroke-weight-unselected) solid var(--stroke-color-unselected);
          font-weight: var(--font-weight-unselected);
        }
        
        .btn-selected {
          background-color: var(--background-selected);
          color: var(--text-color-selected);
          border: var(--stroke-weight-selected) solid var(--stroke-color-selected);
          font-weight: var(--font-weight-selected);
        }
        
        /* Mobile-first responsive utilities */
        .btn-mobile {
          min-height: 44px;
          min-width: 44px;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        
        /* Safe area support */
        .safe-area-top { padding-top: env(safe-area-inset-top); }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
        .safe-area-left { padding-left: env(safe-area-inset-left); }
        .safe-area-right { padding-right: env(safe-area-inset-right); }
      `}
    </style>
  );
};

export default GlobalStyles; 