import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step47 = {
  id: "step47",
  name: "Target Investors",
  model: "Funding Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "stage", "targetInvestors", "investorTypes"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify target investor types for {{solution}} at your funding stage.

Provide:
- {{targetInvestors: "Specific investor types and categories to target"}}
- {{investorTypes: " angel investors, VCs, corporate VCs, etc. with examples"}}

Structure in professional Markdown with investor targeting matrix.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.targetInvestors) issues.push('Missing target investors');
    return { valid: issues.length === 0, issues };
  },
};
