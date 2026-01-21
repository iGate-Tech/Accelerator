import { standardPromptTemplate } from '../../templates.js';

export const step22 = {
  id: "step22",
  name: "API & Integrations",
  model: "Technical Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution", "integrations"],
  detailedPrompt: `
Design API strategy for {{solution}}. Plan REST/GraphQL design, third-party {{integrations}}, webhooks, and partnership opportunities.

Provide:
- {{apiDesign: "API architecture choice (REST, GraphQL, gRPC) with justification"}}
- {{integrations: "Third-party integrations strategy including essential and optional services"}}
- {{webhooks: "Webhook design for event-driven architecture and partner integrations"}}
- {{partnerships: "Partnership opportunities through API exposure and integration marketplace"}}

Structure in professional Markdown with clear sections, endpoint designs, and integration priorities.
  `,
  validate: (context) => ({ valid: true, issues: [] }),
};