import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step27 = {
  id: "step27",
  name: "Serviceable Available Market",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["tam", "sam", "reachRationale", "segmentation", "geographicScope"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Estimate the Serviceable Available Market (SAM) for your target market ({{tam}}). Describe realistic reach.

Provide:
- {{sam: "Serviceable Available Market value in dollars representing realistic market reach"}}
- {{reachRationale: "Rationale for market reach percentage based on product-market fit factors"}}
- {{segmentation: "Market segmentation showing which parts of the market are serviceable"}}
- {{geographicScope: "Geographic reach and expansion potential over time"}}

Structure in professional Markdown with market segmentation, reach assumptions, and expansion timeline.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.sam) issues.push('Missing SAM value');
    if (parseFloat(context.sam) > parseFloat(context.tam)) {
      issues.push('SAM cannot be larger than TAM');
    }
    return { valid: issues.length === 0, issues };
  },
};