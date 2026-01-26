import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step24b = {
  id: "step24b",
  name: {
    en: "Timeline Definition",
    ar: "تعريف الجدول الزمني"
  },
  model: {
    en: "Technical Model",
    ar: "النموذج الفني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "mvpFeatures", "milestones"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Define the project timeline for {{solution}} based on the MVP features {{mvpFeatures}} and milestones {{milestones}}.

Provide:
- {{timeline: "Comprehensive project timeline with phases, milestones, and deadlines"}}
- {{projectPlan: "Detailed project plan with tasks, dependencies, and resources"}}
- {{developmentPhases: "Breakdown of development phases with durations and deliverables"}}

Structure in professional Markdown with Gantt-style timeline, phase descriptions, and key milestones.

Also embed {{timeline: "Full timeline for use in subsequent steps"}}.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

عرّف الجدول الزمني للمشروع لـ {{solution}} بناءً على ميزات MVP {{mvpFeatures}} والإنجازات {{milestones}}.

قدم:
- {{timeline: "الجدول الزمني الشامل للمشروع مع المراحل، الإنجازات، والمواعيد النهائية"}}
- {{projectPlan: "خطة المشروع التفصيلية مع المهام، الاعتماديات، والموارد"}}
- {{developmentPhases: "تقسيم مراحل التطوير مع المدد والتسليمات"}}

هيكلة في Markdown احترافي مع جدول زمني على نمط Gantt، أوصاف المراحل، والإنجازات الأساسية.

ضمّن أيضًا {{timeline: "الجدول الزمني الكامل للاستخدام في الخطوات اللاحقة"}}.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.timeline) issues.push('Missing timeline');
    if (!context.projectPlan) issues.push('Missing project plan');
    return { valid: issues.length === 0, issues };
  },
};
