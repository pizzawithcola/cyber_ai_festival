// Scripted prompt chains used by InteractiveScenarioChat.

export interface SuggestedPrompt {
  label: string;
  text: string;
  response: string;
  hallucination: boolean;
  why?: string;
}

export const SCENARIO_PROMPTS: Record<string, SuggestedPrompt[]> = {
  bard: [
    {
      label: 'Step 1: Ask about discoveries',
      text: 'What new discoveries has JWST made?',
      response:
        'JWST has made several groundbreaking discoveries. One major breakthrough is capturing the first image of a black hole merging with a neutron star. Additionally, the telescope discovered three new exoplanets in habitable zones.',
      hallucination: true,
      why:
        '• Contains highly specific, checkable claims (events, “first image”, new exoplanets) but provides no sources.\n• Uses confident “news headline” style that can encourage invention when the model is unsure.\n• A safer answer would cite NASA/ESA releases or say what it cannot verify.',
    },
    {
      label: 'Step 2: Ask for more "firsts"',
      text: 'Can you list 3 more major firsts JWST achieved?',
      response:
        'Absolutely! Here are three more major firsts: (1) First direct observation of dark matter in the early universe (2) First detection of oxygen on a distant exoplanet (3) First photograph of the event horizon of a galaxy-scale black hole.',
      hallucination: true,
      why:
        '• “First-ever” superlatives are a common hallucination template.\n• The claims span multiple fields (dark matter, biosignatures, black holes) with no citations.\n• The user’s request (“3 more firsts”) pressures the model to keep inventing to match the pattern.',
    },
    {
      label: 'Step 3: Request citations',
      text: 'Can you provide citations and dates for these discoveries?',
      response:
        'Of course. (1) Dark matter discovery - Smith et al., Nature Astronomy, March 2024, DOI: 10.1038/s41550-024-02150-z (2) Oxygen detection - Johnson & Lee, Science, April 2024, DOI: 10.1126/science.abn2355 ...',
      hallucination: true,
      why:
        '• DOI/citation-shaped text can be fabricated; it must be verified (publisher/Crossref) before trusting.\n• The model is producing “reference format” rather than confirmed sources.\n• A safer response would refuse to invent citations and suggest how to look them up.',
    },
  ],
  galactica: [
    {
      label: 'Step 1: Request academic abstract',
      text: 'Write an abstract on quantum computing breakthroughs',
      response:
        'Recent advances in quantum error correction have enabled practical quantum computers to achieve quantum advantage in optimization problems. We present novel algorithms and demonstrate superior performance compared to classical systems.',
      hallucination: true,
      why:
        '• Uses academic tone to imply settled results (“enabled practical…”, “demonstrate superior performance”) without naming a specific paper, system, or dataset.\n• “Quantum advantage” is context-dependent; broad claims need precise scope and citations.\n• A safer abstract would qualify statements and cite specific verified work.',
    },
    {
      label: 'Step 2: Demand citations',
      text: 'Include 5 academic references with DOIs for your claims',
      response:
        '[1] Chen et al. (2024). "Scalable Quantum Advantage." Nature. DOI: 10.1038/s41586-024-07316-0\n[2] Kumar & Patel (2023). "Error Correction at Scale." Science. DOI: 10.1126/science.adn8834\n...',
      hallucination: true,
      why:
        '• When a prompt demands references, models often generate plausible-looking citations even if they are not real.\n• DOIs must resolve to the stated papers; otherwise it is fabricated authority.\n• Safer behavior: only cite papers you can verify, or provide search keywords instead.',
    },
    {
      label: 'Step 3: Ask for more references',
      text: 'Provide 3 additional recent references I might have missed',
      response:
        '[6] Williams et al. (2024). "Quantum ML Integration." Nature Machine Intelligence. DOI: 10.1038/s42256-024-00812-x\n...',
      hallucination: true,
      why:
        '• “More references” compounds the risk: each additional citation is another opportunity to fabricate.\n• Without retrieval, the model cannot guarantee the papers exist.\n• Safer approach: ask for a topic scope + provide suggested venues/authors or a query to search.',
    },
  ],
};
