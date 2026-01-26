import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step24 = {
  id: "step24",
  name: {
    en: "Technical Roadmap",
    ar: "خارطة الطريق التقنية"
  },
  model: {
    en: "Technical Model",
    ar: "النموذج الفني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "mvpFeatures", "timeline"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Create technical roadmap for {{solution}} with {{mvpFeatures}} in {{timeline}}. Define milestones, resources needed, technical risks, and timeline phases.

Provide:
- {{milestones: "Key milestones with specific deliverables and acceptance criteria"}}
- {{resources: "Resources needed per phase including team size, expertise, and tools"}}
- {{risks: "Technical risks with mitigation strategies and contingency plans"}}
- {{phases: "Timeline phases with duration, objectives, and dependencies"}}

Structure in professional Markdown with clear phases, timeline visualization, and risk assessment table.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

أنشئ خارطة الطريق التقنية لـ {{solution}} مع {{mvpFeatures}} في {{timeline}}. عرّف الإنجازات، الموارد المطلوبة، المخاطر التقنية، ومراحل الجدول الزمني.

قدم:
- {{milestones: "الإنجازات الأساسية مع التسليمات المحددة ومعايير القبول"}}
- {{resources: "الموارد المطلوبة لكل مرحلة بما في ذلك حجم الفريق، الخبرة، والأدوات"}}
- {{risks: "المخاطر التقنية مع استراتيجيات التخفيف والخطط الاحتياطية"}}
- {{phases: "مراحل الجدول الزمني مع المدة، الأهداف، والاعتماديات"}}

هيكلة في Markdown احترافي مع مراحل واضحة، تصور الجدول الزمني، وجدول تقييم المخاطر.
  `
  },
  validate: (context) => ({ valid: true, issues: [] }),
};