import { standardPromptTemplate } from '../../templates.js';

export const step6 = {
  id: "step6",
  name: "User Persona",
  model: "Idea Model",
  promptTemplate: standardPromptTemplate,
  variables: ["problem"],
  detailedPrompt: `
Develop a detailed user persona for someone directly suffering from the problem: {{problem}}.
Include:
- {{persona: "Comprehensive persona description covering demographics (age, gender, location), professional details (job title, industry, income), psychographics (pain points, motivations), and background"}}
- {{workflow: "Detailed description of the user's daily workflow, including pain points related to {{problem}} and current coping mechanisms"}}
- {{decisionProcess: "Step-by-step decision-making process for addressing {{problem}}, including triggers, research methods, and barriers to adoption"}}
Present in professional Markdown with a persona profile format, bullet points, and practical insights for product development.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};