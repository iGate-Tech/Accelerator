// Variable Mapping Utility
// Provides comprehensive fallback mappings for missing or inconsistently named variables
// Ensures fail-safe data flow through all 59 accelerator steps

// ============================================================================
// VARIABLE ALIASES
// ============================================================================

export const variableAliases = {
  // market: industry is defined in step25, but other steps expect 'market'
  market: ['industry', 'marketSize', 'targetMarket', 'targetMarketSize'],

  // competitors: various names used
  competitors: ['competitiveAnalysis', 'competition', 'competitorsList', 'competitorList'],

  // traction: never directly defined, generate from other metrics
  traction: ['milestones', 'metrics', 'validation', 'keyMetrics', 'tractionMetrics'],

  // team: step49 defines team members
  team: ['teamMembers', 'foundingTeam', 'teamInfo', 'teamComposition', 'foundingTeamMembers'],

  // ask: step44 outputs askAmount
  ask: ['askAmount', 'fundingAsk', 'amount', 'fundingAmount', 'raiseAmount'],

  // allocation: step45 outputs useOfFunds
  allocation: ['useOfFunds', 'fundingAllocation', 'fundsAllocation', 'allocationPlan', 'fundsUse'],

  // pricing: step14 outputs pricing tiers
  pricing: ['pricingTiers', 'pricingStrategy', 'price', 'pricingModel', 'pricingStructure'],

  // revenue: step13 outputs revenue streams
  revenue: ['revenueStreams', 'revenueModel', 'revenueSources', 'revenueStrategy', 'monetization'],

  // differentiation: step9 outputs differentiation
  differentiation: ['uniqueBenefits', 'differentiation', 'uniqueValue', 'competitiveEdge', 'valueProposition'],

  // risk: step16 outputs risks
  risk: ['risks', 'riskAnalysis', 'businessRisks', 'riskLevel', 'riskFactors', 'mitigation'],

  // year1, year2, year3: step38 has revenue projections
  year1: ['year1Projections', 'revenueYear1', 'firstYear', 'yearOne', 'revenueYearOne'],
  year2: ['year2Projections', 'revenueYear2', 'secondYear', 'yearTwo', 'revenueYearTwo'],
  year3: ['year3Projections', 'revenueYear3', 'thirdYear', 'yearThree', 'revenueYearThree'],

  // trends: step29 outputs trends
  trends: ['marketTrends', 'growthTrends', 'industryTrends', 'trendAnalysis', 'marketDynamics'],

  // marketSize: step25 outputs marketSize
  marketSize: ['market', 'targetMarket', 'sam', 'marketSizeEstimate', 'tamEstimate'],

  // MISSING VARIABLES - Added to fix critical gaps
  integrations: ['integrationList', 'integrationsList', 'thirdPartyIntegrations', 'apiIntegrations', 'partnerIntegrations'],

  timeline: ['projectTimeline', 'developmentTimeline', 'roadmap', 'timelinePlan', 'developmentPlan', 'projectPlan'],

  stage: ['fundingStage', 'stage', 'fundingRound', 'investmentStage', 'seedStage', 'seriesStage'],

  breakeven: ['breakevenPoint', 'breakevenTimeline', 'breakEven', 'breakevenDate', 'breakEvenPoint'],

  // Additional common aliases for flexibility
  coreFeatures: ['features', 'keyFeatures', 'productFeatures', 'coreProductFeatures'],
  mvpFeatures: ['mvp', 'minimumViableProduct', 'mvpScope', 'initialFeatures'],
  persona: ['personas', 'userPersona', 'customerPersona', 'targetPersona', 'buyerPersona'],
  solution: ['product', 'service', 'offering', 'solutionDescription', 'productDescription'],
  problem: ['problemStatement', 'challenge', 'painPoint', 'issue', 'opportunity'],
  modelType: ['businessModel', 'model', 'revenueModel', 'businessModelType', 'monetizationModel'],
  alternatives: ['currentSolutions', 'existingSolutions', 'competitors', 'competingSolutions'],
  gaps: ['marketGaps', 'solutionGaps', 'opportunityGaps', 'unmetNeeds'],
  sam: ['serviceableMarket', 'serviceableAvailableMarket', 'segmentSize'],
  som: ['obtainableMarket', 'serviceableObtainableMarket', 'targetSegment'],
  tam: ['totalMarket', 'totalAddressableMarket', 'marketSize', 'marketOpportunity'],
  validation: ['traction', 'evidence', 'proof', 'customerValidation', 'marketValidation'],
  milestones: ['keyMilestones', 'projectMilestones', 'achievements', 'progress'],
  fixedCosts: ['fixedExpenses', 'overhead', 'monthlyFixedCosts', 'fixedOperatingCosts'],
  variableCosts: ['variableExpenses', 'perUnitCosts', 'variableOperatingCosts'],
  monthlyBurn: ['burnRate', 'monthlyBurnRate', 'cashBurn', 'burn'],
  runway: ['runwayMonths', 'cashRunway', 'monthsOfRunway'],
  revenueStreams: ['revenue', 'incomeStreams', 'monetizationStreams', 'revenueSources'],
  cac: ['customerAcquisitionCost', 'acquisitionCost', 'costToAcquire'],
  ltv: ['lifetimeValue', 'customerLifetimeValue', 'customerLTV'],
  grossMargin: ['margin', 'grossProfitMargin', 'profitMargin'],
  advisors: ['advisorsList', 'boardAdvisors', 'advisoryBoard', 'mentors'],
  legalEntity: ['entityType', 'companyStructure', 'legalStructure', 'entityStructure'],
  ipOwnership: ['ip', 'intellectualProperty', 'patents', 'trademarks', 'ipAssets'],
  compliance: ['complianceRequirements', 'regulatoryCompliance', 'legalCompliance', 'requirements'],
  retentionStrategy: ['retention', 'customerRetention', 'churnPrevention', 'retentionPlan'],
};

