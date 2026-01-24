// ============================================================================
// NEW MODELS INDEX - 100% Data Flow Health
// Reordered for clean dependencies
// ============================================================================

import { system } from './System/system.js';
import { step2 } from './IdeaModel/step2.js';
import { step3 } from './IdeaModel/step3.js';
import { step4 } from './IdeaModel/step4.js';
import { step5 } from './IdeaModel/step5.js';
import { step6 } from './IdeaModel/step6.js';
import { step7 } from './IdeaModel/step7.js';
import { step8 } from './IdeaModel/step8.js';
import { step8b } from './IdeaModel/step8b.js';  // NEW: Traction Definition
import { step9 } from './BusinessModel/step9.js';
import { step10 } from './BusinessModel/step10.js';
import { step11 } from './BusinessModel/step11.js';
import { step12 } from './BusinessModel/step12.js';
import { step25 } from './MarketingModel/step25.js';
import { step26 } from './MarketingModel/step26.js';
import { step27 } from './MarketingModel/step27.js';
import { step28 } from './MarketingModel/step28.js';
import { validate_tam_sam_som } from './MarketingModel/validate_tam_sam_som.js';
import { step29 } from './MarketingModel/step29.js';
import { step30 } from './MarketingModel/step30.js';
import { step31 } from './MarketingModel/step31.js';
import { step32 } from './MarketingModel/step32.js';
import { step33 } from './MarketingModel/step33.js';
import { step34 } from './MarketingModel/step34.js';
import { step13 } from './BusinessModel/step13.js';
import { step14 } from './BusinessModel/step14.js';
import { step15 } from './BusinessModel/step15.js';
import { step16 } from './BusinessModel/step16.js';
import { step17 } from './TechnicalModel/step17.js';
import { step18 } from './TechnicalModel/step18.js';
import { step19 } from './TechnicalModel/step19.js';
import { step20 } from './TechnicalModel/step20.js';
import { step21 } from './TechnicalModel/step21.js';
import { step22 } from './TechnicalModel/step22.js';
import { step23 } from './TechnicalModel/step23.js';
import { step24 } from './TechnicalModel/step24.js';
import { step24b } from './TechnicalModel/step24b.js';  // NEW: Timeline Definition
import { step24c } from './TechnicalModel/step24c.js';  // NEW: Integrations Definition
import { step35 } from './FinancialModel/step35.js';
import { step36 } from './FinancialModel/step36.js';
import { step37 } from './FinancialModel/step37.js';
import { step38 } from './FinancialModel/step38.js';
import { step39 } from './FinancialModel/step39.js';
import { step40 } from './FinancialModel/step40.js';
import { step49 } from './TeamModel/step49.js';
import { step50 } from './TeamModel/step50.js';
import { step51 } from './TeamModel/step51.js';
import { step52 } from './LegalModel/step52.js';
import { step53 } from './LegalModel/step53.js';
import { step54 } from './LegalModel/step54.js';
import { step55 } from './LegalModel/step55.js';
import { step56 } from './LegalModel/step56.js';
import { step41 } from './FundingModel/step41.js';
import { step42 } from './FundingModel/step42.js';
import { step43 } from './FundingModel/step43.js';
import { step44 } from './FundingModel/step44.js';
import { validate_deck_ask } from './FundingModel/validate_deck_ask.js';
import { step45 } from './FundingModel/step45.js';
import { step46 } from './FundingModel/step46.js';
import { validate_pre_money } from './FundingModel/validate_pre_money.js';
import { step47 } from './FundingModel/step47.js';
import { step48 } from './FundingModel/step48.js';
import { step57 } from './Reports/step57.js';
import { step58 } from './Reports/step58.js';
import { step59 } from './Reports/step59.js';

