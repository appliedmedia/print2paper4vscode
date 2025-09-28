declare module 'jspdf' {
  interface TextOptions {
    align?: 'left' | 'center' | 'right' | 'justify';
    baseline?: 'alphabetic' | 'ideographic' | 'bottom' | 'top' | 'middle' | 'hanging';
    angle?: number;
    maxWidth?: number;
  }

  interface OutputOptions {
    returnPromise?: boolean;
  }

  export default class jsPDF {
    constructor(options?: {
      orientation?: 'portrait' | 'landscape';
      unit?: 'pt' | 'mm' | 'cm' | 'in';
      format?: string | number[];
    });

    setFont(fontName: string, fontStyle?: string): void;
    setFontSize(size: number): void;
    // Gray scale (single parameter)
    setTextColor(gray: number | string): void;
    // RGB (three parameters)
    setTextColor(r: number | string, g: number | string, b: number | string): void;
    // CMYK (four parameters)
    setTextColor(
      c: number | string,
      m: number | string,
      y: number | string,
      k: number | string
    ): void;
    text(text: string, x: number, y: number, options?: TextOptions): void;
    addPage(): void;
    save(filename?: string): void;
    output(type?: string, options?: OutputOptions): ArrayBuffer | string;
    getNumberOfPages(): number;
    getPageWidth(): number;
    getPageHeight(): number;
    setPage(pageNumber: number): void;
    getCurrentPageInfo(): { pageNumber: number; pageCount: number };
    getTextWidth(text: string): number;
    getFontList(): Record<string, string[]>;
    internal: {
      pageSize: {
        width: number;
        height: number;
      };
    };
  }
}