// ============================================================================
// CORE MAPPING FUNCTIONS
// ============================================================================

export const getMappedValue = (context, primaryKey) => {
  if (context && typeof context === 'object') {
    if (context[primaryKey] !== undefined && context[primaryKey] !== '' && context[primaryKey] !== null) {
      return context[primaryKey];
    }

    const aliases = variableAliases[primaryKey];
    if (aliases && Array.isArray(aliases)) {
      for (const alias of aliases) {
        if (context[alias] !== undefined && context[alias] !== '' && context[alias] !== null) {
          return context[alias];
        }
      }
    }
  }
  return null;
};

export const getAllMappedValues = (context, primaryKey) => {
  const values = [];
  if (context && typeof context === 'object') {
    if (context[primaryKey]) values.push(context[primaryKey]);
    const aliases = variableAliases[primaryKey] || [];
    for (const alias of aliases) {
      if (context[alias]) values.push(context[alias]);
    }
  }
  return values;
};

export const normalizeContext = (context) => {
  if (!context || typeof context !== 'object') return {};

  const normalized = { ...context };

  for (const [primaryKey, aliases] of Object.entries(variableAliases)) {
    if (normalized[primaryKey] === undefined || normalized[primaryKey] === '' || normalized[primaryKey] === null) {
      for (const alias of aliases) {
        if (normalized[alias] !== undefined && normalized[alias] !== '' && normalized[alias] !== null) {
          normalized[primaryKey] = normalized[alias];
          break;
        }
      }
    }
  }

  return normalized;
};

// ============================================================================
// GENERATOR FUNCTIONS FOR MISSING VARIABLES
// ============================================================================

