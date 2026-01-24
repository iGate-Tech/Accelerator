import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step55 = {
  id: "step55",
  name: "Compliance Requirements",
  model: "Legal Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "compliance", "contracts", "regulatory"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify key contracts and compliance requirements for {{solution}}.

Provide:
- {{compliance: "Regulatory compliance requirements (GDPR, HIPAA, etc.)"}}
- {{contracts: "Key contracts needed (terms, privacy, NDAs)"}}
- {{regulatory: "Industry-specific regulatory requirements"}}

Structure in professional Markdown with compliance checklist.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.compliance) issues.push('Missing compliance requirements');
    return { valid: issues.length === 0, issues };
  },
};
