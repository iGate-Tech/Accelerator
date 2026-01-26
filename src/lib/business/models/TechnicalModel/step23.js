import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step23 = {
  id: "step23",
  name: {
    en: "Development Workflow",
    ar: "سير عمل التطوير"
  },
  model: {
    en: "Technical Model",
    ar: "النموذج الفني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "timeline"],
  detailedPrompt: {
    en: `
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
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

أنشئ سير العمل للتطوير لـ {{solution}} ضمن {{timeline}}. عرّف خط أنابيب CI/CD، استراتيجية الاختبار، عملية النشر، والرصد.

قدم:
- {{ciCdPipeline: "تصميم خط أنابيب CI/CD بما في ذلك مراحل البناء، الاختبار، والنشر"}}
- {{testingStrategy: "استراتيجية الاختبار تغطي وحدة الاختبار، التكامل، e2e، واختبار الأداء"}}
- {{deployment: "عملية النشر بما في ذلك البيئات، استراتيجية التراجع، ونهج الإصدار"}}
- {{monitoring: "تكد المراقبة والرؤية لصحة الإنتاج والتصحيح"}}

هيكلة في Markdown احترافي مع أقسام واضحة، مخططات سير العمل، و توصيات الأدوات.
  `
  },
  validate: (context) => ({ valid: true, issues: [] }),
};