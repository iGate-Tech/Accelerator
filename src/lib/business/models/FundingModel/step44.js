import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step44 = {
  id: "step44",
  name: "Funding Amount",
  model: "Funding Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "monthlyBurn", "runway", "askAmount"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Determine how much capital to raise for {{solution}} and provide the rationale.

Provide:
- {{askAmount: "Recommended funding amount with justification based on {{monthlyBurn}} burn and desired {{runway}} months"}}

Structure in professional Markdown with funding calculation and runway analysis.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.askAmount) issues.push('Missing funding ask amount');
    return { valid: issues.length === 0, issues };
  },
};
