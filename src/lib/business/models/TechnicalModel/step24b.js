import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step24b = {
  id: "step24b",
  name: "Timeline Definition",
  model: "Technical Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "mvpFeatures", "milestones"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Define the project timeline for {{solution}} based on the MVP features {{mvpFeatures}} and milestones {{milestones}}.

Provide:
- {{timeline: "Comprehensive project timeline with phases, milestones, and deadlines"}}
- {{projectPlan: "Detailed project plan with tasks, dependencies, and resources"}}
- {{developmentPhases: "Breakdown of development phases with durations and deliverables"}}

Structure in professional Markdown with Gantt-style timeline, phase descriptions, and key milestones.

Also embed {{timeline: "Full timeline for use in subsequent steps"}}.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.timeline) issues.push('Missing timeline');
    if (!context.projectPlan) issues.push('Missing project plan');
    return { valid: issues.length === 0, issues };
  },
};
