/**
 * OS Type Definitions
 *
 * Type definitions for operating system operations including file paths,
 * directory paths, and special directory constants.
 */

import { kNs_ } from './_entrypoint_extId_t';

// Special directory constants for file operations
export const kDir = {
  temp: kNs_ + 'temp',
  documents: kNs_ + 'documents',
  home: kNs_ + 'home',
} as const;

// Path types for filesystem operations
export type Path_t = string; // Full filesystem path
export type Dir_t = (typeof kDir)[keyof typeof kDir] | string; // Directory path (can be kDir constant or full path)
export type Filename_t = string; // Just the filename (no directory)

// Type definition for fileRead method
export type FileRead_t = <T = string>(args: { path: string; key?: string }) => T | undefined;

// end, OS_t.ts
