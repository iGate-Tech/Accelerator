import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step26 = {
  id: "step26",
  name: "Total Addressable Market",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["industry", "tam", "calculationMethod", "dataSources", "tamRationale"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Estimate the Total Addressable Market (TAM) for {{industry}}. Explain the calculation method.

Provide:
- {{tam: "Total Addressable Market value in dollars with clear calculation methodology"}}
- {{calculationMethod: "TAM calculation approach (top-down, bottom-up, or hybrid) with assumptions"}}
- {{dataSources: "Data sources and references supporting the market size estimate"}}
- {{tamRationale: "Rationale for why {{industry}} represents the full market opportunity"}}

Structure in professional Markdown with calculation breakdowns, assumptions, and source citations.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.tam) issues.push('Missing TAM value');
    if (!context.calculationMethod) issues.push('Missing calculation method');
    return { valid: issues.length === 0, issues };
  },
};