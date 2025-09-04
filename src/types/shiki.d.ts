declare module 'shiki' {
  export interface IThemedToken {
    content: string;
    color?: string;
    fontStyle?: number;
    modifiers?: string[];
  }

  export interface IThemedTokenWithVariants {
    content: string;
    color?: string;
    fontStyle?: number;
    modifiers?: string[];
    variants?: {
      [key: string]: {
        color?: string;
        fontStyle?: number;
      };
    };
  }

  export interface TokenResult {
    tokens: IThemedToken[][];
    theme: string;
    lang: string;
  }

  export class Highlighter {
    codeToTokens(code: string, options?: {
      lang?: string;
      theme?: string;
    }): TokenResult;
    
    codeToThemedTokens(code: string, options?: {
      lang?: string;
      theme?: string;
    }): IThemedToken[][];
  }

  // Export the functions that are being imported
  export function getSingletonHighlighter(options?: {
    themes?: string[];
    langs?: string[];
  }): Promise<Highlighter>;
  export function createCssVariablesTheme(options: any): any;
  export const bundledThemesInfo: any;
}