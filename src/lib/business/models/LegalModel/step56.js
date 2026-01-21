import { standardPromptTemplate } from '../../templates.js';

export const step56 = {
  id: "step56",
  name: "Legal Risks",
  model: "Legal Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Identify legal and regulatory risks for AI-powered legal document review.",
  validate: (context) => ({ valid: true, issues: [] }),
};