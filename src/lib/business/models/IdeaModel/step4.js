import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step4 = {
  id: "step4",
  name: "Current Solutions",
  model: "Idea Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["problem"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify and analyze current solutions for the problem: {{problem}}.
Provide:
- {{alternatives: "List of existing solutions, categorized by type (e.g., software, manual processes, competitors), with specific examples"}}
- {{adoptionRates: "Estimated adoption rates for each solution, including market share percentages and user segments"}}
- {{prosCons: "Detailed pros and cons for each solution, focusing on effectiveness, cost, accessibility, and limitations related to {{problem}}"}}
Structure in professional Markdown with tables for comparisons and bullet points for details.
Ensure analysis highlights gaps that your solution could address.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};