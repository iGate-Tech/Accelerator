import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step48 = {
  id: "step48",
  name: "Funding Milestones",
  model: "Funding Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "askAmount", "milestones"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


List milestones unlocked by this funding round ({{askAmount}}) for {{solution}}.

Provide:
- {{milestones: "Key milestones to achieve with the funding across product, growth, and team"}}

Structure in professional Markdown with milestone timeline and success metrics.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.milestones) issues.push('Missing funding milestones');
    return { valid: issues.length === 0, issues };
  },
};
