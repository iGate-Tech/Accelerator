import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step4 = {
  id: "step4",
  name: {
    en: "Current Solutions",
    ar: "الحلول الحالية"
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


Identify and analyze current solutions for the problem: {{problem}}.
Provide:
- {{alternatives: "List of existing solutions, categorized by type (e.g., software, manual processes, competitors), with specific examples"}}
- {{adoptionRates: "Estimated adoption rates for each solution, including market share percentages and user segments"}}
- {{prosCons: "Detailed pros and cons for each solution, focusing on effectiveness, cost, accessibility, and limitations related to {{problem}}"}}
Structure in professional Markdown with tables for comparisons and bullet points for details.
Ensure analysis highlights gaps that your solution could address.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد وحلل الحلول الحالية للمشكلة: {{problem}}.
قدم:
- {{alternatives: "قائمة بالحلول الحالية، مصنفة حسب النوع (مثلاً، البرمجيات، العمليات اليدوية، المنافسين)، مع أمثلة محددة"}}
- {{adoptionRates: "معدلات التبني المقدرة لكل حل، بما في ذلك.percentages حصة السوق وشرائح المستخدمين"}}
- {{prosCons: "الإيجابيات والسلبيات التفصيلية لكل حل، مع التركيز على الفعالية والتكلفة والسهولة في الوصول والقيود المتعلقة بـ {{problem}}"}}
هيكلة في Markdown احترافي مع جداول للمقارنات ونقاط محددة للتفاصيل.
تأكد من أن يبرز التحليل الفجوات التي يمكن أن يعالجها حلّك.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};