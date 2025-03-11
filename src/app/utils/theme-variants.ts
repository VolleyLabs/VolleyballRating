type ThemeVariant = {
  light: string;
  dark: string;
};

type ThemeVariants = Record<string, ThemeVariant>;

/**
 * Creates an object with style variants for light and dark themes
 */
export function createThemeVariants<T extends string>(variants: Record<T, ThemeVariant>): Record<T, ThemeVariant> {
  return variants;
}

/**
 * Selects the appropriate style variant based on the current theme
 */
export function tv(variants: ThemeVariants, colorScheme: 'light' | 'dark'): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, variant] of Object.entries(variants)) {
    result[key] = variant[colorScheme];
  }
  
  return result;
}

/**
 * Predefined variants for common components
 */
export const commonVariants = createThemeVariants({
  // Backgrounds
  bg: {
    light: 'bg-gray-50',
    dark: 'bg-gray-900',
  },
  cardBg: {
    light: 'bg-white',
    dark: 'bg-gray-800',
  },
  headerBg: {
    light: 'bg-gray-100',
    dark: 'bg-gray-900',
  },
  tableHeaderBg: {
    light: 'bg-gray-50',
    dark: 'bg-gray-900',
  },
  
  // Texts
  text: {
    light: 'text-gray-900',
    dark: 'text-white',
  },
  secondaryText: {
    light: 'text-gray-500',
    dark: 'text-gray-300',
  },
  tableHeaderText: {
    light: 'text-gray-600',
    dark: 'text-gray-300',
  },
  
  // Borders
  border: {
    light: 'border-gray-200',
    dark: 'border-gray-700',
  },
  tableBorder: {
    light: 'border-gray-100',
    dark: 'border-gray-700',
  },
  
  // Buttons
  primaryButton: {
    light: 'bg-blue-500',
    dark: 'bg-blue-600',
  },
  primaryButtonHover: {
    light: 'hover:bg-blue-600',
    dark: 'hover:bg-blue-700',
  },
  secondaryButton: {
    light: 'bg-gray-600',
    dark: 'bg-gray-700',
  },
  secondaryButtonHover: {
    light: 'hover:bg-gray-700',
    dark: 'hover:bg-gray-800',
  },
  
  // Selection
  selectedBg: {
    light: 'bg-blue-50',
    dark: 'bg-blue-900',
  },
  selectedBorder: {
    light: 'border-blue-500',
    dark: 'border-blue-600',
  },
  
  // Hovers
  tableRowHover: {
    light: 'hover:bg-gray-50',
    dark: 'hover:bg-gray-700',
  },
}); 