export const generateTractionFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Initial validation phase - concept and early customer interviews completed';
  }

  const traction = context.traction || context.milestones || context.validation || context.keyMetrics || '';
  if (traction) return traction;

  const parts = [];

  if (context.userMetrics || context.engagementMetrics || context.metrics) {
    parts.push(`Key metrics: ${context.userMetrics || context.engagementMetrics || context.metrics}`);
  }

  if (context.revenue && context.revenue > 0) {
    parts.push(`Revenue: $${typeof context.revenue === 'number' ? context.revenue.toLocaleString() : context.revenue}`);
  }

  if (context.growthRate || context.growth || context.revenueGrowth) {
    parts.push(`Growth: ${context.growthRate || context.growth || context.revenueGrowth}`);
  }

  if (context.customerCount || context.users || context.customerMetrics) {
    parts.push(`Customers: ${context.customerCount || context.users || context.customerMetrics}`);
  }

  if (context.signups || context.waitlist) {
    parts.push(`Waitlist/Signups: ${context.signups || context.waitlist}`);
  }

  if (context.partnerships || context.strategicPartners) {
    parts.push(`Partnerships: ${context.partnerships || context.strategicPartners}`);
  }

  return parts.length > 0
    ? parts.join(' | ')
    : 'Initial validation phase - concept validated through customer interviews and problem-solution fit analysis';
};

export const generateYearlyProjections = (context) => {
  if (!context || typeof context !== 'object') {
    return {
      year1: 'Year 1: Revenue targets to be determined based on market validation',
      year2: 'Year 2: Growth projections contingent on Year 1 performance',
      year3: 'Year 3: Market expansion and profitability trajectory',
    };
  }

  const financialProjections = context.financialProjections || context.revenue || '';
  const year1Proj = context.year1Projections || context.revenueYear1 || context.yearOne || '';
  const year2Proj = context.year2Projections || context.revenueYear2 || context.yearTwo || '';
  const year3Proj = context.year3Projections || context.revenueYear3 || context.yearThree || '';

  const projections = {
    year1: year1Proj || financialProjections || 'Year 1: Target $100K-$500K ARR with MVP launch and initial customer acquisition',
    year2: year2Proj || 'Year 2: Target $500K-$2M ARR representing 3-5x growth with product-market fit validation',
    year3: year3Proj || 'Year 3: Target $2M-$10M ARR with scaled operations and path to profitability',
  };

  return projections;
};

export const generateCompetitorsFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Competitive landscape analysis pending - direct competitors to be identified through market research';
  }

  if (context.competitors) return context.competitors;
  if (context.competitiveAnalysis) return context.competitiveAnalysis;
  if (context.competition) return context.competition;
  if (context.competitorsList) return context.competitorsList;

  return 'Competitive landscape analysis pending - direct competitors to be identified through market research';
};

export const generateTeamFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Founding team composition pending - key technical and business hires identified';
  }

  if (context.team) return context.team;
  if (context.teamMembers) return context.teamMembers;
  if (context.foundingTeam) return context.foundingTeam;
  if (context.teamInfo) return context.teamInfo;
  if (context.teamComposition) return context.teamComposition;

  return 'Founding team composition pending - key technical and business hires identified';
};

export const generateAskFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Funding amount to be determined based on runway requirements and milestone planning';
  }

  if (context.ask) return context.ask;
  if (context.askAmount) return context.askAmount;
  if (context.fundingAsk) return context.fundingAsk;
  if (context.amount) return context.amount;
  if (context.fundingAmount) return context.fundingAmount;
  if (context.raiseAmount) return context.raiseAmount;

  return 'Funding amount to be determined based on runway requirements (typically 18-24 months)';
};

export const generateAllocationFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Use of funds allocation pending - budget breakdown: 40% product, 30% sales/marketing, 20% operations, 10% reserves';
  }

  if (context.allocation) return context.allocation;
  if (context.useOfFunds) return context.useOfFunds;
  if (context.fundingAllocation) return context.fundingAllocation;
  if (context.fundsAllocation) return context.fundsAllocation;
  if (context.allocationPlan) return context.allocationPlan;

  return 'Use of funds allocation: 40% product development, 30% customer acquisition, 20% operations, 10% reserves';
};

