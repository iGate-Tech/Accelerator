import { generationPromptTemplateWithProblem } from '../../templates.js';

export const step59 = {
  id: "step59",
  name: {
    en: "Valuation Report Generation",
    ar: "توليد تقرير التقييم"
  },
  model: {
    en: "Valuation Report",
    ar: "تقرير التقييم"
  },
  promptTemplate: generationPromptTemplateWithProblem,
  variables: ["tam", "sam", "som", "traction", "team", "marketSize", "risk", "burnRate", "runway", "breakeven"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Create a comprehensive, professional VALUATION REPORT in markdown format using multiple valuation methodologies. Structure with the following sections:

# VALUATION EXECUTIVE SUMMARY
Provide a 1-page overview containing:
- Company/Investment summary
- Valuation range (using multiple methods)
- Recommended valuation
- Key value drivers
- Risk factors affecting valuation
- Investment recommendation

# COMPANY OVERVIEW
## Business Description
Describe the startup's business model, products/services, and market position.

## Market Position
Current competitive position and market share (if any).

## Management Team
${'{{team}}'}

## Capital Structure
Current capitalization and any outstanding options/warrants.

# MARKET ANALYSIS
## Market Size
- Total Addressable Market (TAM): ${'{{tam}}'}
- Serviceable Available Market (SAM): ${'{{sam}}'}
- Serviceable Obtainable Market (SOM): ${'{{som}}'}

## Market Growth
Market growth rate and trends.

## Market Dynamics
Key market drivers and constraints.

## ${'{{marketSize}}'}
Additional market sizing details.

# TRACTION AND METRICS
## Current Traction
${'{{traction}}'}

## Key Performance Indicators
User metrics, revenue metrics, engagement metrics.

## Growth Trajectory
Historical and projected growth rates.

# FINANCIAL ANALYSIS
## Current Financial Position
Overview of current financials.

## Burn Rate
${'{{burnRate}}'} - Monthly burn rate analysis.

## Runway
${'{{runway}}'} - Months of runway remaining.

## Path to Profitability
${'{{breakeven}}'} - Break-even analysis and timeline.

## Revenue Model
How the company generates revenue.

## Cost Structure
Major cost categories and trends.

# VALUATION METHODOLOGIES

## Method 1: Scorecard Method
### Industry Comparables
Identify 5-7 comparable companies in the industry.

### Comparison Factors
Rate the startup against comparables on:
- Management team strength
- Size of opportunity
- Product/solution differentiation
- Sales and marketing capabilities
- Stage of development
- Risk profile

### Weighted Scoring
Apply weights and calculate adjusted valuation.

### Scorecard Valuation Result
Final valuation range using this method.

## Method 2: Berkus Method
### Pre-money Valuation Factors (Rate 0-1)
- Sound idea (basic value): [0-1]
- Prototype (reducing technology risk): [0-1]
- Quality management team (reducing execution risk): [0-1]
- Strategic relationships (reducing market risk): [0-1]
- Product rollout or sales (reducing production risk): [0-1]

### Maximum Investment Possible
Sum of factors × $500,000 (standard Berkus baseline)

### Berkus Valuation Result
Final valuation using this method.

## Method 3: Risk Factor Summation
### Risk Factors (Score -2 to +2)
- Management risk: [score]
- Stage of business risk: [score]
- Legislation/political risk: [score]
- Manufacturing risk: [score]
- Market acceptance risk: [score]
- Funding/capital risk: [score]
- Competition risk: [score]
- Technology risk: [score]
- Scalability risk: [score]
- Exit risk: [score]

### Base Valuation
Start with $2M (or appropriate base)

### Adjustment Calculation
Sum of all risk scores × $250,000 per point

### Risk Factor Valuation Result
Final valuation using this method.

## Method 4: DCF-Lite (Discounted Cash Flow)
### Revenue Projections
3-5 year revenue forecasts with assumptions.

### Margin Assumptions
Gross margin and EBITDA margin projections.

### Discount Rate
Appropriate discount rate based on risk profile.

### Terminal Value
Exit multiple or perpetuity growth assumption.

### DCF Calculation
Present value of projected cash flows.

### DCF Valuation Result
Final valuation using this method.

## Method 5: Market Multiples
### Comparable Transactions
Identify 5-7 recent M&A or investment transactions.

### Relevant Multiples
- Revenue multiple
- EBITDA multiple
- User/customer multiple
- Growth-adjusted multiple

### Apply Multiples
Apply appropriate multiples to company's metrics.

### Market Multiple Valuation Result
Final valuation using this method.

# RISK ASSESSMENT
## ${'{{risk}}'}
## Business Risks
- Market risks
- Technology risks
- Execution risks
- Financial risks

## Mitigation Strategies
How risks are being addressed.

## Overall Risk Rating
Low/Medium/High with justification.

# VALUATION SUMMARY
## Valuation by Method
| Method | Low | High | Mean |
|--------|-----|------|------|
| Scorecard | | | |
| Berkus | | | |
| Risk Factor | | | |
| DCF-Lite | | | |
| Market Multiple | | | |

## Weighted Average Valuation
Apply weights to each method based on reliability.

## Recommended Valuation Range
Low to high range with justification.

## Final Recommended Pre-Money Valuation
Specific recommendation with rationale.

# INVESTMENT CONSIDERATIONS
## Investment Merits
Why this is a good investment opportunity.

## Concerns and Caution Points
What could go wrong.

## Due Diligence Checklist
Items to verify during due diligence.

## Recommendation
Invest/Consider/Pass with conditions.

# APPENDICES
## Appendix A: Detailed Financial Projections
Full financial model supporting the valuation.

## Appendix B: Comparable Company Analysis
Detailed comparable company data.

## Appendix C: Transaction Comparables
Recent M&A and funding transactions.

## Appendix D: Management Background Checks
Team verification details.

---
Format with professional H1/H2/H3 headings, tables for data comparison, clear calculations, and comprehensive analysis. The valuation report should be thorough (10-15 pages equivalent) and suitable for investment committee review.

Return plain markdown without wrapping the entire response in code fences or triple backticks.

`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

أنشئ تقرير تقييم شامل واحترافي VALUATION REPORT بتنسيق markdown باستخدام عدة منهجيات تقييم. هيكله مع الأقسام التالية:

# ملخص تقييم تنفيذي
قدم نظرة عامة بصفحة واحدة تحتوي على:
- ملخص الشركة/الاستثمار
- نطاق التقييم (باستخدام طرق متعددة)
- التقييم الموصى به
- محركات القيمة الأساسية
- عوامل المخاطرة المؤثرة في التقييم
- توصية الاستثمار

# نظرة عامة على الشركة
## وصف العمل
صِف نموذج عمل الشركة الناشئة، المنتجات/الخدمات، وموقع السوق.

## موقع السوق
الموقع التنافسي الحالي وحصة السوق (إن وجدت).

## فريق الإدارة
${'{{team}}'}

## هيكل رأس المال
رأس المال الحالي وأي خيارات/أوراق مالية معلقة.

# تحليل السوق
## حجم السوق
- السوق الكلي القابل للعنونة (TAM): ${'{{tam}}'}
- السوق المتاح القابل للخدمة (SAM): ${'{{sam}}'}
- السوق القابل للحصول (SOM): ${'{{som}}'}

## نمو السوق
معدل نمو السوق والاتجاهات.

## ديناميكيات السوق
محركات السوق الأساسية والقيود.

## ${'{{marketSize}}'}
تفاصيل حجم السوق الإضافية.

# التقدم والمقاييس
## التقدم الحالي
${'{{traction}}'}

## مؤشرات الأداء الأساسية
مقاييس المستخدم، مقاييس الإيرادات، مقاييس الانخراط.

## مسار النمو
معدلات النمو التاريخية والمُتوقعة.

# التحليل المالي
## الوضع المالي الحالي
نظرة عامة على الوضع المالي الحالي.

## معدل الاحتراق
${'{{burnRate}}'} - تحليل معدل الاحتراق الشهري.

## مدة التشغيل
${'{{runway}}'} - أشهر مدة التشغيل المتبقية.

## مسار الربحية
${'{{breakeven}}'} - تحليل نقطة التعادل والجدول الزمني.

## نموذج الإيرادات
كيف تولد الشركة إيراداتها.

## هيكل التكاليف
فئات التكاليف الرئيسية والاتجاهات.

# منهجيات التقييم

## الطريقة 1: طريقة بطاقة النتائج
### الشركات المماثلة في الصناعة
حدد 5-7 شركات مماثلة في الصناعة.

### عوامل المقارنة
قيّم الشركة الناشئة مقابل الشركات المماثلة على:
- قوة فريق الإدارة
- حجم الفرصة
- تميز المنتج/الحل
- قدرات المبيعات والتسويق
- مرحلة التطور
- ملف المخاطرة

### التقييم الموزون
طبّق الأوزان واحسب التقييم المُعدّل.

### نتيجة تقييم بطاقة النتائج
نطاق التقييم النهائي باستخدام هذه الطريقة.

## الطريقة 2: طريقة بيركوس
### عوامل تقييم قبل المال (قيّم 0-1)
- فكرة مُحكمة (القيمة الأساسية): [0-1]
- نموذج أولي (تقليل مخاطرة التكنولوجيا): [0-1]
- فريق إدارة مُمتاز (تقليل مخاطرة التنفيذ): [0-1]
- علاقات استراتيجية (تقليل مخاطرة السوق): [0-1]
- إطلاق المنتج أو المبيعات (تقليل مخاطرة الإنتاج): [0-1]

### الاستثمار الأقصى الممكن
مجموع العوامل × 500,000$ (أساس بيركوس القياسي)

### نتيجة تقييم بيركوس
التقييم النهائي باستخدام هذه الطريقة.

## الطريقة 3: مجموع عوامل المخاطرة
### عوامل المخاطرة (قيّم -2 إلى +2)
- مخاطرة الإدارة: [النتيجة]
- مخاطرة مرحلة العمل: [النتيجة]
- مخاطرة التشريع/السياسي: [النتيجة]
- مخاطرة التصنيع: [النتيجة]
- مخاطرة قبول السوق: [النتيجة]
- مخاطرة التمويل/رأس المال: [النتيجة]
- مخاطرة المنافسة: [النتيجة]
- مخاطرة التكنولوجيا: [النتيجة]
- مخاطرة القابلية للتوسع: [النتيجة]
- مخاطرة الخروج: [النتيجة]

### تقييم الأساس
ابدأ بـ 2 مليون $ (أو الأساس المناسب)

### حساب التعديل
مجموع جميع نتائج المخاطرة × 250,000$ لكل نقطة

### نتيجة تقييم عوامل المخاطرة
التقييم النهائي باستخدام هذه الطريقة.

## الطريقة 4: DCF-Lite (التدفق النقدي المخصوم)
### توقعات الإيرادات
توقعات إيرادات 3-5 سنوات مع الافتراضات.

### افتراضات الهامش
توقعات هامش الربح الإجمالي وEBITDA.

### معدل الخصم
معدل خصم مناسب بناءً على ملف المخاطرة.

### القيمة الطرفية
معدل الخروج أو افتراض نمو الأبدية.

### حساب DCF
القيمة الحالية للتدفقات النقدية المُتوقعة.

### نتيجة تقييم DCF
التقييم النهائي باستخدام هذه الطريقة.

## الطريقة 5: مضاعفات السوق
### المعاملات المماثلة
حدد 5-7 معاملات M&A أو استثمارية حديثة.

### مضاعفات ملائمة
- مضاعف الإيرادات
- مضاعف EBITDA
- مضاعف المستخدم/العميل
- مضاعف مُعدّل للنمو

### تطبيق المضاعفات
طبّق المضاعفات الملائمة على مقاييس الشركة.

### نتيجة تقييم مضاعفات السوق
التقييم النهائي باستخدام هذه الطريقة.

# تقييم المخاطرة
## ${'{{risk}}'}
## مخاطر العمل
- مخاطر السوق
- مخاطر التكنولوجيا
- مخاطر التنفيذ
- المخاطر المالية

## استراتيجيات التخفيف
كيفية معالجة المخاطر.

## تقييم المخاطرة العام
منخفض/متوسط/مرتفع مع التبرير.

# ملخص التقييم
## التقييم حسب الطريقة
| الطريقة | منخفض | مرتفع | متوسط |
|--------|-----|------|------|
| بطاقة النتائج | | | |
| بيركوس | | | |
| عوامل المخاطرة | | | |
| DCF-Lite | | | |
| مضاعفات السوق | | | |

## التقييم المتوسط الموزون
طبّق الأوزان على كل طريقة بناءً على الموثوقية.

## نطاق التقييم الموصى به
منخفض إلى مرتفع مع التبرير.

## التقييم النهائي الموصى به قبل المال
توصية محددة مع التبرير.

# اعتبارات الاستثمار
## مزايا الاستثمار
لماذا هذه فرصة استثمارية جيدة.

## المخاوف ونقاط التحذير
ما قد يخطئ.

## قائمة التحقق من الواجب
العناصر للتحقق أثناء الواجب.

## التوصية
استثمر/اعتبر/مرر مع الشروط.

# الملاحق
## ملحق أ: توقعات مالية مفصلة
نموذج مالي شامل يدعم التقييم.

## ملحق ب: تحليل الشركات المماثلة
بيانات مفصلة للشركات المماثلة.

## ملحق ج: مقارنات المعاملات
معاملات M&A وتمويل حديثة.

## ملحق د: فحوصات خلفية الإدارة
تفاصيل التحقق من الفريق.

---
التنسيق مع عناوين H1/H2/H3 الاحترافية، الجداول للمقارنة البيانات، الحسابات الواضحة، والتحليل الشامل. يجب أن يكون تقرير التقييم شاملاً (10-15 صفحة معادلة) ومناسبًا لمراجعة لجنة الاستثمار.

أعد markdown العادي دون لف الرد بالكامل في أطر أو علامات triple backticks.
`
  },
  validate: (context) => {
    const issues = [];
    if (!context.valuationReport) issues.push('Missing valuation report');
    return { valid: issues.length === 0, issues };
  },
};
