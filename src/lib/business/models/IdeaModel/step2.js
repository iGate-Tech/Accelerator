import { standardPromptTemplate } from '../../templates.js';

export const step2 = {
  id: "step2",
  name: "Problem Analysis",
  model: "Idea Model",
  promptTemplate: standardPromptTemplate,
  variables: ["problem"],
   detailedPrompt: `
IMPORTANT: Follow these instructions exactly and use the specified placeholder format for your response.

Analyze the specific problem: {{problem}}.
Provide a comprehensive analysis including:
- {{strugglers: "Detailed explanation of who suffers from this problem most, including demographics, industries, and specific examples"}}
- {{impactScale: "Quantitative scale of the problem's impact, such as affected population size, economic losses, or market disruption metrics"}}
- {{evidence: "Supporting evidence from data sources, studies, or real-world examples that validate the problem's existence and severity"}}
Structure your response in professional Markdown with clear sections, bullet points, and practical insights.
Ensure the analysis is investor-ready, focused on market relevance, and directly tied to {{problem}}.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};