// Theme format used throughout the application
export interface Theme {
  id: string;
  displayName: string;
  themeData: ThemeData | null; // null for pure Shiki themes, converted theme object for VS Code themes
}

// Theme data object structure
export interface TokenColor {
  scope: string | string[];
  settings: {
    foreground?: string;
    background?: string;
    fontStyle?: string;
  };
}

// Shiki theme format - exactly what Shiki expects
export interface ThemeData {
  name: string;
  type: 'light' | 'dark';
  colors: Record<string, string>;
  tokenColors: Array<{
    scope: string | string[];
    settings: {
      foreground?: string;
      background?: string;
      fontStyle?: string;
    };
  }>;
  fonts?: {
    editor?: string;
  };
}

// end, theme_t.ts