// ============================================================================
// NEW GENERATORS FOR MISSING VARIABLES (CRITICAL FIX)
// ============================================================================

export const generateIntegrationsFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Integration strategy pending - core platform first, third-party integrations in phase 2';
  }

  if (context.integrations) return context.integrations;
  if (context.integrationList) return context.integrationList;
  if (context.integrationsList) return context.integrationsList;
  if (context.thirdPartyIntegrations) return context.thirdPartyIntegrations;
  if (context.apiIntegrations) return context.apiIntegrations;

  return 'Integration Strategy: Core APIs built first (authentication, data, payments). Partner integrations (CRM, analytics, communication tools) planned for Phase 2 post-MVP. No critical dependencies identified.';
};

export const generateTimelineFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Timeline: MVP 3-4 months, Beta 2 months, Launch Month 6, Scale Months 7-12';
  }

  if (context.timeline) return context.timeline;
  if (context.projectTimeline) return context.projectTimeline;
  if (context.developmentTimeline) return context.developmentTimeline;
  if (context.roadmap) return context.roadmap;
  if (context.timelinePlan) return context.timelinePlan;
  if (context.developmentPlan) return context.developmentPlan;

  const milestones = context.milestones || '';
  if (milestones) return `Timeline based on milestones: ${milestones}`;

  return 'Development Timeline: MVP (3-4 months), Beta Testing (2 months), Launch (Month 6), Growth Phase (Months 7-18)';
};

export const generateStageFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Recommended Stage: Pre-seed to Seed (depending on traction and team)';
  }

  if (context.stage) return context.stage;
  if (context.fundingStage) return context.fundingStage;
  if (context.fundingRound) return context.fundingRound;
  if (context.investmentStage) return context.investmentStage;

  // Infer from other context
  const traction = context.traction || context.milestones || '';
  const team = context.team || context.teamMembers || '';

  if (traction && team) {
    return 'Recommended Stage: Seed - Strong traction and experienced team warrant seed funding';
  } else if (team) {
    return 'Recommended Stage: Pre-seed - Experienced team, early traction suggests pre-seed';
  }

  return 'Recommended Stage: Pre-seed (concept/early customer validation stage)';
};

export const generateBreakevenFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return { breakevenPoint: 'Break-even point TBD based on unit economics', breakevenTimeline: 'Month 24-36 expected' };
  }

  if (context.breakeven) return context.breakeven;
  if (context.breakevenPoint) return context.breakevenPoint;
  if (context.breakevenTimeline) return context.breakevenTimeline;
  if (context.breakEven) return context.breakEven;
  if (context.breakevenDate) return context.breakevenDate;

  // Calculate from context if possible
  const revenue = context.revenue || context.monthlyRevenue || 0;
  const fixedCosts = context.fixedCosts || context.monthlyFixedCosts || 0;
  const variableCosts = context.variableCosts || context.perUnitCost || 0;

  if (revenue > 0 && fixedCosts > 0) {
    const contributionMargin = revenue - variableCosts;
    if (contributionMargin > 0) {
      const breakevenUnits = Math.ceil(fixedCosts / contributionMargin);
      return {
        breakevenPoint: `Break-even at ${breakevenUnits} units/month`,
        breakevenTimeline: 'Month 24-36 based on growth trajectory'
      };
    }
  }

  return {
    breakevenPoint: 'Break-even point TBD - requires validated unit economics',
    breakevenTimeline: 'Month 24-36 contingent on achieving revenue targets'
  };
};

// ============================================================================
// ADDITIONAL GENERATORS FOR COMPLETENESS
// ============================================================================

export const generatePricingFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Pricing strategy pending - value-based pricing to be determined';
  }

  if (context.pricing) return context.pricing;
  if (context.pricingTiers) return context.pricingTiers;
  if (context.pricingStrategy) return context.pricingStrategy;
  if (context.price) return context.price;

  return 'Pricing: Freemium to $99/month tier based on features and usage';
};

