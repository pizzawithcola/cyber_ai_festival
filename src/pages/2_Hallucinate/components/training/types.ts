export type PitfallType =
  | 'UNVERIFIABLE_SPECIFIC'
  | 'CITATION_FABRICATION'
  | 'AUTHORITY_TONE'
  | 'OVERCLAIM_FIRST'
  | 'MISSING_SCOPE'
  | 'MIXED_FACT_OPINION'
  | 'DEC0Y_SAFE';

export type Severity = 'boss' | 'critical' | 'high' | 'medium';

export interface SentenceItem {
  id: string;
  text: string;
  isPitfall: boolean;
  severity: Exclude<Severity, 'boss'>;
  type?: PitfallType;
  reason?: string;
  isDecoySafe?: boolean;
}

export type ResultPage = 'summary' | 'correct' | 'missed' | 'falsePos' | 'complete';

export interface ResultPitfalls {
  pitfalls: SentenceItem[];
  missed: SentenceItem[];
  correct: SentenceItem[];
  falsePos: SentenceItem[];
  correctPass: SentenceItem[];
  unanswered: SentenceItem[];
}

