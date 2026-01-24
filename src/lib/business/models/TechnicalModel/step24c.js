import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step24c = {
  id: "step24c",
  name: "Integrations Definition",
  model: "Technical Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "architecture", "apiDesign"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Define the integrations strategy for {{solution}} based on architecture {{architecture}} and API design {{apiDesign}}.

Provide:
- {{integrations: "Comprehensive integrations strategy covering essential and optional integrations"}}
- {{integrationPlan: "Detailed integration implementation plan with priorities and timelines"}}
- {{partnershipOpportunities: "Partnership opportunities through API exposure and integration marketplace"}}

Structure in professional Markdown with integration matrix, priority matrix, and partnership strategy.

Also embed {{integrations: "Full integrations list for use in subsequent steps"}}.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.integrations) issues.push('Missing integrations strategy');
    if (!context.integrationPlan) issues.push('Missing integration plan');
    return { valid: issues.length === 0, issues };
  },
};
