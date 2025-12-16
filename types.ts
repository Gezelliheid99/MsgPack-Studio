export interface FileInfo {
  name: string;
  size: number;
  type: string;
}

export enum EditorMode {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

export interface AnalysisResult {
  summary: string;
  structure: string;
  suggestions: string[];
}
