import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step43 = {
  id: "step43",
  name: "Funding Stage",
  model: "Funding Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "traction", "fundingStage"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Determine the appropriate funding stage for {{solution}} based on traction: Pre-seed, Seed, Series A, etc.

Provide:
- {{fundingStage: "Recommended funding stage with justification based on current traction"}}

Structure in professional Markdown with stage characteristics and matching analysis.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.fundingStage) issues.push('Missing funding stage recommendation');
    return { valid: issues.length === 0, issues };
  },
};
