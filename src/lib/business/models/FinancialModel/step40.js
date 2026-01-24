import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step40 = {
  id: "step40",
  name: "Break-even Analysis",
  model: "Financial Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["fixedCosts", "variableCosts", "revenue", "breakevenPoint", "breakevenTimeline"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Determine when {{solution}} will break even.

Provide:
- {{breakevenPoint: "Break-even point in units or revenue"}}
- {{breakevenTimeline: "Timeline to break-even (months/years from launch)"}}

Structure in professional Markdown with break-even chart and sensitivity analysis.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.breakevenPoint) issues.push('Missing break-even point');
    if (!context.breakevenTimeline) issues.push('Missing break-even timeline');
    return { valid: issues.length === 0, issues };
  },
};
