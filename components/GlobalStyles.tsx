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
        
        /* Input field styles */
        .modal-input {
          font-size: 14px;
          line-height: 1.5;
        }
        
        /* Animations */
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(100%);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        /* Explicit background opacity utilities */
        .bg-opacity-10 {
          background-color: rgba(0, 0, 0, 0.05) !important;
        }
        
        .bg-opacity-30 {
          background-color: rgba(0, 0, 0, 0.3) !important;
        }
        
        .bg-opacity-80 {
          background-color: rgba(0, 0, 0, 0.8) !important;
        }
        
        .bg-black {
          background-color: #000000 !important;
        }
        
        .bg-white {
          background-color: #ffffff !important;
        }
        
        /* Force input styling to match buttons */
        input.btn-mobile.btn-unselected,
        input.btn-mobile.btn-selected,
        select.btn-mobile.btn-unselected,
        select.btn-mobile.btn-selected {
          /* Nuclear reset - override ALL browser defaults */
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          font-family: inherit !important;
          font-size: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
          border-radius: inherit !important;
          text-align: center !important;
          background-image: none !important;
          box-shadow: none !important;
          outline: none !important;
          margin: 0 !important;
          padding: inherit !important;
          box-sizing: border-box !important;
          
          /* Force button styling */
          background-color: var(--background-unselected) !important;
          color: var(--text-color-unselected) !important;
          border: var(--stroke-weight-unselected) solid var(--stroke-color-unselected) !important;
        }
        
        input.btn-mobile.btn-selected,
        select.btn-mobile.btn-selected {
          background-color: var(--background-selected) !important;
          color: var(--text-color-selected) !important;
          border: var(--stroke-weight-selected) solid var(--stroke-color-selected) !important;
        }
        
        /* Additional reset for specific input types */
        input[type="text"].btn-mobile,
        input[type="number"].btn-mobile,
        input[type="email"].btn-mobile,
        input[type="password"].btn-mobile {
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
        }
        
        /* Strip native styling from inputs and selects to match our buttons */
        input.btn-mobile,
        select.btn-mobile {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: none;
          box-shadow: none;
          outline: none;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
          text-align: center;
        }

        /* Hide IE/Edge native dropdown arrow */
        select.btn-mobile::-ms-expand {
          display: none;
        }

        /* Hide WebKit number input spinners */
        input[type="number"].btn-mobile::-webkit-inner-spin-button,
        input[type="number"].btn-mobile::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
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