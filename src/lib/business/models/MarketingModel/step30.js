import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step30 = {
  id: "step30",
  name: "Competitive Landscape",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["industry", "solution", "competitors", "competitorsList"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


List direct and indirect competitors in {{industry}}. Explain how {{solution}} differs.

Provide:
- {{competitors: "Comprehensive analysis of the competitive landscape"}}
- {{competitorsList: "List of 5-10 direct and indirect competitors with brief descriptions"}}

Structure in professional Markdown with competitor table, positioning map, and differentiation analysis.

Embed {{competitors: "Full competitive analysis for use in reports"}}.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.competitors && !context.competitorsList) issues.push('Missing competitive analysis');
    return { valid: issues.length === 0, issues };
  },
};
