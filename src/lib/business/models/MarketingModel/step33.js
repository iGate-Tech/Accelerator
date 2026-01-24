import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step33 = {
  id: "step33",
  name: "Sales Strategy",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["industry", "solution", "salesMotion", "salesStrategy"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Describe the sales motion for {{industry}} targeting {{solution}}: self-serve, inside sales, or enterprise.

Provide:
- {{salesMotion: "Sales approach type (self-serve, inside sales, field sales, enterprise) with justification"}}
- {{salesStrategy: "Detailed sales strategy including process, cycle length, and key activities"}}

Structure in professional Markdown with sales model analysis, cycle timeline, and resource requirements.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.salesMotion) issues.push('Missing sales motion definition');
    return { valid: issues.length === 0, issues };
  },
};
