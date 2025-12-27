/**
 * OS Type Definitions
 *
 * Type definitions for operating system operations including file paths,
 * directory paths, and special directory constants.
 */

import { kNs_ } from './_entrypoint_extId_t';
import type { OS } from '../OS';

// Directory resolver type - maps keys to OS methods
export type DirResolver_t = {
  key: string;
  fxn: (os: OS) => string;
};

// Special directory constants for file operations
export const kDir: Record<string, DirResolver_t> = {
  temp: {
    key: kNs_ + 'temp',
    fxn: (os: OS) => os.getDir_Temp(),
  },
  docs: {
    key: kNs_ + 'docs',
    fxn: (os: OS) => os.getDir_Documents(),
  },
  home: {
    key: kNs_ + 'home',
    fxn: (os: OS) => os.getDir_Home(),
  },
} as const;

// Path types for filesystem operations
export type Path_t = string; // Full filesystem path
export type Dir_t = (typeof kDir)[keyof typeof kDir]['key'] | string; // Directory path (can be kDir constant or full path)
export type Filename_t = string; // Just the filename (no directory)

// Type definition for fileRead method
export type FileRead_t = <T = string>(args: { path: string; key?: string }) => T | undefined;

// end, OS_t.ts
