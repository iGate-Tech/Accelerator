import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step8 = {
  id: "step8",
  name: {
    en: "Problem Validation",
    ar: "التحقق من صحة المشكلة"
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


Gather and validate comprehensive evidence for the problem: {{problem}}.
Provide:
- {{evidence: "Quantitative data (e.g., statistics, surveys) and qualitative insights (e.g., testimonials) proving the problem's existence"}}
- {{sources: "Reliable sources for the evidence, such as research reports, industry studies, government data, or expert opinions"}}
- {{supportAnalysis: "Analysis of how this evidence supports the problem's market relevance, scale, and potential for solution"}}
Structure in professional Markdown with citations, tables for data, and clear links to {{problem}}.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

اجمع وحقق من الأدلة الشاملة للمشكلة: {{problem}}.
قدم:
- {{evidence: "البيانات الكمية (مثلاً، الإحصائيات، الاستبيانات) والرؤى النوعية (مثلاً، الشهادات) التي تثبت وجود المشكلة"}}
- {{sources: "مصادر موثوقة للأدلة، مثل تقارير الأبحاث، دراسات الصناعة، بيانات الحكومة، أو آراء الخبراء"}}
- {{supportAnalysis: "تحليل لكيفية دعم هذه الأدلة لصلة المشكلة بالسوق، الحجم، وإمكانية الحل"}}
هيكلة في Markdown احترافي مع مراجع، جداول للبيانات، وروابط واضحة لـ {{problem}}.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};