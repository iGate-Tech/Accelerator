import { standardPromptTemplate } from '../../templates.js';

export const step7 = {
  id: "step7",
  name: "Urgency Assessment",
  model: "Idea Model",
  promptTemplate: standardPromptTemplate,
  variables: ["persona"],
  detailedPrompt: `
Assess the urgency for the persona {{persona}} to solve the problem.
Determine:
- {{urgency: "Whether this is a must-have (immediate need) or nice-to-have (optional improvement), with justification based on impact and timing"}}
- {{consequences: "Detailed consequences of not solving the problem, including short-term pain and long-term risks for {{persona}}"}}
- {{examples: "Real-world examples or scenarios illustrating the urgency, such as time-sensitive situations or competitive pressures"}}
Use professional Markdown with clear reasoning and metrics to support investor interest.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};