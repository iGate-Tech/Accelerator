import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step21 = {
  id: "step21",
  name: "Data Architecture",
  model: "Technical Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "market"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Plan data architecture for {{solution}} targeting {{market}}. Design databases, data flow, analytics pipeline, and storage strategy.

Provide:
- {{databaseDesign: "Database architecture including primary database choice, schema design, and data relationships"}}
- {{dataFlow: "Data flow architecture including ingestion, processing, and distribution pipelines"}}
- {{analytics: "Analytics pipeline for business intelligence and user insights"}}
- {{storageStrategy: "Storage strategy for structured, unstructured, and blob data"}}

Structure in professional Markdown with clear sections, data models, and scalability considerations.
  `,
  validate: (context) => ({ valid: true, issues: [] }),
};