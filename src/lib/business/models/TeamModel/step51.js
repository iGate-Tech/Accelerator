import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step51 = {
  id: "step51",
  name: "Hiring Plan",
  model: "Team Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "missingSkills", "hiringPlan", "hiringTimeline"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Develop a hiring plan for {{solution}} for the next 12-24 months.

Provide:
- {{hiringPlan: "12-24 month hiring plan with roles, timing, and priorities"}}
- {{hiringTimeline: "Quarter-by-quarter hiring schedule"}}

Structure in professional Markdown with hiring roadmap and cost projections.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.hiringPlan) issues.push('Missing hiring plan');
    return { valid: issues.length === 0, issues };
  },
};
