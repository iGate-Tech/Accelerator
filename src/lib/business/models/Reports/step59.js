import { generationPromptTemplateWithProblem } from '../../templates.js';

export const step59 = {
  id: "step59",
  name: "Valuation Report Generation",
  model: "Valuation Report",
  promptTemplate: generationPromptTemplateWithProblem,
  variables: ["tam", "sam", "som", "traction", "team", "marketSize", "risk", "burnRate", "runway", "breakeven"],
  detailedPrompt: `
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

`,
  validate: (context) => {
    const issues = [];
    if (!context.valuationReport) issues.push('Missing valuation report');
    return { valid: issues.length === 0, issues };
  },
};
