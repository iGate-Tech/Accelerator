import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step46 = {
  id: "step46",
  name: "Pre-money Valuation",
  model: "Funding Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["valuation", "askAmount", "preMoney"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Calculate the expected pre-money valuation for your startup, ensuring alignment with {{valuation}} post-money.

Provide:
- {{preMoney: "Pre-money valuation with calculation"}}

Structure in professional Markdown with valuation breakdown and terms analysis.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.preMoney) issues.push('Missing pre-money valuation');
    if (parseFloat(context.preMoney) >= parseFloat(context.askAmount)) {
      issues.push('Pre-money should be less than funding ask');
    }
    return { valid: issues.length === 0, issues };
  },
};
