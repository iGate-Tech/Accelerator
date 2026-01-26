import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step30 = {
  id: "step30",
  name: {
    en: "Competitive Landscape",
    ar: "المنظر التنافسي"
  },
  model: {
    en: "Marketing Model",
    ar: "نموذج التسويق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["industry", "solution", "competitors", "competitorsList"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


List direct and indirect competitors in {{industry}}. Explain how {{solution}} differs.

Provide:
- {{competitors: "Comprehensive analysis of the competitive landscape"}}
- {{competitorsList: "List of 5-10 direct and indirect competitors with brief descriptions"}}

Structure in professional Markdown with competitor table, positioning map, and differentiation analysis.

Embed {{competitors: "Full competitive analysis for use in reports"}}.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

سرد المنافسين المباشرة وغير المباشرة في {{industry}}. اشرح كيف يختلف {{solution}}.

قدم:
- {{competitors: "تحليل شامل لمشهد المنافسة"}}
- {{competitorsList: "قائمة من 5-10 منافسين مباشرين وغير مباشرين مع أوصاف موجزة"}}

هيكلة في Markdown احترافي مع جدول المنافسين، خريطة الموضع، وتحليل التمايز.

ضمّن {{competitors: "التحليل التنافسي الكامل للاستخدام في التقارير"}}.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.competitors && !context.competitorsList) issues.push('Missing competitive analysis');
    return { valid: issues.length === 0, issues };
  },
};
