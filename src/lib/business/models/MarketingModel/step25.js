import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step25 = {
  id: "step25",
  name: "Target Market",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Clearly define the target market for {{solution}} by industry, size, and customer type.

Provide:
- {{industry: "Target industry or industries with market size and growth characteristics"}}
- {{customerType: "Customer segments including company size, geography, and buyer personas"}}
- {{marketSize: "Initial target market size with justification and potential for expansion"}}
- {{idealCustomer: "Detailed profile of the ideal first customer for {{solution}}"}}

Structure in professional Markdown with clear segments, market maps, and customer profiles.
  `,
  validate: (context) => ({ valid: true, issues: [] }),
};