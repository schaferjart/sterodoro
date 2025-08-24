/**
 * =================================================================
 * DESIGN SYSTEM TOKENS
 * =================================================================
 * This file contains the centralized design tokens for the application.
 * It is the single source of truth for all visual properties.
 *
 * Inspired by Figma design tokens and modern CSS-in-JS practices.
 * =================================================================
 */

// The font family, easily swappable later
export const fonts = {
  mono: '"SF Mono", "Menlo", "Monaco", monospace',
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

// Font size "classes" with full control over the values (based on 16px root)
export const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
};

// Spacing units based on a 4px scale
export const spacing = {
  '0': '0',
  '1': '0.25rem', // 4px
  '2': '0.5rem',  // 8px
  '3': '0.75rem', // 12px
  '4': '1rem',    // 16px
  '5': '1.25rem', // 20px
  '6': '1.5rem',  // 24px
  '8': '2rem',    // 32px
  '10': '2.5rem', // 40px
  '12': '3rem',   // 48px
  '16': '4rem',   // 64px
};

// Centralized control over border-radius
export const radii = {
  none: '0',
  sm: '0.25rem',  // 4px (slightly rounded)
  DEFAULT: '0.375rem', // 6px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  full: '9999px',
};

// Centralized control over border/stroke thickness
export const strokes = {
  '1': '1px',
  '2': '2px',
};

/**
 * Colors are defined as CSS variables in `styles/theme.css` for easy theming.
 * This object provides a way to reference them in JavaScript if needed,
 * but most color styling should be done via CSS classes that use these variables.
 */
export const colors = {
  background: 'var(--color-background)',
  surface: 'var(--color-surface)', // For cards, containers, etc.
  text: 'var(--color-text-primary)',
  'text-secondary': 'var(--color-text-secondary)',
  'text-tertiary': 'var(--color-text-tertiary)',

  border: 'var(--color-border)',

  primary: 'var(--color-primary)',
  'primary-hover': 'var(--color-primary-hover)',

  selected: 'var(--color-selected)',

  success: 'var(--color-success)',
  error: 'var(--color-error)',
};
