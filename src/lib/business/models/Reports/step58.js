import { generationPromptTemplateWithProblem } from '../../templates.js';

export const step58 = {
  id: "step58",
  name: "Business Plan Generation",
  model: "Business Plan Report",
  promptTemplate: generationPromptTemplateWithProblem,
  variables: ["solution", "market", "tam", "sam", "som", "trends", "coreFeatures", "modelType", "revenue", "pricing", "competitors", "differentiation", "year1", "year2", "year3", "ask", "team"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Create a comprehensive, professional BUSINESS PLAN in markdown format suitable for investors, partners, and internal use. Structure with the following sections:

# EXECUTIVE SUMMARY
Write a 1-page overview covering:
- Company mission and vision
- Problem being solved: ${'{{solution}}'}
- Business model: ${'{{modelType}}'}
- Market opportunity: ${'{{tam}}'} TAM, ${'{{sam}}'} SAM, ${'{{som}}'} SOM
- Competitive advantage: ${'{{differentiation}}'}
- Traction and key metrics
- Funding request and use of proceeds
- Key milestones and timeline

# COMPANY DESCRIPTION
## Business Concept
Describe your startup and what makes it unique.

## Mission Statement
Company mission and core values.

## Vision
Long-term vision for the company.

## Legal Structure
Current or planned legal entity structure.

# MARKET ANALYSIS
## Industry Overview
${'{{market}}'} market context and industry dynamics.

## Market Size and Growth
- Total Addressable Market (TAM): ${'{{tam}}'}
- Serviceable Available Market (SAM): ${'{{sam}}'}
- Serviceable Obtainable Market (SOM): ${'{{som}}'}

## Market Trends
${'{{trends}}'} - Key trends shaping the market.

## Target Customer Segments
Define your ideal customers and their characteristics.

## Market Entry Strategy
How you will enter and capture market share.

# PRODUCTS AND SERVICES
## Solution Overview
${'{{solution}}'} - Detailed description of your offering.

## Core Product/Service Features
${'{{coreFeatures}}'}

## Technology and Innovation
Proprietary technology, algorithms, or methods.

## Product Roadmap
Future product development plans.

## Competitive Advantages
${'{{differentiation}}'}

# MARKETING AND SALES STRATEGY
## Marketing Strategy
How you will reach and acquire customers.

## Sales Strategy
Sales process and methodology.

## Pricing Strategy
${'{{pricing}}'} - Pricing model and rationale.

## Revenue Model
${'{{revenue}}'} - How the business makes money.

## Customer Acquisition Strategy
Channels and tactics for customer acquisition.

## Customer Retention Strategy
How you will keep customers and increase lifetime value.

# COMPETITIVE ANALYSIS
## Competitive Landscape
${'{{competitors}}'}

## Competitive Positioning
Where you fit in the competitive landscape.

## Competitive Advantages
${'{{differentiation}}'}

## Barriers to Entry
What protects your business from competition.

# OPERATIONS
## Business Model
${'{{modelType}}'}

## Key Partnerships
Strategic partnerships and alliances.

## Supply Chain
If applicable, your supply chain strategy.

## Technology Infrastructure
Systems and technology supporting operations.

## Quality Assurance
How you ensure quality.

# MANAGEMENT AND ORGANIZATION
## Organizational Structure
Current and planned organization structure.

## Management Team
${'{{team}}'}

## Key Personnel
Critical hires and roles needed.

## Board of Advisors
Advisory board composition.

## Human Resources Strategy
Talent acquisition and retention strategy.

# FINANCIAL PLAN
## Financial Projections Summary
Overview of 3-year financial outlook.

## Year 1 Projections
${'{{year1}}'}

## Year 2 Projections
${'{{year2}}'}

## Year 3 Projections
${'{{year3}}'}

## Revenue Projections
Breakdown by revenue stream.

## Expense Projections
Operating expenses breakdown.

## Cash Flow Analysis
Cash flow projections and management.

## Break-even Analysis
When the business will become profitable.

## Key Assumptions
Financial assumptions underlying projections.

# FUNDING REQUEST
## Funding Requirements
${'{{ask}}'}

## Use of Funds
${'{{allocation}}'}

## Financial Projections with Funding
How funding accelerates growth.

## Exit Strategy
Potential exit scenarios (acquisition, IPO, etc.).

# RISK ANALYSIS
## Key Business Risks
Identify major risks facing the business.

## Risk Mitigation Strategies
How you will address each risk.

## Contingency Plans
Backup plans if things don't go as expected.

# IMPLEMENTATION TIMELINE
## Milestones
Key milestones for next 12-24 months.

## Critical Success Factors
What needs to go right for success.

## Metrics for Success
Key performance indicators.

---
Format with professional H1/H2/H3 headings, tables for financial data, bullet points for readability, and comprehensive detail. The business plan should be comprehensive (15-25 pages equivalent) and investor-ready.

Embed the complete business plan as {{businessPlan: "full markdown content here"}}.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};
