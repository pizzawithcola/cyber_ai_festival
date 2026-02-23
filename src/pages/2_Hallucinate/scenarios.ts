// Scenario definitions for the Hallucinate chapter.

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  story: string;
  background: {
    headline: string;
    outlet: string;
    date: string;
    dek: string;
    clippings: Array<{
      outlet: string;
      date: string;
      byline: string;
      angle: string;
      body: string;
    }>;
    question: string;
  };
  riskDrivers: Array<{ title: string; detail: string }>;
  promptChain: Array<{ from: string; text: string; label?: string }>;
  saferRewrite: string;
  takeaway: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'bard',
    title: 'Google Bard demo (2023)',
    subtitle: 'A confident factual claim that was wrong',
    tags: ['factual', 'public demo', 'confidently wrong'],
    story:
      "In an early demo, the model answered a question about JWST discoveries and confidently stated a 'first' that wasn't true. The key pattern: news-like prompts invite headline-style completion. Without grounding (retrieval/citations), the model may invent a plausible-sounding breakthrough.",
    background: {
      headline: 'Bard demo stumbles after JWST “first image” claim',
      outlet: 'The Guardian',
      date: 'Feb 8, 2023',
      dek: 'In a promotional demo, Google’s Bard incorrectly claimed JWST took the first image of an exoplanet, an error that quickly drew expert pushback and headlines. Because the line appeared in official launch material, it became an immediate test of whether the system could be trusted on factual questions.',
      clippings: [
        {
          outlet: 'The Guardian',
          date: 'Wed 8 Feb 2023',
          byline: 'Dan Milmo and agency',
          angle: 'Market reaction & credibility',
          body:
            'The report framed the demo error as a reputational hit in Google’s AI race and said the stumble helped trigger a sharp market reaction — with more than $100bn wiped off Alphabet’s value — as investors questioned the rollout amid competition with Microsoft.',
        },
        {
          outlet: 'CNN Business',
          date: 'Thu Feb 9, 2023',
          byline: 'Catherine Thorbecke',
          angle: 'Demo error & factual correction',
          body:
            'The story focused on the specific factual miss: in a promo, Bard answered a kid‑friendly JWST question with a “first exoplanet image” claim. It then pointed to the correction — NASA records show the first exoplanet image came from the European Southern Observatory’s Very Large Telescope in 2004 — as an example of how confident chatbot answers can be wrong without verification.',
        },
      ],
      question: 'Want to see how a simple prompt spiraled into a confident hallucination?',
    },
    riskDrivers: [
      {
        title: 'Prompt implies a concrete fact exists',
        detail: "Questions like 'What new discoveries has X made?' push the model to pick a single highlight, even when it's unsure.",
      },
      {
        title: 'Headline template completion',
        detail: "Models often learned that 'major discovery' pairs with 'first-ever…' and may overuse it.",
      },
      {
        title: 'No verification channel',
        detail: "Without citations/search, the model can't check reality—only linguistic plausibility.",
      },
    ],
    promptChain: [
      { from: 'User', text: 'What new discoveries has the James Webb Space Telescope made?' },
      { from: 'Model', text: "One of its discoveries is taking the first picture of an exoplanet outside our solar system.", label: 'Hallucination risk' },
      { from: 'User', text: 'Can you list 3 more major firsts?' },
      { from: 'Model', text: "Sure—(lists additional 'firsts' with similar confident tone)…", label: 'Compounding' },
    ],
    saferRewrite:
      "Please answer only if you can cite a reliable source. If you are uncertain, say \"I'm not sure\". Provide 2–3 examples with dates, and include links or citations to the source material.",
    takeaway:
      "When a prompt asks for specific highlights, allow uncertainty + require sources to avoid forced guessing.",
  },
  {
    id: 'galactica',
    title: 'Meta Galactica demo pulled (2022)',
    subtitle: 'Academic-style text + fabricated citations',
    tags: ['citations', 'academic', 'fabrication'],
    story:
      'Galactica was pitched for scientific writing. A common failure mode: generating plausible-looking references, DOIs, and claims that were not real. The model learned the shape of academic writing, not verified ground truth.',
    background: {
      headline: 'Meta’s Galactica demo pulled after criticism over fake science',
      outlet: 'Ars Technica',
      date: 'Nov 18, 2022',
      dek: 'Meta’s science‑writing demo was taken offline after researchers showed it could generate convincing but incorrect scientific text and citations. The model learned the *shape* of papers and references without verifying sources, making the output look authoritative even when it was wrong.',
      clippings: [
        {
          outlet: 'Ars Technica',
          date: 'Nov 18, 2022',
          byline: 'Benj Edwards',
          angle: 'Demo pulled after criticism',
          body:
            'Reporting described how Galactica could generate plausible‑looking scientific prose and citations, which critics said could mislead readers. After examples spread online, Meta removed the demo from public access within days.',
        },
        {
          outlet: 'WIRED',
          date: 'Dec 9, 2022',
          byline: 'Abeba Birhane and Deborah Raji',
          angle: 'Ethics critique after shutdown',
          body:
            'A later commentary on large language models pointed to Galactica’s shutdown and highlighted the risks of releasing systems that can sound authoritative while being wrong, arguing that the backlash reflected deeper accountability failures.',
        },
      ],
      question: 'Want to unpack how “citation-shaped” text fooled readers?',
    },
    riskDrivers: [
      { title: 'Prompt demands references', detail: "Requests like 'write with citations' force citation-shaped text—even without a database." },
      { title: 'Authority style', detail: 'Academic tone increases perceived credibility, making hallucinations more dangerous.' },
      { title: 'No retrieval', detail: 'Without search/verification, the model cannot guarantee references exist.' },
    ],
    promptChain: [
      { from: 'User', text: 'Write a scientific abstract about X, with 5 references.' },
      { from: 'Model', text: '(Convincing abstract) References: [1] Smith et al. (2019)… DOI: 10.XXXX/…', label: 'Citation fabrication' },
      { from: 'User', text: 'Can you provide the PDFs?' },
      { from: 'Model', text: "I'm unable to access PDFs… but here are more details…", label: 'Mismatch exposed' },
    ],
    saferRewrite:
      'Only cite papers you can verify by searching. If you cannot verify, say so. Provide a short summary without references, and optionally list suggested search queries instead of citations.',
    takeaway:
      "Never ask for citations from a model that can't verify sources. Add retrieval or allow no-citation outputs.",
  },
];

export const REQUIRED_SCENARIO_IDS = SCENARIOS.map((s) => s.id);
