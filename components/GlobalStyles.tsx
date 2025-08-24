import React from 'react';

/**
 * This component provides baseline global styles and a simple CSS reset.
 * Theme-specific variables (colors, etc.) are now managed in `styles/theme.css`.
 * Component-specific styles should be handled at the component level.
 */
const GlobalStyles: React.FC = () => {
  return (
    <style>
      {`
        /* 1. Use a more modern box-sizing model. */
        *, *::before, *::after {
          box-sizing: border-box;
        }

        /* 2. Set default font styles and colors from our theme. */
        body {
          margin: 0;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace; /* Default to mono as requested */
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: var(--color-background);
          color: var(--color-text-primary);
          line-height: 1.5;
        }

        /* 3. Basic resets for common elements */
        h1, h2, h3, h4, h5, h6, p, blockquote, pre,
        dl, dd, ol, ul, figure, hr {
          margin: 0;
          padding: 0;
        }
        
        /* 4. Animations (can be kept here globally) */
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        /* 5. Safe area support */
        .safe-area-top { padding-top: env(safe-area-inset-top); }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
        .safe-area-left { padding-left: env(safe-area-inset-left); }
        .safe-area-right { padding-right: env(safe-area-inset-right); }

        /*
         * The old utility classes like .bg-theme-background, .btn-selected, etc.
         * have been removed from here. They will be replaced by a proper
         * component-based styling approach using our new design tokens.
         */
      `}
    </style>
  );
};

export default GlobalStyles;
