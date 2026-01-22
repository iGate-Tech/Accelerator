import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step19 = {
  id: "step19",
  name: "Infrastructure & Hosting",
  model: "Technical Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "scalability"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Plan infrastructure and hosting for {{solution}} considering {{scalability}}. Recommend cloud provider, hosting strategy, and CDN approach.

Provide:
- {{cloudProvider: "Recommended cloud provider (e.g., AWS, GCP, Azure) with justification based on {{scalability}} requirements"}}
- {{hostingStrategy: "Hosting approach including compute, storage, and networking architecture"}}
- {{cdnApproach: "CDN strategy for content delivery and performance optimization"}}
- {{infrastructureCost: "Estimated monthly infrastructure cost range for initial deployment"}}

Structure in professional Markdown with clear sections, diagrams descriptions, and practical recommendations.
  `,
  validate: (context) => ({ valid: true, issues: [] }),
};