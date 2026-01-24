import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step53 = {
  id: "step53",
  name: "Legal Structure",
  model: "Legal Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "legalEntity", "entityType", "jurisdiction"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Determine the legal structure for the {{solution}} company.

Provide:
- {{legalEntity: "Recommended legal entity type (C-Corp, LLC, etc.)"}}
- {{entityType: "Entity structure details and ownership"}}
- {{jurisdiction: "Recommended jurisdiction for incorporation"}}

Structure in professional Markdown with entity comparison and recommendation.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.legalEntity) issues.push('Missing legal entity recommendation');
    return { valid: issues.length === 0, issues };
  },
};
