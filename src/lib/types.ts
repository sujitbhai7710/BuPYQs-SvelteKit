export interface FileEntry {
  name: string;
  url: string;
  id: string;
  is_folder?: boolean;
}

export interface YearData {
  name: string;
  year: number | null;
  folder_id: string;
  url: string;
  files: FileEntry[];
}

export interface SemesterData {
  name: string;
  number: number | null;
  folder_id: string;
  url: string;
  years: Record<string, YearData>;
  files: FileEntry[];
}

export interface TypeData {
  name: string;
  folder_id: string;
  url: string;
  semesters: Record<string, SemesterData>;
}

export interface SystemData {
  name: string;
  folder_id: string;
  url: string;
  types: Record<string, TypeData>;
}

export interface SubjectData {
  name: string;
  folder_id: string;
  systems: Record<string, SystemData>;
}

export type QuestionData = Record<string, SubjectData>;

export interface SyllabusEntry {
  name: string;
  url: string;
  department: string;
  category: string;
}

export type SyllabusData = Record<string, SyllabusEntry[]>;

export enum Step {
  SUBJECT = 0,
  SYSTEM = 1,
  TYPE = 2,
  SEMESTER = 3,
  FILES = 4
}
