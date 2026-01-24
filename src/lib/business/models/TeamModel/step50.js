import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step50 = {
  id: "step50",
  name: "Team Gaps",
  model: "Team Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["persona", "solution", "team", "missingSkills", "criticalGaps"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify key skills missing in the team for {{solution}} to serve {{persona}}.

Provide:
- {{missingSkills: "Critical skills and roles currently missing from the team"}}
- {{criticalGaps: "Most important gaps to fill prioritized by impact"}}

Structure in professional Markdown with skills gap analysis and priority matrix.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.missingSkills) issues.push('Missing skills gap analysis');
    return { valid: issues.length === 0, issues };
  },
};
