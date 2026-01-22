import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step29 = {
  id: "step29",
  name: "Market Trends",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["market"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify trends or tailwinds supporting {{market}} growth. Include rates if known.

Provide:
- {{trends: "Key market trends driving growth with specific statistics and growth rates"}}
- {{tailwinds: "Tailwinds supporting market expansion including technology, regulatory, and social factors"}}
- {{disruption: "Market disruption opportunities and timing for new entrants"}}
- {{futureProjection: "5-year market projection with compound growth rate assumptions"}}

Structure in professional Markdown with trend analysis, growth metrics, and strategic implications.
  `,
  validate: (context) => ({ valid: true, issues: [] }),
};