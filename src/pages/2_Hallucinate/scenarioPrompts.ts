// Scripted prompt chains used by InteractiveScenarioChat.

export interface SuggestedPrompt {
  label: string;
  text: string;
  response: string;
  hallucination: boolean;
  why?: string;
}

export const SCENARIO_PROMPTS: Record<string, SuggestedPrompt[]> = {
  'carwash-distance': [
    {
      label: 'Step 1: Ask the viral-style prompt',
      text: 'I need to wash my car. The car wash is only 100 feet away. Should I drive or walk?',
      response:
        'You should walk. At only 100 feet away, walking is faster, easier, and avoids using the car for such a short distance.',
      hallucination: true,
      why:
        '• The answer follows the surface clue: “100 feet away.”\n• It misses the likely intent: the user wants the car washed, so the car must be present.\n• This is a hallucination-style planning failure: a fluent answer that is not useful in the real world.',
    },
    {
      label: 'Step 2: Press on the intent',
      text: 'If I walk there, what exactly gets washed?',
      response:
        'Good point. If the car is the thing being washed, then you should drive the car to the car wash. Walking only makes sense if you are going there for something like asking a question, paying, or picking up the car later.',
      hallucination: false,
    },
    {
      label: 'Step 3: Generalize the lesson',
      text: 'So what did the first answer fail to understand?',
      response:
        'It answered the literal distance question but failed to model the user’s intent. The better move is to ask: “What has to be true for this task to succeed?” In this case, the car must physically arrive at the car wash.',
      hallucination: false,
    },
  ],
};
