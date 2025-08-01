import React from 'react';

interface AppColors {
  background: string;
  surface: string;
  primary: string;
  text: string;
  accent: string;
  buttonUnselected: {
    background: string;
    stroke: string;
    strokeWeight: number;
    text: string;
    fontWeight: string;
  };
  buttonSelected: {
    background: string;
    stroke: string;
    strokeWeight: number;
    text: string;
    fontWeight: string;
  };
}

interface GlobalStylesProps {
  appColors: AppColors;
}

const GlobalStyles: React.FC<GlobalStylesProps> = ({ appColors }) => {
  return (
    <style>
      {`
        :root {
          --background: ${appColors.background};
          --surface: ${appColors.surface};
          --primary: ${appColors.primary};
          --text: ${appColors.text};
          --accent: ${appColors.accent};
          --button-unselected-bg: ${appColors.buttonUnselected.background};
          --button-unselected-stroke: ${appColors.buttonUnselected.stroke};
          --button-unselected-stroke-weight: ${appColors.buttonUnselected.strokeWeight}px;
          --button-unselected-text: ${appColors.buttonUnselected.text};
          --button-unselected-font-weight: ${appColors.buttonUnselected.fontWeight};
          --button-selected-bg: ${appColors.buttonSelected.background};
          --button-selected-stroke: ${appColors.buttonSelected.stroke};
          --button-selected-stroke-weight: ${appColors.buttonSelected.strokeWeight}px;
          --button-selected-text: ${appColors.buttonSelected.text};
          --button-selected-font-weight: ${appColors.buttonSelected.fontWeight};
        }
        
        /* Utility classes for CSS vars */
        .bg-var-background { background-color: var(--background); }
        .bg-var-surface { background-color: var(--surface); }
        .bg-var-primary { background-color: var(--primary); }
        .bg-var-accent { background-color: var(--accent); }
        
        .text-var-text { color: var(--text); }
        .text-var-primary { color: var(--primary); }
        .text-var-accent { color: var(--accent); }
        
        .border-var-primary { border-color: var(--primary); }
        .border-var-accent { border-color: var(--accent); }
        .border-var-text { border-color: var(--text); }
        
        /* Button utility classes */
        .btn-unselected {
          background-color: var(--button-unselected-bg);
          color: var(--button-unselected-text);
          border: var(--button-unselected-stroke-weight) solid var(--button-unselected-stroke);
          font-weight: var(--button-unselected-font-weight);
        }
        
        .btn-selected {
          background-color: var(--button-selected-bg);
          color: var(--button-selected-text);
          border: var(--button-selected-stroke-weight) solid var(--button-selected-stroke);
          font-weight: var(--button-selected-font-weight);
        }
      `}
    </style>
  );
};

export default GlobalStyles; 