import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step25 = {
  id: "step25",
  name: {
    en: "Target Market",
    ar: "السوق المستهدف"
  },
  model: {
    en: "Marketing Model",
    ar: "نموذج التسويق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "industry", "customerType", "marketSize", "idealCustomer"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Clearly define the target market for {{solution}} by industry, size, and customer type.

Provide:
- {{industry: "Target industry or industries with market size and growth characteristics"}}
- {{customerType: "Customer segments including company size, geography, and buyer personas"}}
- {{marketSize: "Initial target market size with justification and potential for expansion"}}
- {{idealCustomer: "Detailed profile of the ideal first customer for {{solution}}"}}

Structure in professional Markdown with clear segments, market maps, and customer profiles.

Also embed {{market: "Combined market description combining industry and target segments for use in subsequent steps"}}.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

عرّف بوضوح سوق الهدف لـ {{solution}} حسب الصناعة، الحجم، ونوع العميل.

قدم:
- {{industry: "الصناعة أو الصناعات المستهدفة مع خصائص حجم السوق ونموه"}}
- {{customerType: "شرائح العملاء بما في ذلك حجم الشركة، الجغرافيا، و الشخصيات المشتري"}}
- {{marketSize: "حجم السوق المستهدف الأولي مع التبرير وإمكانية التوسع"}}
- {{idealCustomer: "ملف تفصيلي للعميل المثالي الأول لـ {{solution}}"}}

هيكلة في Markdown احترافي مع شرائح واضحة، خرائط السوق، وملفات العملاء.

ضمّن أيضًا {{market: "وصف السوق المدمج يجمع بين الصناعة وشرائح الهدف للاستخدام في الخطوات اللاحقة"}}.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.industry) issues.push('Missing target industry');
    if (!context.customerType) issues.push('Missing customer segments');
    if (!context.marketSize) issues.push('Missing market size estimate');
    return { valid: issues.length === 0, issues };
  },
};