import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step12 = {
  id: "step12",
  name: "Business Model",
  model: "Business Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["persona"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Determine the optimal business model for the solution based on the persona {{persona}}.
Select and justify:
- {{modelType: "Chosen business model type (e.g., SaaS, marketplace, subscription), with rationale tied to {{persona}} needs"}}
- {{prosCons: "Pros and cons of the chosen model compared to alternatives"}}
- {{scalability: "How the model scales with user growth, including technical and operational aspects"}}
- {{feasibility: "Feasibility assessment, including market fit, implementation challenges, and resource requirements"}}
Present in professional Markdown with analysis and recommendations.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};