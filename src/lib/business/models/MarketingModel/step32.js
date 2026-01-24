import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step32 = {
  id: "step32",
  name: "Customer Acquisition",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["industry", "solution", "customerChannels", "channelPriority"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify channels to acquire customers in {{industry}} for {{solution}}. Rank by priority.

Provide:
- {{customerChannels: "Comprehensive list of customer acquisition channels with descriptions"}}
- {{channelPriority: "Ranked channels with justification for priority order"}}

Structure in professional Markdown with channel analysis table, cost estimates, and prioritization rationale.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.customerChannels) issues.push('Missing customer acquisition channels');
    return { valid: issues.length === 0, issues };
  },
};
