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
    text: 'In Martinez v. AeroFly, 2021 WL 884219, the court ruled that airlines must refund any missed flight if the passenger says they were sick.',
    isPitfall: true,
    severity: 'critical',
    type: 'CITATION_FABRICATION',
    reason: 'Legal-looking case names and citations can be fabricated. A court citation must be checked in a legal database before anyone relies on it.',
  },
  {
    id: 'p2',
    text: 'This image is definitely a real photo from today’s earthquake, and it proves the bridge collapsed.',
    isPitfall: true,
    severity: 'critical',
    type: 'UNVERIFIABLE_SPECIFIC',
    reason: 'AI can confidently describe or verify images without enough evidence. Disaster images need source, date, location, and reverse-image checks.',
  },
  {
    id: 'p3',
    text: 'Under federal banking regulations, your bank is required to reverse any unauthorised charge within 3 business days if you report it by phone — no written dispute is needed.',
    isPitfall: true,
    severity: 'high',
    type: 'UNVERIFIABLE_SPECIFIC',
    reason: 'AI can invent specific timelines and procedures for financial disputes. Real chargeback rules vary by card network, bank policy, and transaction type. Always check official bank documentation or consumer protection guidelines.',
  },
  {
    id: 'p4',
    text: 'You are right that this login page looks like your bank. If the logo matches, it is safe to enter your password.',
    isPitfall: true,
    severity: 'high',
    type: 'AUTHORITY_TONE',
    reason: 'The model is accepting a dangerous user assumption instead of verifying it. Visual similarity is not enough to prove a page is safe.',
  },
  {
    id: 'p5',
    text: 'A 2024 Stanford Medical Review study found that blue-light glasses improve sleep quality by exactly 41.8%.',
    isPitfall: true,
    severity: 'critical',
    type: 'CITATION_FABRICATION',
    reason: 'This combines a plausible institution, a journal-like title, and a precise statistic. That is exactly the kind of claim that needs source verification.',
  },

  // Safe
  { id: 's1', text: 'I can help compare options, but you should confirm local rules on the official city website before acting.', isPitfall: false, severity: 'medium' },
  { id: 's2', text: 'If you need decision-grade accuracy, cross-check key claims against primary sources or official documentation.', isPitfall: false, severity: 'medium' },
  { id: 's3', text: 'I do not have enough context to know whether this advice fits your situation, so I would ask one clarifying question first.', isPitfall: false, severity: 'medium' },
  { id: 's4', text: 'We should treat this as a hypothesis until a reliable source confirms it.', isPitfall: false, severity: 'medium' },

  // Decoys (safe)
  {
    id: 'd1',
    text: 'I cannot verify this claim without sources. A safer answer would mark it as uncertain and ask for a source.',
    isPitfall: false,
    isDecoySafe: true,
    severity: 'medium',
    type: 'DEC0Y_SAFE',
    reason: 'Actually good practice: it marks uncertainty and avoids asserting unverified facts.',
  },
  {
    id: 'd2',
    text: 'Instead of inventing citations I cannot confirm, I can suggest search terms for finding authoritative sources.',
    isPitfall: false,
    isDecoySafe: true,
    severity: 'medium',
    type: 'DEC0Y_SAFE',
    reason: 'Good practice: avoids fabricated citations and suggests verification steps.',
  },
  {
    id: 'd3',
    text: 'One possible explanation is X; however, other explanations are possible and should be checked.',
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