// ============================================================================
// STEP ORDER FOR 100% DATA FLOW HEALTH
// ============================================================================
//
// NEW ORDER:
// 1. System (1 step: system)
// 2. Idea Model (8 steps: step2-8, step8b)
// 3. Business Core (4 steps: step9-12) - Solution, Features, Business Model
// 4. Marketing Model (10 steps: step25-34) - Market defined HERE
// 5. Business Details (4 steps: step13-16) - Pricing uses market from step34
// 6. Technical Model (10 steps: step17-24, step24b, step24c)
// 7. Financial Model (6 steps: step35-40)
// 8. Team Model (3 steps: step49-51) - Team defined BEFORE Funding
// 9. Legal Model (5 steps: step52-56)
// 10. Funding Model (8 steps: step41-48) - Uses team from step51
// 11. Reports (3 steps: step57-59)
//
// DEPENDENCY RESOLUTION:
// - Step 14 (Pricing) requires market → Market now comes from Step 34 (Marketing)
// - Step 21 (Data Architecture) requires market → Market now comes from Step 34
// - Step 41 (Funding Readiness) requires team → Team now comes from Step 51 (Team Model)
// - Step 41 (Funding Readiness) requires traction → Traction now comes from step8b
// - Step 22 (API & Integrations) requires integrations → Integrations now from step24c
// - Step 23 (Development Workflow) requires timeline → Timeline now from step24b
//
// ============================================================================

export const steps = [
  // PHASE 1: SYSTEM (1 step)
  system,

  // PHASE 2: IDEA MODEL (8 steps)
  step2,     // Problem Analysis
  step3,     // Severity Assessment
  step4,     // Current Solutions
  step5,     // Solution Gaps
  step6,     // User Persona
  step7,     // Urgency Assessment
  step8,     // Problem Validation
  step8b,    // Traction Definition (NEW - outputs traction for Funding Model)

  // PHASE 3: BUSINESS CORE (4 steps)
  step9,     // Solution Design
  step10,    // Value Proposition
  step11,    // Key Features
  step12,    // Business Model

  // PHASE 4: MARKETING MODEL (10 steps)
  step25,    // Target Market (outputs market variable)
  step26,    // Total Addressable Market
  step27,    // Serviceable Available Market
  step28,    // Serviceable Obtainable Market
  validate_tam_sam_som,  // TAM/SAM/SOM Validation
  step29,    // Market Trends
  step30,    // Competitive Landscape
  step31,    // Market Entry
  step32,    // Customer Acquisition
  step33,    // Sales Strategy
  step34,    // Retention Strategy

  // PHASE 5: BUSINESS DETAILS (4 steps)
  step13,    // Revenue Streams (now has market from Phase 4)
  step14,    // Pricing Strategy (now has market from Phase 4)
  step15,    // Competitive Moats
  step16,    // Risk Analysis

  // PHASE 6: TECHNICAL MODEL (10 steps)
  step17,    // Technical Architecture
  step18,    // MVP Definition
  step19,    // Infrastructure & Hosting
  step20,    // Security Architecture
  step21,    // Data Architecture (now has market from Phase 4)
  step22,    // API & Integrations (now has integrations from step24c)
  step23,    // Development Workflow (now has timeline from step24b)
  step24,    // Technical Roadmap
  step24b,   // Timeline Definition (NEW - outputs timeline for step23)
  step24c,   // Integrations Definition (NEW - outputs integrations for step22)

  // PHASE 7: FINANCIAL MODEL (6 steps)
  step35,    // Revenue Streams
  step36,    // Unit Economics
  step37,    // Cost Structure
  step38,    // Financial Projections
  step39,    // Burn Rate Analysis
  step40,    // Break-even Analysis

  // PHASE 8: TEAM MODEL (3 steps) - BEFORE FUNDING
  step49,    // Founding Team (outputs team for Funding Model)
  step50,    // Team Gaps
  step51,    // Hiring Plan

  // PHASE 9: LEGAL MODEL (5 steps)
  step52,    // Governance Structure
  step53,    // Legal Structure
  step54,    // IP Protection
  step55,    // Compliance Requirements
  step56,    // Risk Assessment

  // PHASE 10: FUNDING MODEL (8 steps) - AFTER TEAM
  step41,    // Funding Readiness (now has team from Phase 8, traction from Phase 2)
  step42,    // Valuation Analysis
  step43,    // Funding Stage
  step44,    // Funding Amount
  validate_deck_ask,  // Deck/Ask Validation
  step45,    // Use of Funds
  step46,    // Pre-money Valuation
  validate_pre_money, // Pre-money Validation
  step47,    // Target Investors
  step48,    // Funding Milestones

  // PHASE 11: REPORTS (3 steps)
  step57,    // Pitch Deck Generation
  step58,    // Business Plan Generation
  step59,    // Valuation Report Generation
];
// Total: 65 steps (59 original + 3 new steps + 3 validation steps)
