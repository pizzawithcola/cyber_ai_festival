import { type SentenceItem } from './types';

export function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function evidenceChecklistForSentence(s: SentenceItem): string[] {
  if (!s.isPitfall) {
    if (s.isDecoySafe) {
      return [
        'Uses explicit uncertainty markers (“cannot verify”, “requires confirmation”).',
        'Suggests a verification path instead of asserting facts.',
      ];
    }
    return ['Avoids unverifiable specifics (exact dates, numbers, DOIs).', 'Keeps scope cautious and checkable.'];
  }

  switch (s.type) {
    case 'CITATION_FABRICATION':
      return [
        'Citation/DOI-shaped text can be invented by a model.',
        'Evidence needed: the DOI resolves to the stated paper (title/authors/year match).',
        'Verify by searching the DOI on the publisher site or Crossref.',
      ];
    case 'OVERCLAIM_FIRST':
      return [
        '“First-ever” claims require strong proof and prior-art checking.',
        'Evidence needed: multiple reputable sources confirming it is truly the first.',
        'Verify by searching for earlier results and official announcements.',
      ];
    case 'UNVERIFIABLE_SPECIFIC':
      return [
        'Precise year/number without a source is a high-risk pattern.',
        'Evidence needed: a primary source that states this exact milestone.',
        'Verify by finding the original paper/press release and matching the wording.',
      ];
    case 'MISSING_SCOPE':
      return [
        'Overgeneralizes (“all”, “no exceptions”) without conditions.',
        'Evidence needed: explicit scope (hardware, dataset, assumptions) and limitations.',
        'Verify by asking for constraints and checking known counterexamples.',
      ];
    case 'AUTHORITY_TONE':
      return [
        'Uses absolute confidence (“conclusively”, “clearly”) without showing evidence.',
        'Evidence needed: data + method + limitations to support the conclusion.',
        'Verify by requesting citations; otherwise rewrite as tentative.',
      ];
    case 'MIXED_FACT_OPINION':
      return [
        'Mixes value judgment with facts (“ethical”, “superior”) without criteria.',
        'Evidence needed: defined criteria and measurable comparisons.',
        'Verify by separating opinion from claims and demanding metrics.',
      ];
    default:
      return ['Needs a verifiable source trail before reuse.', 'Rewrite with uncertainty and add citations.'];
  }
}
