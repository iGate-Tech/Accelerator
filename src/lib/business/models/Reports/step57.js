import { generationPromptTemplateWithProblem } from '../../templates.js';

export const step57 = {
  id: "step57",
  name: "Pitch Deck Generation",
  model: "Pitch Deck Report",
  promptTemplate: generationPromptTemplateWithProblem,
  variables: ["problem", "solution", "tam", "sam", "som", "coreFeatures", "traction", "modelType", "competitors", "year1", "year2", "year3", "team", "ask", "allocation"],
  detailedPitchDeck: `
# PITCH DECK: INVESTOR PRESENTATION

## 🎯 Executive Summary (1 Slide)
Provide a compelling 2-3 sentence overview of your startup that captures:
- The problem you're solving
- Your innovative solution
- The market opportunity
- Key traction metrics

**Key Message:** [Your compelling one-liner]

---

## 🌍 Problem Statement (1-2 Slides)

### The Problem
${'{{problem}}'}

### Market Pain Points
- **Pain Point 1:** [Most acute pain]
- **Pain Point 2:** [Secondary pain]
- **Pain Point 3:** [Tertiary pain]

### Why Now?
- Technological shifts enabling this solution
- Market timing and readiness
- Regulatory or social trend alignment

### Cost of Inaction
- Financial impact on customers
- Time wasted on current solutions
- Competitive disadvantage

---

## 💡 Solution (2-3 Slides)

### Your Solution
${'{{solution}}'}

### Core Value Proposition
- Primary benefit to customers
- Unique mechanism of action
- Key differentiator from alternatives

### Product Demo / How It Works
${'{{coreFeatures}}'}

### Technology Stack (Optional)
- Key technologies used
- Proprietary algorithms or IP
- Scalability considerations

---

## 📊 Market Opportunity (1-2 Slides)

### Market Size
- **TAM:** ${'{{tam}}'} (Total Addressable Market)
- **SAM:** ${'{{sam}}'} (Serviceable Available Market)
- **SOM:** ${'{{som}}'} (Serviceable Obtainable Market)

### Market Growth
- Industry growth rate
- Trends driving growth
- Market maturity stage

### Target Customer Segments
- Primary segment
- Secondary segments
- Geographic focus

---

## 🚀 Traction & Validation (1 Slide)

### Key Milestones
${'{{traction}}'}

### Metrics That Matter
- User acquisition metrics
- Revenue metrics
- Engagement metrics

### Customer Evidence
- Customer testimonials
- Case studies
- Waitlist or sign-up data

---

## 🏢 Business Model (1 Slide)

### Revenue Model
${'{{modelType}}'}

### Unit Economics
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Gross margin
- Payback period

### Pricing Strategy
- Current pricing
- Tier structure
- Expansion revenue potential

---

## 🥊 Competitive Landscape (1 Slide)

### Competitive Analysis
${'{{competitors}}'}

### Competitive Advantages
- Technology advantages
- Team advantages
- Market timing advantages
- Partnership advantages

### Moat / Defensibility
- Network effects
- Data advantages
- Brand and trust
- Switching costs

---

## 📈 Financial Projections (1-2 Slides)

### 3-Year Financial Outlook

**Year 1:** ${'{{year1}}'}
- Revenue targets
- Key assumptions
- Milestones

**Year 2:** ${'{{year2}}'}
- Growth targets
- Scaling considerations
- Path to profitability

**Year 3:** ${'{{year3}}'}
- Market expansion
- Profitability trajectory
- Exit considerations

### Key Financial Metrics
- Burn rate
- Runway
- Path to cash flow positive

---

## 👥 Team (1 Slide)

### Founding Team
${'{{team}}'}

### Key Hires Needed
- Critical roles
- Timeline for hiring

### Advisors & Board
- Key advisors
- Board composition

### Why This Team?
- Relevant experience
- Domain expertise
- Track record

---

## 💰 The Ask (1 Slide)

### Funding Request
${'{{ask}}'}

### Use of Funds
${'{{allocation}}'}

### Runway Created
- Months of runway
- Key milestones to achieve

### Terms (If Applicable)
- Valuation range
- Pre-money / post-money
- Key terms

---

## 🎯 Roadmap & Milestones (Optional)

### Next 12-18 Months
- Product development milestones
- Customer acquisition targets
- Team growth
- Revenue targets

### Future Rounds
- Series A timeline
- Series B considerations
- Exit strategy

---

## 📞 Call to Action

### What You Want from Investors
- Strategic guidance
- Industry connections
- Follow-on investment

### Next Steps
- Due diligence process
- Timeline for closing
- Contact information

---

**Note to Founder:** Customize this template with your specific data, add your company logo, use consistent fonts and colors, include high-quality visuals, and practice your delivery to ensure a polished presentation.
`,
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Create a comprehensive, investor-ready PITCH DECK in professional markdown format that tells a compelling story of your startup. Use the following structure and guidance:

## EXECUTIVE SUMMARY
Write a 2-3 sentence overview covering the problem, solution, market, and traction.

## PROBLEM (1-2 slides)
Describe ${'{{problem}}'} in detail. Explain:
- Why this problem exists
- Who experiences it
- The cost of not solving it
- Why current solutions fail

## SOLUTION (2-3 slides)
Present ${'{{solution}}'} with:
- How your solution works
- Key features: ${'{{coreFeatures}}'}
- What makes it different
- Value created for customers

## MARKET OPPORTUNITY (1-2 slides)
Present market sizing:
- TAM: ${'{{tam}}'}
- SAM: ${'{{sam}}'}
- SOM: ${'{{som}}'}
- Market growth trends
- Why now for this opportunity

## TRACTION (1 slide)
Show validation with ${'{{traction}}'} including:
- Key metrics achieved
- Customer evidence
- Growth trajectory
- Key milestones

## BUSINESS MODEL (1 slide)
Explain ${'{{modelType}}'} covering:
- How you make money
- Unit economics
- Pricing strategy
- Scalability

## COMPETITION (1 slide)
Analyze ${'{{competitors}}'} with:
- Competitive positioning
- Your advantages
- Defensibility strategy

## FINANCIAL PROJECTIONS (1-2 slides)
Show 3-year outlook:
- Year 1: ${'{{year1}}'}
- Year 2: ${'{{year2}}'}
- Year 3: ${'{{year3}}'}
- Key assumptions
- Path to profitability

## TEAM (1 slide)
Introduce ${'{{team}}'} with:
- Founding team backgrounds
- Key hires needed
- Relevant experience
- Advisory board

## THE ASK (1 slide)
Present funding details:
- Request: ${'{{ask}}'}
- Use of funds: ${'{{allocation}}'}
- Runway created
- Key milestones

## ROADMAP
Show next 12-18 months milestones and future funding path.

---
Format with clear H2/H3 headings, professional bullet points, tables where appropriate, and a compelling narrative flow. The deck should be 10-15 slides worth of content condensed into a comprehensive document.

Return plain markdown without wrapping the entire response in code fences or triple backticks.

`,
  validate: (context) => ({ valid: true, issues: [] }),
};
