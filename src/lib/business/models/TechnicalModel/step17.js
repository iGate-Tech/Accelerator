import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step17 = {
  id: "step17",
  name: "Technical Architecture",
  model: "Technical Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "modelType"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Design the technical architecture for the solution {{solution}} in the business model {{modelType}}.
Recommend:
- {{techStack: "Technology stack, including frontend, backend, database, and cloud services"}}
- {{architecture: "High-level architecture diagram description, including components and data flow"}}
- {{patterns: "Design patterns used, such as microservices, serverless, or MVC"}}
- {{scalability: "Scalability approach, including horizontal/vertical scaling and performance considerations"}}
Provide justifications and present in professional Markdown with diagrams descriptions and technical details.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};