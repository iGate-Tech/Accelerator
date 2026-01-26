import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step6 = {
  id: "step6",
  name: {
    en: "User Persona",
    ar: "شخصية المستخدم"
  },
  model: {
    en: "Idea Model",
    ar: "نموذج الفكرة"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["problem"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Develop a detailed user persona for someone directly suffering from the problem: {{problem}}.
Include:
- {{persona: "Comprehensive persona description covering demographics (age, gender, location), professional details (job title, industry, income), psychographics (pain points, motivations), and background"}}
- {{workflow: "Detailed description of the user's daily workflow, including pain points related to {{problem}} and current coping mechanisms"}}
- {{decisionProcess: "Step-by-step decision-making process for addressing {{problem}}, including triggers, research methods, and barriers to adoption"}}
Present in professional Markdown with a persona profile format, bullet points, and practical insights for product development.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

طور شخصية مستخدم مفصلة لشخص يعاني مباشرة من المشكلة: {{problem}}.
ضمّن:
- {{persona: "وصف شامل للشخصية يغطي الخصائص الديموغرافية (العمر، الجنس، الموقع)، التفاصيل المهنية (المسمى الوظيفي، الصناعة، الدخل)، المعلومات النفسية (نقاط الألم، الدوافع)، والخلفية"}}
- {{workflow: "وصف مفصل لسير عمل المستخدم اليومي، بما في ذلك نقاط الألم المتعلقة بـ {{problem}} وآليات التعامل الحالية"}}
- {{decisionProcess: "عملية اتخاذ القرار خطوة بخطوة لمعالجة {{problem}}، بما في ذلك المحفزات، طرق البحث، وحواجز التبني"}}
قدّم في Markdown احترافي بتنسيق ملف تعريف الشخصية، نقاط محددة، ورؤى عملية لتطوير المنتج.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};