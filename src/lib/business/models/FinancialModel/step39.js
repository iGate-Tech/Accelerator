import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step39 = {
  id: "step39",
  name: "Burn Rate Analysis",
  model: "Financial Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["fixedCosts", "variableCosts", "monthlyBurn", "runway"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Calculate the monthly burn rate and runway for your startup.

Provide:
- {{monthlyBurn: "Monthly burn rate combining all expenses minus revenue"}}
- {{runway: "Months of runway based on current cash and burn rate"}}

Also embed {{burnRate: "Complete burn rate analysis with breakdown"}}.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.monthlyBurn) issues.push('Missing monthly burn rate');
    if (!context.runway) issues.push('Missing runway calculation');
    return { valid: issues.length === 0, issues };
  },
};
