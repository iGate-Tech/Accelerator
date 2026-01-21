import { standardPromptTemplate } from '../../templates.js';

export const step10 = {
  id: "step10",
  name: "Value Proposition",
  model: "Business Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution", "alternatives", "evidence"],
  detailedPrompt: `
Craft a compelling value proposition for the solution {{solution}} compared to alternatives {{alternatives}}.
Highlight:
- {{valueProp: "Clear, concise value proposition statement summarizing the unique value delivered"}}
- {{uniqueBenefits: "Specific benefits that set this solution apart, tied to {{evidence}} and user needs"}}
- {{quantifiedValue: "Quantified value, such as cost savings percentages, time reductions, or ROI metrics"}}
- {{targetCustomers: "Primary target customer segments who will benefit most from this value proposition"}}
Use professional Markdown with persuasive language, examples, and data from {{evidence}}.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};