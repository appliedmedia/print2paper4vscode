/// <reference types="node" />
declare module 'rtf-parser' {
    interface RTFStyle {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        strikethrough?: boolean;
        foreground?: string;
        background?: string;
        fontSize?: number;
        font?: string;
        firstLineIndent?: number;
        indent?: number;
        align?: string;
        valign?: string;
    }

    interface RTFSpan {
        value: string;
        style: RTFStyle;
    }

    interface RTFDocument {
        content: RTFSpan[];
        fonts: unknown[];
        colors: unknown[];
        style: RTFStyle;
        ignorable: boolean;
        charset: string;
        marginLeft: number;
        marginRight: number;
        marginBottom: number;
        marginTop: number;
    }

    function string(rtfContent: string, callback: (err: Error | null, result: RTFDocument) => void): void;
    function stream(): unknown;
}
