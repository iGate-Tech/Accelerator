import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step20 = {
  id: "step20",
  name: "Security Architecture",
  model: "Technical Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "persona"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Design security architecture for {{solution}} serving {{persona}}. Include authentication, encryption, compliance requirements, and security measures.

Provide:
- {{authentication: "Authentication strategy including auth method, user management, and access controls"}}
- {{encryption: "Data encryption approach for data at rest and in transit"}}
- {{compliance: "Compliance requirements (GDPR, HIPAA, SOC2, etc.) based on {{persona}} industry"}}
- {{securityMeasures: "Security measures including monitoring, threat detection, and incident response"}}

Structure in professional Markdown with clear sections, architecture descriptions, and implementation priorities.
  `,
  validate: (context) => ({ valid: true, issues: [] }),
};