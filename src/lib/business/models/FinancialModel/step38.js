import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step38 = {
  id: "step38",
  name: "Financial Projections",
  model: "Financial Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "revenue", "expenses", "financialProjections", "year1Revenue", "year2Revenue", "year3Revenue"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Provide 3-year revenue and expense projections for {{solution}}.

Provide:
- {{financialProjections: "3-year financial summary with revenue, expenses, and profit/loss by year"}}
- {{year1Revenue: "Year 1 revenue projection with assumptions"}}
- {{year2Revenue: "Year 2 revenue projection with growth assumptions"}}
- {{year3Revenue: "Year 3 revenue projection with scaling assumptions"}}

Structure in professional Markdown with yearly tables, growth rates, and key assumptions.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.financialProjections) issues.push('Missing financial projections');
    return { valid: issues.length === 0, issues };
  },
};
