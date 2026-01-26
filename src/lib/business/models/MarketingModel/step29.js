import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step29 = {
  id: "step29",
  name: {
    en: "Market Trends",
    ar: "اتجاهات السوق"
  },
  model: {
    en: "Marketing Model",
    ar: "نموذج التسويق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["industry", "trends", "tailwinds", "disruption", "futureProjection"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify trends or tailwinds supporting {{industry}} growth. Include rates if known.

Provide:
- {{trends: "Key market trends driving growth with specific statistics and growth rates"}}
- {{tailwinds: "Tailwinds supporting market expansion including technology, regulatory, and social factors"}}
- {{disruption: "Market disruption opportunities and timing for new entrants"}}
- {{futureProjection: "5-year market projection with compound growth rate assumptions"}}

Structure in professional Markdown with trend analysis, growth metrics, and strategic implications.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد الاتجاهات أو العوامل الداعمة لنمو {{industry}}. ضمّن المعدلات إن كانت معروفة.

قدم:
- {{trends: "الاتجاهات السوقية الأساسية التي تدفع النمو مع إحصائيات معدلات النمو المحددة"}}
- {{tailwinds: "العوامل الداعمة لتوسع السوق بما في ذلك التكنولوجيا، التنظيم، والعوامل الاجتماعية"}}
- {{disruption: "فرص اضطراب السوق والتوقيت للمبتدئين الجدد"}}
- {{futureProjection: "توقع السوق لـ 5 سنوات مع افتراضات معدل النمو المركب"}}

هيكلة في Markdown احترافي مع تحليل الاتجاهات، مقاييس النمو، والآثار الاستراتيجية.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.trends) issues.push('Missing market trends analysis');
    return { valid: issues.length === 0, issues };
  },
};