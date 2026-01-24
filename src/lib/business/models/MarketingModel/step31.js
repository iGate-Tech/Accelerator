import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step31 = {
  id: "step31",
  name: "Market Entry",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["industry", "solution", "marketEntryStrategy"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Develop a strategy to enter {{industry}} and acquire first customers for {{solution}}.

Provide:
- {{marketEntryStrategy: "Comprehensive market entry approach including timing, channels, and initial target segments"}}

Structure in professional Markdown with entry timeline, channel strategy, and customer acquisition plan.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.marketEntryStrategy) issues.push('Missing market entry strategy');
    return { valid: issues.length === 0, issues };
  },
};
