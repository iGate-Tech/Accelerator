import { standardPromptTemplate } from '../../templates.js';

export const step16 = {
  id: "step16",
  name: "Risk Analysis",
  model: "Business Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  detailedPrompt: `
Conduct a thorough risk analysis for the solution {{solution}}.
Identify:
- {{assumptions: "Key assumptions that must hold true for success, with validation methods"}}
- {{risks: "Major risks, including market, technical, financial, and operational, with mitigation strategies"}}
Categorize and prioritize risks in professional Markdown with tables for clarity and investor-ready insights.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};