export const generateRevenueFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Revenue model pending - subscription and usage-based revenue planned';
  }

  if (context.revenue) return context.revenue;
  if (context.revenueStreams) return context.revenueStreams;
  if (context.revenueModel) return context.revenueModel;
  if (context.monetization) return context.monetization;

  return 'Revenue: Subscription SaaS (80%) + Usage-based fees (20%)';
};

export const generateRiskFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Risk assessment pending - standard business risks identified';
  }

  if (context.risk) return context.risk;
  if (context.riskLevel) return context.riskLevel;
  if (context.risks) return context.risks;
  if (context.riskAnalysis) return context.riskAnalysis;

  const risks = context.businessRisks || [];
  if (Array.isArray(risks) && risks.length > 0) {
    return risks.join(', ');
  }

  return 'Key Risks: Market timing, competition, execution, funding. Mitigation: Agile approach, customer-first development.';
};

export const generateMarketFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Target market TBD - requires market research';
  }

  if (context.market) return context.market;
  if (context.industry) return context.industry;
  if (context.targetMarket) return context.targetMarket;
  if (context.marketSize) return context.marketSize;

  return 'Target Market: B2B SaaS, mid-market companies in regulated industries';
};

export const generateDifferentiationFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Differentiation pending - unique value proposition to be refined';
  }

  if (context.differentiation) return context.differentiation;
  if (context.uniqueBenefits) return context.uniqueBenefits;
  if (context.uniqueValue) return context.uniqueValue;
  if (context.competitiveEdge) return context.competitiveEdge;

  return 'Differentiation: Proprietary technology, unique approach, strong domain expertise';
};

export const generateTrendsFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Market trends pending - industry analysis to be completed';
  }

  if (context.trends) return context.trends;
  if (context.marketTrends) return context.marketTrends;
  if (context.growthTrends) return context.growthTrends;

  return 'Key Trends: Digital transformation, AI adoption, regulatory changes driving demand';
};

// ============================================================================
// COMPREHENSIVE CONTEXT ENRICHMENT
// ============================================================================

export const enrichContext = (context) => {
  if (!context || typeof context !== 'object') {
    return {};
  }

  const enriched = normalizeContext(context);

  // Generate all missing variables with fallbacks
  const generators = {
    traction: generateTractionFromContext,
    competitors: generateCompetitorsFromContext,
    team: generateTeamFromContext,
    ask: generateAskFromContext,
    allocation: generateAllocationFromContext,
    year1: (ctx) => generateYearlyProjections(ctx).year1,
    year2: (ctx) => generateYearlyProjections(ctx).year2,
    year3: (ctx) => generateYearlyProjections(ctx).year3,
    integrations: generateIntegrationsFromContext,
    timeline: generateTimelineFromContext,
    stage: generateStageFromContext,
    breakevenPoint: (ctx) => generateBreakevenFromContext(ctx).breakevenPoint,
    breakevenTimeline: (ctx) => generateBreakevenFromContext(ctx).breakevenTimeline,
    pricing: generatePricingFromContext,
    revenue: generateRevenueFromContext,
    risk: generateRiskFromContext,
    market: generateMarketFromContext,
    differentiation: generateDifferentiationFromContext,
    trends: generateTrendsFromContext,
  };

  for (const [key, generator] of Object.entries(generators)) {
    if (!enriched[key]) {
      enriched[key] = generator(context);
    }
  }

  // Ensure core variables have fallbacks
  if (!enriched.problem) {
    enriched.problem = 'Problem statement pending - to be defined by user';
  }

  if (!enriched.solution) {
    enriched.solution = 'Solution to be developed based on problem analysis';
  }

  if (!enriched.modelType) {
    enriched.modelType = 'SaaS';
  }

  return enriched;
};

export const enrichContextForReports = (context) => {
  return enrichContext(context);
};

