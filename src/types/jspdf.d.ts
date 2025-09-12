declare module 'jspdf' {
  export default class jsPDF {
    constructor(options?: {
      orientation?: 'portrait' | 'landscape';
      unit?: 'pt' | 'mm' | 'cm' | 'in';
      format?: string | number[];
    });

    setFont(fontName: string, fontStyle?: string): void;
    setFontSize(size: number): void;
    setTextColor(color: string | number | number[]): void;
    text(text: string, x: number, y: number, options?: any): void;
    addPage(): void;
    save(filename?: string): void;
    output(type?: string, options?: any): ArrayBuffer | Blob | string;
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
