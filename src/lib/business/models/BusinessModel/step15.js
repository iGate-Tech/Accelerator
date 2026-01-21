import { standardPromptTemplate } from '../../templates.js';

export const step15 = {
  id: "step15",
  name: "Competitive Moats",
  model: "Business Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  detailedPrompt: `
Build and analyze competitive moats for the solution {{solution}}.
Focus on barriers to entry and provide:
- {{moat: "Key moats (e.g., technology, network effects, data), prioritized by strength"}}
- {{implementation: "How to implement each moat, including strategies and resources needed"}}
- {{examples: "Real-world examples of similar moats in successful companies"}}
- {{sustainability: "Long-term sustainability of each moat against competition"}}
Structure in professional Markdown with analysis and actionable recommendations.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};