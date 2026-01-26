import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step5 = {
  id: "step5",
  name: {
    en: "Solution Gaps",
    ar: "فجوات الحل"
  },
  model: {
    en: "Idea Model",
    ar: "نموذج الفكرة"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["alternatives"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Analyze why current solutions {{alternatives}} fail to adequately address {{problem}}.
Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Identify key gaps in solving {{problem}}:
- {{gaps: "Specific gaps preventing {{alternatives}} from solving {{problem}} - cost, speed, usability, scalability, features"}}
- {{quantifiedImpact: "Quantified impact of these gaps on {{problem}} - cost savings, time reductions, efficiency"}}
- {{userFeedback: "User complaints/reviews about {{alternatives}} failing to solve {{problem}}"}}
Format in professional Markdown with clear sections and metrics tied to {{problem}}.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

حلل لماذا تفشل الحلول الحالية {{alternatives}} في معالجة {{problem}} بشكل كافٍ.
يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد الفجوات الأساسية في حل {{problem}}:
- {{gaps: "الفجوات المحددة التي تمنع {{alternatives}} من حل {{problem}} - التكلفة، السرعة، سهولة الاستخدام، قابلية التوسع، الميزات"}}
- {{quantifiedImpact: "الأثر الكمي لهذه الفجوات على {{problem}} - توفير التكاليف، تقليل الوقت، الكفاءة"}}
- {{userFeedback: "شكاوى/مراجعات المستخدمين حول فشل {{alternatives}} في حل {{problem}}"}}
نسق في Markdown احترافي مع أقسام واضحة ومétriques مرتبطة بـ {{problem}}.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};
