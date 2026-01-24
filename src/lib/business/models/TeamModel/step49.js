import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step49 = {
  id: "step49",
  name: "Founding Team",
  model: "Team Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "team", "teamMembers", "foundingTeam"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


List founding team members for {{solution}} and their roles.

Provide:
- {{team: "Complete founding team with names, roles, and relevant experience"}}
- {{teamMembers: "Team composition breakdown by function"}}

Structure in professional Markdown with team table and relevant backgrounds.

Embed {{team: "Full team information for use in reports"}}.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.team && !context.teamMembers) issues.push('Missing founding team');
    return { valid: issues.length === 0, issues };
  },
};