export const enrichContextForStep = (context, stepId, stepVariables) => {
  if (!context || typeof context !== 'object') {
    return enrichContext({});
  }

  // First, check which variables are missing
  const missingVars = stepVariables?.filter(v => {
    const value = getMappedValue(context, v);
    return value === null || value === '' || value === undefined;
  }) || [];

  // Enrich with all fallbacks
  const enriched = enrichContext(context);

  // Add metadata about missing variables
  enriched._missingVariables = missingVars;
  enriched._stepId = stepId;
  enriched._enrichedAt = new Date().toISOString();

  return enriched;
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateRequiredVariables = (context, requiredVars) => {
  const issues = [];
  const provided = [];

  for (const varName of requiredVars) {
    const value = getMappedValue(context, varName);
    if (value === null || value === '' || value === undefined) {
      issues.push({
        variable: varName,
        status: 'missing',
        message: `Required variable "${varName}" is missing`,
        severity: 'error',
      });
    } else {
      provided.push({
        variable: varName,
        status: 'provided',
        value: typeof value === 'string' ? value.substring(0, 50) + '...' : value,
      });
    }
  }

  const valid = issues.length === 0;
  return { valid, issues, provided, summary: `${provided.length}/${requiredVars.length} variables available` };
};

export const getMissingVariablesReport = (context, allStepsVariables) => {
  const report = {
    timestamp: new Date().toISOString(),
    totalSteps: Object.keys(allStepsVariables).length,
    stepsWithMissingVars: [],
    allMissingVariables: new Set(),
    coverage: {},
  };

  for (const [stepId, variables] of Object.entries(allStepsVariables)) {
    const missing = variables.filter(v => getMappedValue(context, v) === null);
    if (missing.length > 0) {
      report.stepsWithMissingVars.push({
        stepId,
        missingCount: missing.length,
        missingVariables: missing,
      });
      missing.forEach(v => report.allMissingVariables.add(v));
    }
    report.coverage[stepId] = {
      total: variables.length,
      provided: variables.length - missing.length,
      missing: missing.length,
      percentage: Math.round(((variables.length - missing.length) / variables.length) * 100),
    };
  }

  report.totalMissingVariables = Array.from(report.allMissingVariables);
  report.totalMissingCount = report.allMissingVariables.size;

  return report;
};

// ============================================================================
// STEP DEPENDENCY MAP (for validation)
// ============================================================================

export const stepDependencies = {
  // Each step's required variables and their typical sources
  1: { name: 'System', required: ['problem'], outputs: ['rephrasedProblem'] },
  2: { name: 'Problem Analysis', required: ['problem'], outputs: ['strugglers', 'impactScale', 'evidence'] },
  3: { name: 'Severity Assessment', required: ['problem'], outputs: ['severity', 'frequency', 'consequences', 'comparison'] },
  4: { name: 'Current Solutions', required: ['problem'], outputs: ['alternatives', 'adoptionRates', 'prosCons'] },
  5: { name: 'Solution Gaps', required: ['alternatives', 'problem'], outputs: ['gaps', 'quantifiedImpact', 'userFeedback'] },
  6: { name: 'User Persona', required: ['problem'], outputs: ['persona', 'workflow', 'decisionProcess'] },
  7: { name: 'Urgency Assessment', required: ['persona', 'problem'], outputs: ['urgency', 'consequences', 'examples'] },
  8: { name: 'Problem Validation', required: ['problem'], outputs: ['evidence', 'sources', 'supportAnalysis'] },
  9: { name: 'Solution Design', required: ['gaps', 'persona', 'problem'], outputs: ['solution', 'coreFeatures', 'addressedGaps', 'differentiation', 'modelType'] },
  10: { name: 'Value Proposition', required: ['solution', 'alternatives', 'evidence', 'problem'], outputs: ['valueProp', 'uniqueBenefits', 'quantifiedValue', 'targetCustomers'] },
  11: { name: 'Key Features', required: ['solution', 'problem'], outputs: ['features'] },
  12: { name: 'Business Model', required: ['persona', 'problem'], outputs: ['modelType', 'prosCons', 'scalability', 'feasibility'] },
  13: { name: 'Revenue Streams', required: ['modelType', 'problem'], outputs: ['revenue', 'pricingTiers', 'monetizationPotential', 'customerWTP'] },
  14: { name: 'Pricing Strategy', required: ['modelType', 'persona', 'market', 'problem'], outputs: ['pricing', 'tiers', 'logic', 'customerAcceptance'] },
  15: { name: 'Competitive Moats', required: ['solution', 'problem'], outputs: ['moat', 'implementation', 'examples', 'sustainability'] },
  16: { name: 'Risk Analysis', required: ['solution', 'problem'], outputs: ['assumptions', 'risks'] },
  17: { name: 'Technical Architecture', required: ['solution', 'modelType', 'problem'], outputs: ['techStack', 'architecture', 'patterns', 'scalability'] },
  18: { name: 'MVP Definition', required: ['solution', 'coreFeatures', 'problem'], outputs: ['mvpFeatures', 'scope', 'prioritization'] },
  19: { name: 'Infrastructure & Hosting', required: ['solution', 'scalability', 'problem'], outputs: ['cloudProvider', 'hostingStrategy', 'cdnApproach', 'infrastructureCost'] },
  20: { name: 'Security Architecture', required: ['solution', 'persona', 'problem'], outputs: ['authentication', 'encryption', 'compliance', 'securityMeasures'] },
  21: { name: 'Data Architecture', required: ['solution', 'market', 'problem'], outputs: ['databaseDesign', 'dataFlow', 'analytics', 'storageStrategy'] },
  22: { name: 'API & Integrations', required: ['solution', 'integrations', 'problem'], outputs: ['apiDesign', 'integrations', 'webhooks', 'partnerships'] },
  23: { name: 'Development Workflow', required: ['solution', 'timeline', 'problem'], outputs: ['ciCdPipeline', 'testingStrategy', 'deployment', 'monitoring'] },
  24: { name: 'Technical Roadmap', required: ['solution', 'mvpFeatures', 'timeline', 'problem'], outputs: ['milestones', 'resources', 'risks', 'phases'] },
  25: { name: 'Target Market', required: ['solution'], outputs: ['industry', 'customerType', 'marketSize', 'idealCustomer', 'market'] },
  26: { name: 'Total Addressable Market', required: ['industry'], outputs: ['tam', 'calculationMethod', 'dataSources', 'tamRationale'] },
  27: { name: 'Serviceable Available Market', required: ['tam'], outputs: ['sam', 'reachRationale', 'segmentation', 'geographicScope'] },
  28: { name: 'Serviceable Obtainable Market', required: ['sam'], outputs: ['som', 'captureShare', 'captureRationale', 'growthProjection'] },
  29: { name: 'Market Trends', required: ['industry'], outputs: ['trends', 'tailwinds', 'disruption', 'futureProjection'] },
  30: { name: 'Competitive Landscape', required: ['industry', 'solution'], outputs: ['competitors', 'competitorsList'] },
  31: { name: 'Market Entry', required: ['industry', 'solution'], outputs: ['marketEntryStrategy'] },
  32: { name: 'Customer Acquisition', required: ['industry', 'solution'], outputs: ['customerChannels', 'channelPriority'] },
  33: { name: 'Sales Strategy', required: ['industry', 'solution'], outputs: ['salesMotion', 'salesStrategy'] },
  34: { name: 'Retention Strategy', required: ['solution'], outputs: ['retentionStrategy', 'revenueGrowth'] },
  35: { name: 'Revenue Streams', required: ['modelType'], outputs: ['revenueStreams', 'revenueModel'] },
  36: { name: 'Unit Economics', required: ['modelType'], outputs: ['cac', 'ltv', 'grossMargin'] },
  37: { name: 'Cost Structure', required: ['solution'], outputs: ['fixedCosts', 'variableCosts', 'costBreakdown'] },
  38: { name: 'Financial Projections', required: ['solution'], outputs: ['financialProjections', 'year1Revenue', 'year2Revenue', 'year3Revenue'] },
  39: { name: 'Burn Rate Analysis', required: ['fixedCosts', 'variableCosts'], outputs: ['monthlyBurn', 'runway', 'burnRate'] },
  40: { name: 'Break-even Analysis', required: ['fixedCosts', 'variableCosts', 'revenue'], outputs: ['breakevenPoint', 'breakevenTimeline'] },
  41: { name: 'Funding Readiness', required: ['tam', 'team', 'solution'], outputs: ['traction', 'team', 'riskLevel'] },
  42: { name: 'Valuation Analysis', required: ['solution'], outputs: ['valuation'] },
  43: { name: 'Funding Stage', required: ['solution'], outputs: ['fundingStage'] },
  44: { name: 'Funding Amount', required: ['solution', 'monthlyBurn', 'runway'], outputs: ['askAmount'] },
  45: { name: 'Use of Funds', required: ['solution', 'askAmount'], outputs: ['useOfFunds', 'allocation'] },
  46: { name: 'Pre-money Valuation', required: ['valuation', 'askAmount'], outputs: ['preMoney'] },
  47: { name: 'Target Investors', required: ['solution', 'stage'], outputs: ['targetInvestors', 'investorTypes'] },
  48: { name: 'Funding Milestones', required: ['solution', 'askAmount'], outputs: ['milestones'] },
  49: { name: 'Founding Team', required: ['solution'], outputs: ['team', 'teamMembers', 'foundingTeam'] },
  50: { name: 'Team Gaps', required: ['persona', 'solution', 'team'], outputs: ['missingSkills', 'criticalGaps'] },
  51: { name: 'Hiring Plan', required: ['solution', 'missingSkills'], outputs: ['hiringPlan', 'hiringTimeline'] },
  52: { name: 'Governance Structure', required: ['solution'], outputs: ['advisors', 'boardStructure', 'governance'] },
  53: { name: 'Legal Structure', required: ['solution'], outputs: ['legalEntity', 'entityType', 'jurisdiction'] },
  54: { name: 'IP Protection', required: ['solution'], outputs: ['ipOwnership', 'ipStrategy', 'patents'] },
  55: { name: 'Compliance Requirements', required: ['solution'], outputs: ['compliance', 'contracts', 'regulatory'] },
  56: { name: 'Risk Assessment', required: ['solution'], outputs: ['legalRisks', 'regulatoryRisks', 'mitigation'] },
  57: { name: 'Pitch Deck Generation', required: ['problem', 'solution', 'tam', 'sam', 'som', 'coreFeatures', 'traction', 'modelType', 'competitors', 'year1', 'year2', 'year3', 'team', 'ask', 'allocation'], outputs: ['pitchDeck'] },
  58: { name: 'Business Plan Generation', required: ['solution', 'market', 'tam', 'sam', 'som', 'trends', 'coreFeatures', 'modelType', 'revenue', 'pricing', 'competitors', 'differentiation', 'year1', 'year2', 'year3', 'ask', 'team'], outputs: ['businessPlan'] },
  59: { name: 'Valuation Report Generation', required: ['tam', 'sam', 'som', 'traction', 'team', 'marketSize', 'risk', 'burnRate', 'runway', 'breakeven'], outputs: ['valuationReport'] },
};

// Export all required variables for each step (excluding validation steps)
export const stepRequiredVariables = Object.entries(stepDependencies)
  .filter(([id]) => !id.startsWith('V'))
  .reduce((acc, [id, data]) => {
    acc[id] = data.required;
    return acc;
  }, {});

// Export all output variables for each step
export const stepOutputVariables = Object.entries(stepDependencies)
  .reduce((acc, [id, data]) => {
    acc[id] = data.outputs;
    return acc;
  }, {});
