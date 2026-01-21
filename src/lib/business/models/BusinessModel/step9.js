import { standardPromptTemplate } from '../../templates.js';

export const step9 = {
  id: "step9",
  name: "Solution Design",
  model: "Business Model",
  promptTemplate: standardPromptTemplate,
  variables: ["gaps", "persona"],
  detailedPrompt: `
Design a comprehensive solution addressing the gaps {{gaps}} for the persona {{persona}}.
Detail:
- {{solution: "High-level solution description, including technology approach, delivery method, and core value proposition"}}
- {{coreFeatures: "List of 3-5 core features that solve {{gaps}}, with brief descriptions of functionality"}}
- {{addressedGaps: "How each feature specifically addresses the identified {{gaps}}, with expected outcomes"}}
- {{differentiation: "Key differentiators from existing solutions, including unique benefits and competitive advantages"}}
- {{modelType: "Business model type such as SaaS, Marketplace, B2B, B2C, or Hybrid, with justification for the choice"}}
Ensure alignment with {{persona}}'s needs and present in professional Markdown with sections and bullet points.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};