import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step56 = {
  id: "step56",
  name: "Risk Assessment",
  model: "Legal Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "legalRisks", "regulatoryRisks", "mitigation"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify legal and regulatory risks for {{solution}}.

Provide:
- {{legalRisks: "Legal risks including liability, IP disputes, and contractual risks"}}
- {{regulatoryRisks: "Regulatory risks and compliance exposure"}}
- {{mitigation: "Risk mitigation strategies and contingency plans"}}

Structure in professional Markdown with risk matrix and mitigation plan.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.legalRisks) issues.push('Missing legal risk assessment');
    return { valid: issues.length === 0, issues };
  },
};
