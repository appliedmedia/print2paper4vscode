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

export interface ThemeData {
  name?: string;
  colors?: Record<string, string>;
  tokenColors?: TokenColor[];
  fonts?: {
    editor?: string;
  };
}
