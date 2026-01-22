import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step13 = {
  id: "step13",
  name: "Revenue Streams",
  model: "Business Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["modelType"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Design revenue streams for the solution using the business model {{modelType}}.
Identify:
- {{revenue: "Primary and secondary revenue streams, with descriptions and examples"}}
- {{pricingTiers: "Pricing tiers or structures, including entry-level and premium options"}}
- {{monetizationPotential: "Estimated monetization potential for each stream, with market size considerations"}}
- {{customerWTP: "Customer willingness to pay analysis, including price sensitivity and value perception"}}
Use professional Markdown with tables for pricing and financial estimates.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};