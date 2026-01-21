import { standardPromptTemplate } from '../../templates.js';

export const step5 = {
  id: "step5",
  name: "Solution Gaps",
  model: "Idea Model",
  promptTemplate: standardPromptTemplate,
  variables: ["alternatives"],
  detailedPrompt: `
Analyze why current solutions {{alternatives}} fail to adequately address the problem.
Identify key gaps and provide:
- {{gaps: "Specific gaps in current solutions, such as cost, speed, usability, scalability, or feature limitations"}}
- {{quantifiedImpact: "Quantified impacts of these gaps, including cost savings potential, time reductions, or efficiency improvements"}}
- {{userFeedback: "Examples of user feedback, complaints, or reviews highlighting dissatisfaction with current {{alternatives}}"}}
Format in professional Markdown with clear sections, metrics, and examples to demonstrate market opportunity.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};