import { standardPromptTemplate } from '../../templates.js';

export const step27 = {
  id: "step27",
  name: "Serviceable Available Market",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplate,
  variables: ["market"],
  detailedPrompt: `
Estimate the Serviceable Available Market (SAM) for {{market}}. Describe realistic reach.

Provide:
- {{sam: "Serviceable Available Market value in dollars representing realistic market reach"}}
- {{reachRationale: "Rationale for market reach percentage based on product-market fit factors"}}
- {{segmentation: "Market segmentation showing which parts of {{market}} are serviceable"}}
- {{geographicScope: "Geographic reach and expansion potential over time"}}

Structure in professional Markdown with market segmentation, reach assumptions, and expansion timeline.
  `,
  validate: (context) => ({ valid: true, issues: [] }),
};