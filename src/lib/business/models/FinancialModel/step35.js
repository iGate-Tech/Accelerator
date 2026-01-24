import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step35 = {
  id: "step35",
  name: "Revenue Streams",
  model: "Financial Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["modelType", "revenueStreams", "revenueModel"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Explain how revenue is generated per customer in {{modelType}}.

Provide:
- {{revenueStreams: "Primary and secondary revenue streams with descriptions and amounts"}}
- {{revenueModel: "How the business makes money - pricing units, frequency, and average revenue per user"}}

Structure in professional Markdown with revenue breakdown table and unit economics.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.revenueStreams) issues.push('Missing revenue streams');
    return { valid: issues.length === 0, issues };
  },
};
