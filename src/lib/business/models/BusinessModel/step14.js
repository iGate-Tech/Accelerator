import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step14 = {
  id: "step14",
  name: "Pricing Strategy",
  model: "Business Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["modelType", "persona", "market"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Develop a comprehensive pricing strategy for the solution in the business model {{modelType}}.
Factor in {{persona}} and {{market}} to provide:
- {{pricing: "Overall pricing approach (e.g., cost-plus, value-based), with justification"}}
- {{tiers: "Detailed pricing tiers, including features, prices, and target segments"}}
- {{logic: "Pricing logic explaining how prices reflect value, costs, and market positioning"}}
- {{customerAcceptance: "Expected customer acceptance levels, including objections and mitigation strategies"}}
Present in professional Markdown with tables, competitor comparisons, and data-driven insights.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};