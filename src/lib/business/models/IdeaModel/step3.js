import { standardPromptTemplate } from '../../templates.js';

export const step3 = {
  id: "step3",
  name: "Severity Assessment",
  model: "Idea Model",
  promptTemplate: standardPromptTemplate,
  variables: ["problem"],
  detailedPrompt: `
Evaluate the severity and frequency of the problem: {{problem}}.
Provide a detailed assessment with:
- {{severity: "Severity level (e.g., high, medium, low) with justification based on impact and urgency"}}
- {{frequency: "How often the problem occurs, including patterns, triggers, and affected scenarios"}}
- {{consequences: "Detailed consequences for affected parties, including short-term and long-term effects"}}
- {{comparison: "Industry or market comparison showing how this problem compares to similar issues in other sectors"}}
Use professional Markdown formatting with sections, metrics where possible, and practical examples tied to {{problem}}.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};