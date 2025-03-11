type ThemeVariant = {
  light: string;
  dark: string;
};

type ThemeVariants = Record<string, ThemeVariant>;

/**
 * Создает объект с вариантами стилей для светлой и темной темы
 */
export function createThemeVariants<T extends string>(variants: Record<T, ThemeVariant>): Record<T, ThemeVariant> {
  return variants;
}

/**
 * Выбирает соответствующий вариант стиля на основе текущей темы
 */
export function tv(variants: ThemeVariants, colorScheme: 'light' | 'dark'): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, variant] of Object.entries(variants)) {
    result[key] = variant[colorScheme];
  }
  
  return result;
}

/**
 * Предопределенные варианты для общих компонентов
 */
export const commonVariants = createThemeVariants({
  // Фоны
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
  
  // Тексты
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
  
  // Границы
  border: {
    light: 'border-gray-200',
    dark: 'border-gray-700',
  },
  tableBorder: {
    light: 'border-gray-100',
    dark: 'border-gray-700',
  },
  
  // Кнопки
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
  
  // Выделение
  selectedBg: {
    light: 'bg-blue-50',
    dark: 'bg-blue-900',
  },
  selectedBorder: {
    light: 'border-blue-500',
    dark: 'border-blue-600',
  },
  
  // Ховеры
  tableRowHover: {
    light: 'hover:bg-gray-50',
    dark: 'hover:bg-gray-700',
  },
}); 