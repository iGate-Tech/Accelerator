import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step36 = {
  id: "step36",
  name: "Unit Economics",
  model: "Financial Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["modelType", "cac", "ltv", "grossMargin"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Provide Customer Acquisition Cost (CAC), Lifetime Value (LTV), and gross margin assumptions for {{modelType}}.

Provide:
- {{cac: "Customer Acquisition Cost in dollars with breakdown (sales, marketing, tech)"}}
- {{ltv: "Lifetime Value calculation with revenue per customer and expected lifespan"}}
- {{grossMargin: "Gross margin percentage with cost of goods sold breakdown"}}

Structure in professional Markdown with unit economics table and LTV:CAC ratio analysis.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.cac) issues.push('Missing CAC');
    if (!context.ltv) issues.push('Missing LTV');
    if (parseFloat(context.ltv) > 0 && parseFloat(context.cac) > 0) {
      const ratio = parseFloat(context.ltv) / parseFloat(context.cac);
      if (ratio < 1) issues.push('LTV:CAC ratio should be greater than 1');
    }
    return { valid: issues.length === 0, issues };
  },
};
