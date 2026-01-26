import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step17 = {
  id: "step17",
  name: {
    en: "Technical Architecture",
    ar: "الهندسة التقنية"
  },
  model: {
    en: "Technical Model",
    ar: "النموذج الفني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "modelType"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Design the technical architecture for the solution {{solution}} in the business model {{modelType}}.
Recommend:
- {{techStack: "Technology stack, including frontend, backend, database, and cloud services"}}
- {{architecture: "High-level architecture diagram description, including components and data flow"}}
- {{patterns: "Design patterns used, such as microservices, serverless, or MVC"}}
- {{scalability: "Scalability approach, including horizontal/vertical scaling and performance considerations"}}
Provide justifications and present in professional Markdown with diagrams descriptions and technical details.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

صمم البنية التقنية للحل {{solution}} في نموذج العمل {{modelType}}.
أوصي بـ:
- {{techStack: "تكد التكنولوجيا، بما في ذلك الواجهة الأمامية، الواجهة الخلفية، قاعدة البيانات، وخدمات السحابة"}}
- {{architecture: "وصف مخطط البنية العامة، بما في ذلك المكونات وتدفق البيانات"}}
- {{patterns: "أنماط التصميم المستخدمة، مثل الخدمات الدقيقة، الخدمة بدون خادم، أو MVC"}}
- {{scalability: "نهج القابلية للتوسع، بما في ذلك التوسع الأفقي/الرأسي واعتبارات الأداء"}}
قدم التبريرات وقدم في Markdown احترافي مع أوصاف المخططات والتفاصيل التقنية.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};