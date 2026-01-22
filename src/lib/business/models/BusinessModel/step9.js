import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step9 = {
  id: "step9",
  name: "Solution Design",
  model: "Business Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["gaps", "persona"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

The gaps identified are: {{gaps}}

You MUST design a solution that directly addresses {{problem}}.
Your solution MUST:
- Be directly related to {{problem}}
- Address the specific gaps mentioned above
- Be suitable for the persona: {{persona}}

If the gaps {{gaps}} seem unrelated to {{problem}}, IGNORE the gaps and design a solution that directly addresses {{problem}} instead.

Provide:
- {{solution: "High-level solution description directly related to {{problem}}"}}
- {{coreFeatures: "List of 3-5 core features that solve {{problem}}, with brief descriptions"}}
- {{addressedGaps: "How each feature addresses {{problem}} and the identified gaps"}}
- {{differentiation: "Key differentiators from existing solutions for {{problem}}"}}
- {{modelType: "Business model type such as SaaS, Marketplace, B2B, B2C, or Hybrid"}}

IMPORTANT: Your solution MUST be about {{problem}}. Do not generate solutions for unrelated topics.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};
