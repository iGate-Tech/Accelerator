import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step24 = {
  id: "step24",
  name: "Technical Roadmap",
  model: "Technical Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "mvpFeatures", "timeline"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Create technical roadmap for {{solution}} with {{mvpFeatures}} in {{timeline}}. Define milestones, resources needed, technical risks, and timeline phases.

Provide:
- {{milestones: "Key milestones with specific deliverables and acceptance criteria"}}
- {{resources: "Resources needed per phase including team size, expertise, and tools"}}
- {{risks: "Technical risks with mitigation strategies and contingency plans"}}
- {{phases: "Timeline phases with duration, objectives, and dependencies"}}

Structure in professional Markdown with clear phases, timeline visualization, and risk assessment table.
  `,
  validate: (context) => ({ valid: true, issues: [] }),
};