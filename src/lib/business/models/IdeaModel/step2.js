import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step2 = {
  id: "step2",
  name: "Problem Analysis",
  model: "Idea Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["problem"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Analyze the specific problem: {{problem}}.

Provide:
- {{strugglers: "Who suffers from {{problem}}, including demographics, industries, and specific examples"}}
- {{impactScale: "Quantitative scale of {{problem}}'s impact - affected population, economic losses, market disruption"}}
- {{evidence: "Data sources, studies, or real-world examples validating {{problem}}"}}
Structure in professional Markdown with clear sections and bullet points.
All content must relate to {{problem}}.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};
