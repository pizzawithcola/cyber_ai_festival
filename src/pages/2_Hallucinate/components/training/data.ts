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
  {
    id: 'p6',
    text: 'Studies show remote workers are more productive, so your team will be more productive if you let them work from home.',
    isPitfall: true,
    severity: 'high',
    type: 'MISSING_SCOPE',
    reason: '"Studies show" has no source, and it applies a group average to your specific team — a classic scope error.',
  },
  {
    id: 'p7',
    text: 'Drinking eight glasses of water a day is a medical requirement, so you should follow it exactly.',
    isPitfall: true,
    severity: 'medium',
    type: 'MIXED_FACT_OPINION',
    reason: 'It presents a popular saying as a hard medical rule. There is no single universal requirement — needs vary by person, climate, and activity.',
  },
  {
    id: 'p8',
    text: 'The contract is a standard template, so you don’t need to read it carefully before signing.',
    isPitfall: true,
    severity: 'critical',
    type: 'OVERCLAIM_FIRST',
    reason: 'Calling it "standard" downplays the risk. Templates still contain terms worth checking, and telling someone not to read a contract before signing is dangerous.',
  },
  {
    id: 'p9',
    text: 'Most doctors agree you should take vitamin C at the first sign of a cold.',
    isPitfall: true,
    severity: 'high',
    type: 'AUTHORITY_TONE',
    reason: 'A fabricated consensus. "Most doctors agree" is an appeal to authority with no verifiable source.',
  },

  // Safe — careful, well-calibrated answers: the model shows uncertainty and points to sources
  { id: 's1', text: 'I’m not certain about your city’s exact rules, so take this as a starting point — most districts want a short form, but please confirm with the permit office before you pay anything.', isPitfall: false, severity: 'medium' },
  { id: 's2', text: 'That figure might be out of date, and I’d rather not guess at a number this important. It’s worth checking the official statistics page — I can point you to where it lives.', isPitfall: false, severity: 'medium' },
  { id: 's3', text: 'I don’t have enough detail yet to be sure which option fits you. If you tell me whether this is personal or business, I can give you a much more accurate answer.', isPitfall: false, severity: 'medium' },

  // Decoys (safe) — confident tone, but the content is actually correct
  {
    id: 'd1',
    text: 'No — a triangle’s interior angles always add up to exactly 180 degrees. You can rely on that in any exam.',
    isPitfall: false,
    isDecoySafe: true,
    severity: 'medium',
    type: 'DEC0Y_SAFE',
    reason: 'A confident tone, but the statement is a true geometric fact — being certain is not the same as hallucinating.',
  },
  {
    id: 'd2',
    text: 'Use boiling water to calibrate it. At sea level water boils at exactly 100 °C, so it’s a reliable fixed point.',
    isPitfall: false,
    isDecoySafe: true,
    severity: 'medium',
    type: 'DEC0Y_SAFE',
    reason: 'Precise and confident, but the boiling point of water at sea level is a verifiable fact.',
  },
  {
    id: 'd3',
    text: 'As an EU citizen you don’t need a work visa for Germany — you already have the right to work in any member state, so no separate application is required.',
    isPitfall: false,
    isDecoySafe: true,
    severity: 'medium',
    type: 'DEC0Y_SAFE',
    reason: 'Stated as a firm rule, but EU freedom of movement makes it true — confident wording does not equal a hallucination.',
  },
];

export const NORMALIZED_SENTENCE_POOL: SentenceItem[] = SENTENCE_POOL.map((s) => {
  if (s.type) {
    return { ...s, severity: SEVERITY_BY_TYPE[s.type] ?? s.severity };
  }
  return s;
});
