import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step28 = {
  id: "step28",
  name: "Serviceable Obtainable Market",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["market"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Estimate the Serviceable Obtainable Market (SOM) for {{market}}. Explain initial capture share rationale.

Provide:
- {{som: "Serviceable Obtainable Market value representing realistic 3-5 year capture"}}
- {{captureShare: "Initial market capture share percentage with detailed justification"}}
- {{captureRationale: "Rationale for market capture based on competitive advantages and resources"}}
- {{growthProjection: "Market capture growth trajectory over 5 years"}}

Structure in professional Markdown with market share calculations, growth projections, and competitive positioning.
  `,
  validate: (context) => ({ valid: true, issues: [] }),
};