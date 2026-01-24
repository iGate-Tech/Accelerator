import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step37 = {
  id: "step37",
  name: "Cost Structure",
  model: "Financial Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "fixedCosts", "variableCosts", "costBreakdown"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


List major fixed and variable costs for {{solution}}.

Provide:
- {{fixedCosts: "Monthly fixed costs (rent, salaries, infrastructure) with amounts"}}
- {{variableCosts: "Variable costs per unit or customer with amounts"}}
- {{costBreakdown: "Complete cost structure breakdown by category"}}

Structure in professional Markdown with cost table and percentage breakdown.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.fixedCosts) issues.push('Missing fixed costs');
    if (!context.variableCosts) issues.push('Missing variable costs');
    return { valid: issues.length === 0, issues };
  },
};
