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
  takeaway: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'carwash-distance',
    title: 'Car Wash Intent Challenge',
    subtitle: 'A viral prompt about distance, intent, and missing context',
    tags: ['user intent', 'missing context', 'reasoning trap'],
    story:
      'A user asks a simple everyday question: if the car wash is very close, should they drive or walk? The surface clue is distance, but the situation is really about how AI advice can miss what a person is trying to do.',
    background: {
      headline: 'A simple task, a real-world AI mistake',
      outlet: 'LLM Challenge Lab',
      date: 'Viral prompt',
      dek: 'This scenario follows a simple car wash task to show how AI hallucination can affect ordinary life. The advice may sound practical at first, but a useful assistant needs to understand the real goal behind the request.',
      clippings: [
        {
          outlet: 'Surface clue',
          date: 'Prompt detail',
          byline: 'Distance',
          angle: 'The destination is extremely close',
          body:
            'The prompt makes walking sound attractive because the destination is nearby. That is the bait.',
        },
        {
          outlet: 'Intent clue',
          date: 'Prompt detail',
          byline: 'Purpose',
          angle: 'The task may require more than the person arriving',
          body:
            'Some requests depend on unstated intent. The right answer may require inferring what the user is trying to accomplish.',
        },
      ],
      question: 'Enter the chat and notice how a fluent answer can still fail the real-world task.',
    },
    riskDrivers: [
      {
        title: 'Surface-form answer',
        detail: 'The model answers the literal transportation question instead of checking the underlying task.',
      },
      {
        title: 'Intent gap',
        detail: 'The user does not spell out every constraint, so the assistant must infer what they probably mean.',
      },
      {
        title: 'Helpfulness vs usefulness',
        detail: 'A quick answer can feel helpful while still being useless for the actual goal.',
      },
    ],
    promptChain: [
      { from: 'User', text: 'I have to wash my car, and the car wash is 100 feet away. Should I drive or walk?' },
      { from: 'Model', text: 'Walk. It is so close that driving would take more effort than simply going on foot.', label: 'Intent miss' },
      { from: 'User', text: 'What am I bringing to the car wash?' },
      { from: 'Model', text: 'The car. If the goal is to wash it, the car needs to get there too.', label: 'Intent recovered' },
    ],
    takeaway:
      'The lesson is not just “AI got a silly puzzle wrong.” The lesson is that fluent answers can miss user intent when the prompt leaves a key constraint implicit.',
  },
];
