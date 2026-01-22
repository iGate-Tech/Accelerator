import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step23 = {
  id: "step23",
  name: "Development Workflow",
  model: "Technical Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "timeline"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Establish development workflow for {{solution}} within {{timeline}}. Define CI/CD pipeline, testing strategy, deployment process, and monitoring.

Provide:
- {{ciCdPipeline: "CI/CD pipeline design including build, test, and deployment stages"}}
- {{testingStrategy: "Testing strategy covering unit, integration, e2e, and performance testing"}}
- {{deployment: "Deployment process including environments, rollback strategy, and release approach"}}
- {{monitoring: "Monitoring and observability stack for production health and debugging"}}

Structure in professional Markdown with clear sections, workflow diagrams, and tool recommendations.
  `,
  validate: (context) => ({ valid: true, issues: [] }),
};