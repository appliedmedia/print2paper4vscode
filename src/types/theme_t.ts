// Theme format used throughout the application
export interface Theme {
  id: string;
  displayName: string;
  themeData: ThemeData | null; // null for pure Shiki themes, converted theme object for VS Code themes
}

// Theme data object structure
export interface ThemeData {
  name?: string;
  colors?: Record<string, string>;
  tokenColors?: Array<{
    scope: string | string[];
    settings: { foreground?: string; background?: string };
  }>;
  fonts?: {
    editor?: string;
  };
}
