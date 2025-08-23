/// <reference types="node" />
declare module '@iarna/rtf-to-html' {
    function fromString(rtfContent: string, callback: (err: Error | null, result: string) => void): void;
    function fromStream(stream: unknown, callback: (err: Error | null, result: string) => void): void;
    function asStream(rtfContent: string): unknown;
}
