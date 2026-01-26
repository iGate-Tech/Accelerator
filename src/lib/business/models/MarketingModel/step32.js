import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step32 = {
  id: "step32",
  name: {
    en: "Customer Acquisition",
    ar: "اقتناء العملاء"
  },
  model: {
    en: "Marketing Model",
    ar: "نموذج التسويق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["industry", "solution", "customerChannels", "channelPriority"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify channels to acquire customers in {{industry}} for {{solution}}. Rank by priority.

Provide:
- {{customerChannels: "Comprehensive list of customer acquisition channels with descriptions"}}
- {{channelPriority: "Ranked channels with justification for priority order"}}

Structure in professional Markdown with channel analysis table, cost estimates, and prioritization rationale.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد القنوات لاقتناء العملاء في {{industry}} لـ {{solution}}. رتّب حسب الأولوية.

قدم:
- {{customerChannels: "قائمة شاملة لقنوات اقتناء العملاء مع الأوصاف"}}
- {{channelPriority: "القنوات المرتبة مع التبرير لترتيب الأولوية"}}

هيكلة في Markdown احترافي مع جدول تحليل القناة، تقديرات التكلفة، وسبب الترتيب الأولوية.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.customerChannels) issues.push('Missing customer acquisition channels');
    return { valid: issues.length === 0, issues };
  },
};
