import { type PitfallType, type SentenceItem, type Severity } from './types';

export const SEVERITY_BY_TYPE: Record<PitfallType, Exclude<Severity, 'boss'>> = {
  UNVERIFIABLE_SPECIFIC: 'critical',
  CITATION_FABRICATION: 'critical',
  OVERCLAIM_FIRST: 'critical',
  AUTHORITY_TONE: 'high',
  MISSING_SCOPE: 'high',
  MIXED_FACT_OPINION: 'medium',
  DEC0Y_SAFE: 'medium',
};

// Boss sentences are the most deceptive/high-impact pitfall *types*.
// If any appear in the round, Boss will be picked randomly among them.
export const BOSS_TYPES = new Set<PitfallType>(['CITATION_FABRICATION', 'OVERCLAIM_FIRST']);

export const SENTENCE_POOL: SentenceItem[] = [
  {
    id: 'p1',
    text: 'In 2025, IBM released the first widely available 1,000-qubit quantum processor.',
    isPitfall: true,
    severity: 'critical',
    type: 'UNVERIFIABLE_SPECIFIC',
    reason: 'Specific milestone + “first widely available” needs verified sources; otherwise this is unsafe to reuse.',
  },
  {
    id: 'p2',
    text: 'Google demonstrated quantum advantage for practical drug discovery use cases in 2025.',
    isPitfall: true,
    severity: 'critical',
    type: 'UNVERIFIABLE_SPECIFIC',
    reason: 'Highly specific claim; often “headline completion” unless backed by primary sources.',
  },
  {
    id: 'p3',
    text: 'These results conclusively prove that classical computing will soon be obsolete.',
    isPitfall: true,
    severity: 'high',
    type: 'AUTHORITY_TONE',
    reason: 'Overconfident sweeping forecast (“conclusively”, “obsolete”) is a strong hallucination red flag.',
  },
  {
    id: 'p4',
    text: 'Overall, the field has entered a new era of fault-tolerant quantum computing.',
    isPitfall: true,
    severity: 'high',
    type: 'AUTHORITY_TONE',
    reason: 'Grand narrative claim presented as fact; needs scope, definition, and citations.',
  },
  {
    id: 'p5',
    text: 'Chen et al. (2025), Nature, DOI: 10.1038/s41586-2025-07316-0.',
    isPitfall: true,
    severity: 'critical',
    type: 'CITATION_FABRICATION',
    reason: 'Citation-shaped output can be fabricated. Only include DOIs you can verify.',
  },
  {
    id: 'p6',
    text: 'Kumar & Patel (2025), Science, DOI: 10.1126/science.adn8834.',
    isPitfall: true,
    severity: 'high',
    type: 'CITATION_FABRICATION',
    reason: 'Plausible references are a common hallucination pattern; verify existence before trusting.',
  },
  {
    id: 'p7',
    text: 'This is the first-ever direct observation of dark matter in the early universe.',
    isPitfall: true,
    severity: 'critical',
    type: 'OVERCLAIM_FIRST',
    reason: '“First-ever” is a classic hallucination template; requires authoritative sourcing.',
  },
  {
    id: 'p8',
    text: 'These findings apply to all quantum hardware platforms with no exceptions.',
    isPitfall: true,
    severity: 'high',
    type: 'MISSING_SCOPE',
    reason: 'Overgeneralization; real results have constraints, assumptions, and setups.',
  },
  {
    id: 'p9',
    text: 'According to multiple peer-reviewed studies, this method improves accuracy by exactly 37.2%.',
    isPitfall: true,
    severity: 'high',
    type: 'UNVERIFIABLE_SPECIFIC',
    reason: 'Exact number + vague “multiple studies” suggests fabricated specificity unless cited and checked.',
  },
  {
    id: 'p10',
    text: 'The new techniques are clearly more ethical and superior to all previous approaches.',
    isPitfall: true,
    severity: 'medium',
    type: 'MIXED_FACT_OPINION',
    reason: 'Value judgment presented as fact; needs criteria and evidence.',
  },

  // Safe
  { id: 's1', text: 'Some recent work focuses on improving quantum error correction and reducing noise in hardware.', isPitfall: false, severity: 'medium' },
  { id: 's2', text: 'If you need decision-grade accuracy, cross-check key claims against primary sources (papers, press releases).', isPitfall: false, severity: 'medium' },
  { id: 's3', text: 'The status of 2025 milestones depends on how terms like “quantum advantage” are defined.', isPitfall: false, severity: 'medium' },
  { id: 's4', text: 'We should treat this as a hypothesis until a primary source confirms it.', isPitfall: false, severity: 'medium' },

  // Decoys (safe)
  {
    id: 'd1',
    text: 'I cannot verify this claim without sources. A safer summary is: “Some reports suggest X, but it requires confirmation.”',
    isPitfall: false,
    isDecoySafe: true,
    severity: 'medium',
    type: 'DEC0Y_SAFE',
    reason: 'Actually good practice: it marks uncertainty and avoids asserting unverified facts.',
  },
  {
    id: 'd2',
    text: 'Instead of citing DOIs I cannot confirm, I will provide suggested search queries to find authoritative sources.',
    isPitfall: false,
    isDecoySafe: true,
    severity: 'medium',
    type: 'DEC0Y_SAFE',
    reason: 'Good practice: avoids fabricated citations and suggests verification steps.',
  },
  {
    id: 'd3',
    text: 'One possible interpretation is X; however, alternative explanations exist and should be checked.',
    isPitfall: false,
    isDecoySafe: true,
    severity: 'medium',
    type: 'DEC0Y_SAFE',
    reason: 'Balanced language reduces overclaiming; not a hallucination sign by itself.',
  },
];

export const NORMALIZED_SENTENCE_POOL: SentenceItem[] = SENTENCE_POOL.map((s) => {
  if (s.type) {
    return { ...s, severity: SEVERITY_BY_TYPE[s.type] ?? s.severity };
  }
  return s;
});
