import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step21 = {
  id: "step21",
  name: {
    en: "Data Architecture",
    ar: "هندسة البيانات"
  },
  model: {
    en: "Technical Model",
    ar: "النموذج الفني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "market"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Plan data architecture for {{solution}} targeting {{market}}. Design databases, data flow, analytics pipeline, and storage strategy.

Provide:
- {{databaseDesign: "Database architecture including primary database choice, schema design, and data relationships"}}
- {{dataFlow: "Data flow architecture including ingestion, processing, and distribution pipelines"}}
- {{analytics: "Analytics pipeline for business intelligence and user insights"}}
- {{storageStrategy: "Storage strategy for structured, unstructured, and blob data"}}

Structure in professional Markdown with clear sections, data models, and scalability considerations.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

خطط لبنية البيانات لـ {{solution}} المستهدفة {{market}}. صمم قواعد البيانات، تدفق البيانات، خط أنابيب التحليلات، واستراتيجية التخزين.

قدم:
- {{databaseDesign: "بنية قاعدة البيانات بما في ذلك اختيار قاعدة البيانات الأساسية، تصميم المخطط، والعلاقات البيانات"}}
- {{dataFlow: "بنية تدفق البيانات بما في ذلك خطوط الأنابيب للاستيعاب، المعالجة، والتوزيع"}}
- {{analytics: "خط أنابيب التحليلات لذكاء الأعمال ورؤى المستخدم"}}
- {{storageStrategy: "استراتيجية التخزين للبيانات المهيكلة، غير المهيكلة، وبيانات الكتل"}}

هيكلة في Markdown احترافي مع أقسام واضحة، نماذج البيانات، واعتبارات القابلية للتوسع.
  `
  },
  validate: (context) => ({ valid: true, issues: [] }),
};