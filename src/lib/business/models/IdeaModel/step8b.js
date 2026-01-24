import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step8b = {
  id: "step8b",
  name: "Traction Definition",
  model: "Idea Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["problem", "evidence", "persona"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Define traction metrics and validation evidence for the problem affecting {{persona}}.

Provide:
- {{traction: "Current traction metrics, validation evidence, and key performance indicators"}}
- {{validationMetrics: "Quantitative and qualitative metrics proving problem validation"}}
- {{keyMilestones: "Key milestones achieved in problem validation and customer discovery"}}

Structure in professional Markdown with traction scorecard, validation metrics, and milestone tracker.

Also embed {{traction: "Full traction data for use in Funding Model steps"}}.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.traction) issues.push('Missing traction data');
    if (!context.validationMetrics) issues.push('Missing validation metrics');
    return { valid: issues.length === 0, issues };
  },
};
