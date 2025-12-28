/**
 * OS Type Definitions
 *
 * Type definitions for operating system operations including file paths,
 * directory paths, and special directory constants.
 */

import type { OS } from '../OS';

// Directory function type - function that resolves to a path
export type DirFxn_t = (os: OS) => string;

// Special directory constants for file operations
export const kDir = {
  temp: (os: OS) => os.getDir_Temp(),
  docs: (os: OS) => os.getDir_Documents(),
  home: (os: OS) => os.getDir_Home(),
} as const;

// Path types for filesystem operations
export type Path_t = string; // Full filesystem path
export type Dir_t = DirFxn_t | string; // Directory path (can be kDir function or full path string)
export type Filename_t = string; // Just the filename (no directory)

// Type definition for fileRead method
export type FileRead_t = <T = string>(args: { path: string; key?: string }) => T | undefined;

// end, OS_t.ts
