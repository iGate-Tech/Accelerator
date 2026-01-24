// ============================================================================
// VARIABLE MAPPING UTILITY - 100% DATA FLOW HEALTH EDITION
// Provides comprehensive fallback mappings for missing or inconsistently named variables
// Updated for new step order with clean dependencies
// ============================================================================

// ============================================================================
// VARIABLE ALIASES
// ============================================================================

export const variableAliases = {
  // market: industry is defined in Marketing Model (step25 -> new step14)
  market: ['industry', 'marketSize', 'targetMarket', 'targetMarketSize'],

  // competitors: various names used
  competitors: ['competitiveAnalysis', 'competition', 'competitorsList', 'competitorList'],

  // traction: defined in Idea Model step8b
  traction: ['traction', 'validationMetrics', 'keyMilestones', 'milestones', 'metrics'],

  // team: defined in Team Model step49 -> new step45
  team: ['team', 'teamMembers', 'foundingTeam', 'teamInfo', 'teamComposition', 'foundingTeamMembers'],

  // ask: defined in Funding Model step44 -> new step56
  ask: ['askAmount', 'fundingAsk', 'amount', 'fundingAmount', 'raiseAmount'],
  askAmount: ['ask', 'fundingAsk', 'amount', 'fundingAmount', 'raiseAmount'],

  // allocation: defined in Funding Model step45 -> new step58
  allocation: ['useOfFunds', 'fundingAllocation', 'fundsAllocation', 'allocationPlan', 'fundsUse'],

  // pricing: defined in Business Model step14 -> new step26
  pricing: ['pricingTiers', 'pricingStrategy', 'price', 'pricingModel', 'pricingStructure'],

  // revenue: defined in Business Model step13 -> new step25
  revenue: ['revenueStreams', 'revenueModel', 'revenueSources', 'revenueStrategy', 'monetization'],

  // differentiation: defined in Business Model step9 -> new step10
  differentiation: ['uniqueBenefits', 'differentiation', 'uniqueValue', 'competitiveEdge', 'valueProposition'],

  // risk: defined in Business Model step16 -> new step28
  risk: ['risks', 'riskAnalysis', 'businessRisks', 'riskLevel', 'riskFactors', 'mitigation'],

  // year1, year2, year3: defined in Financial Model step38 -> new step42
  year1: ['year1Projections', 'revenueYear1', 'firstYear', 'yearOne', 'revenueYearOne'],
  year2: ['year2Projections', 'revenueYear2', 'secondYear', 'yearTwo', 'revenueYearTwo'],
  year3: ['year3Projections', 'revenueYear3', 'thirdYear', 'yearThree', 'revenueYearThree'],

  // trends: defined in Marketing Model step29 -> new step19
  trends: ['marketTrends', 'growthTrends', 'industryTrends', 'trendAnalysis', 'marketDynamics'],

  // marketSize: defined in Marketing Model step25 -> new step14
  marketSize: ['market', 'targetMarket', 'sam', 'marketSizeEstimate', 'tamEstimate'],

  // integrations: defined in Technical Model step24c -> new step38
  integrations: ['integrations', 'integrationPlan', 'integrationList', 'integrationsList', 'thirdPartyIntegrations'],

  // timeline: defined in Technical Model step24b -> new step37
  timeline: ['timeline', 'projectPlan', 'developmentPhases', 'projectTimeline', 'developmentTimeline', 'roadmap'],

  // stage: defined in Funding Model step43 -> new step55
  stage: ['fundingStage', 'stage', 'fundingRound', 'investmentStage', 'seedStage', 'seriesStage'],

  // breakeven: defined in Financial Model step40 -> new step44
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
  expenses: ['fixedCosts', 'variableCosts', 'costStructure', 'operatingExpenses', 'totalExpenses', 'expenseStructure'],
  monthlyBurn: ['burnRate', 'monthlyBurnRate', 'cashBurn', 'burn'],
  burnRate: ['monthlyBurn', 'monthlyBurnRate', 'cashBurn', 'burn'],
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
  preMoney: ['premoney', 'preMoneyValuation', 'preMoneyValue', 'preMoneyRange', 'valuationPreMoney'],
  valuation: ['valuation', 'postMoneyValuation', 'postMoney', 'valuationRange', 'estimatedValuation', 'currentValuation'],
  inputs: ['financialInputs', 'valuationInputs', 'metrics', 'financialMetrics', 'revenue', 'expenses', 'growthRate', 'cashFlow', 'burnRate', 'runway', 'traction', 'marketSize', 'team', 'riskFactors'],
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

  const traction = context.traction || context.validationMetrics || context.keyMilestones || context.milestones || '';
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
    year1: year1Proj || financialProjections || 'Year 1: Target $100K-$500K ARR with MVP launch',
    year2: year2Proj || 'Year 2: Target $500K-$2M ARR representing 3-5x growth',
    year3: year3Proj || 'Year 3: Target $2M-$10M ARR with scaled operations',
  };

  return projections;
};

export const generateCompetitorsFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Competitive landscape analysis pending - competitors to be identified';
  }

  if (context.competitors) return context.competitors;
  if (context.competitiveAnalysis) return context.competitiveAnalysis;
  if (context.competition) return context.competition;
  if (context.competitorsList) return context.competitorsList;

  return 'Competitive landscape analysis pending - direct competitors to be identified through market research';
};

export const generateTeamFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Founding team composition pending - key hires identified';
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
    return 'Funding amount to be determined based on runway requirements';
  }

  if (context.ask) return context.ask;
  if (context.askAmount) return context.askAmount;
  if (context.fundingAsk) return context.fundingAsk;
  if (context.amount) return context.amount;
  if (context.fundingAmount) return context.fundingAmount;
  if (context.raiseAmount) return context.raiseAmount;

  return 'Funding amount to be determined based on runway requirements';
};

export const generateAllocationFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Use of funds allocation pending - budget breakdown: 40% product, 30% sales/marketing, 20% ops, 10% reserves';
  }

  if (context.allocation) return context.allocation;
  if (context.useOfFunds) return context.useOfFunds;
  if (context.fundingAllocation) return context.fundingAllocation;
  if (context.fundsAllocation) return context.fundsAllocation;
  if (context.allocationPlan) return context.allocationPlan;

  return 'Use of funds allocation: 40% product development, 30% customer acquisition, 20% operations, 10% reserves';
};

export const generateIntegrationsFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Integration strategy pending - core platform first, third-party integrations in phase 2';
  }

  if (context.integrations) return context.integrations;
  if (context.integrationPlan) return context.integrationPlan;
  if (context.integrationList) return context.integrationList;

  return 'Integration Strategy: Core APIs built first (auth, data, payments). Partner integrations (CRM, analytics) planned for Phase 2.';
};

export const generateTimelineFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Timeline: MVP 3-4 months, Beta 2 months, Launch Month 6, Scale Months 7-12';
  }

  if (context.timeline) return context.timeline;
  if (context.projectPlan) return context.projectPlan;
  if (context.developmentPhases) return context.developmentPhases;

  const milestones = context.milestones || '';
  if (milestones) return `Timeline based on milestones: ${milestones}`;

  return 'Development Timeline: MVP (3-4 months), Beta Testing (2 months), Launch (Month 6), Growth Phase (Months 7-18)';
};

export const generateStageFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Recommended Stage: Pre-seed to Seed';
  }

  if (context.stage) return context.stage;
  if (context.fundingStage) return context.fundingStage;
  if (context.fundingRound) return context.fundingRound;
  if (context.investmentStage) return context.investmentStage;

  return 'Recommended Stage: Pre-seed (concept/early validation stage)';
};

export const generateBreakevenFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return { breakevenPoint: 'Break-even point TBD', breakevenTimeline: 'Month 24-36' };
  }

  if (context.breakeven) return context.breakeven;
  if (context.breakevenPoint) return context.breakevenPoint;
  if (context.breakevenTimeline) return context.breakevenTimeline;

  return {
    breakevenPoint: 'Break-even point TBD - requires validated unit economics',
    breakevenTimeline: 'Month 24-36 contingent on achieving revenue targets'
  };
};

// ============================================================================
// ADDITIONAL GENERATORS
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

  return 'Key Risks: Market timing, competition, execution, funding. Mitigation: Agile approach, customer-first.';
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

export const generateAlternativesFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Current solutions analysis pending - alternatives to be identified';
  }

  if (context.alternatives) return context.alternatives;
  if (context.currentSolutions) return context.currentSolutions;
  if (context.existingSolutions) return context.existingSolutions;
  if (context.competitors) return context.competitors;
  if (context.competingSolutions) return context.competingSolutions;

  return 'Current solutions analysis pending - manual processes, software tools, and competitor offerings to be identified';
};

export const generateExpensesFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Operating expenses to be determined based on cost structure analysis';
  }

  if (context.expenses) return context.expenses;
  if (context.operatingExpenses) return context.operatingExpenses;
  if (context.totalExpenses) return context.totalExpenses;
  if (context.expenseStructure) return context.expenseStructure;
  if (context.costStructure) return context.costStructure;

  // Combine fixed and variable costs if available
  const fixedCosts = context.fixedCosts || context.fixedExpenses || context.monthlyFixedCosts || context.fixedOperatingCosts;
  const variableCosts = context.variableCosts || context.variableExpenses || context.perUnitCosts || context.variableOperatingCosts;

  if (fixedCosts || variableCosts) {
    const parts = [];
    if (fixedCosts) parts.push(`Fixed Costs: ${fixedCosts}`);
    if (variableCosts) parts.push(`Variable Costs: ${variableCosts}`);
    return parts.length > 0 ? parts.join(' | ') : 'Operating expenses to be determined';
  }

  return 'Operating expenses to be determined based on cost structure analysis';
};

export const generateInputsFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Financial inputs for valuation to be determined based on available metrics';
  }

  if (context.inputs) return context.inputs;
  if (context.financialInputs) return context.financialInputs;
  if (context.valuationInputs) return context.valuationInputs;
  if (context.metrics) return context.metrics;
  if (context.financialMetrics) return context.financialMetrics;

  // Compile available financial data for valuation
  const parts = [];

  if (context.revenue) {
    parts.push(`Revenue: ${context.revenue}`);
  }
  if (context.expenses) {
    parts.push(`Expenses: ${context.expenses}`);
  }
  if (context.growthRate) {
    parts.push(`Growth Rate: ${context.growthRate}`);
  }
  if (context.cashFlow) {
    parts.push(`Cash Flow: ${context.cashFlow}`);
  }
  if (context.burnRate) {
    parts.push(`Burn Rate: ${context.burnRate}`);
  }
  if (context.runway) {
    parts.push(`Runway: ${context.runway}`);
  }
  if (context.traction) {
    parts.push(`Traction: ${context.traction}`);
  }
  if (context.marketSize) {
    parts.push(`Market Size: ${context.marketSize}`);
  }
  if (context.team) {
    parts.push(`Team: ${context.team}`);
  }
  if (context.riskFactors) {
    parts.push(`Risk Factors: ${context.riskFactors}`);
  }

  return parts.length > 0
    ? `Valuation Inputs: ${parts.join(' | ')}`
    : 'Financial inputs for valuation to be determined based on available metrics';
};

export const generatePreMoneyFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Pre-money valuation to be determined based on market analysis and comparable valuations';
  }

  if (context.preMoney) return context.preMoney;
  if (context.premoney) return context.premoney;
  if (context.preMoneyValuation) return context.preMoneyValuation;
  if (context.preMoneyValue) return context.preMoneyValue;
  if (context.preMoneyRange) return context.preMoneyRange;
  if (context.valuationPreMoney) return context.valuationPreMoney;

  // Calculate from valuation and askAmount if available
  const valuation = context.valuation ? parseFloat(context.valuation.replace(/[^\d.-]/g, '')) : null;
  const askAmount = context.askAmount ? parseFloat(context.askAmount.replace(/[^\d.-]/g, '')) : null;

  if (valuation && askAmount) {
    const preMoney = valuation - askAmount;
    return `$${preMoney.toLocaleString()} (calculated from valuation minus funding ask)`;
  }

  // Use valuation as a fallback if available
  if (context.valuation) {
    return `${context.valuation} (using valuation as pre-money estimate)`;
  }

  return 'Pre-money valuation to be determined based on market analysis and comparable valuations';
};

export const generateValuationFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Company valuation to be determined based on market analysis and comparable valuations';
  }

  if (context.valuation) return context.valuation;
  if (context.postMoneyValuation) return context.postMoneyValuation;
  if (context.postMoney) return context.postMoney;
  if (context.valuationRange) return context.valuationRange;
  if (context.estimatedValuation) return context.estimatedValuation;
  if (context.currentValuation) return context.currentValuation;

  // Calculate from preMoney and askAmount if available
  const preMoney = context.preMoney ? parseFloat(context.preMoney.replace(/[^\d.-]/g, '')) : null;
  const askAmount = context.askAmount ? parseFloat(context.askAmount.replace(/[^\d.-]/g, '')) : null;

  if (preMoney && askAmount) {
    const postMoney = preMoney + askAmount;
    return `$${postMoney.toLocaleString()} (calculated from pre-money plus funding ask)`;
  }

  // Use inputs if available
  if (context.inputs) {
    return `${context.inputs} (using financial inputs as valuation basis)`;
  }

  // Use revenue if available
  if (context.revenue) {
    return `${context.revenue} (using revenue as valuation indicator)`;
  }

  return 'Company valuation to be determined based on market analysis and comparable valuations';
};

export const generateBurnRateFromContext = (context) => {
  if (!context || typeof context !== 'object') {
    return 'Monthly burn rate to be determined based on expense analysis';
  }

  if (context.burnRate) return context.burnRate;
  if (context.monthlyBurn) return context.monthlyBurn;
  if (context.monthlyBurnRate) return context.monthlyBurnRate;
  if (context.cashBurn) return context.cashBurn;
  if (context.burn) return context.burn;

  // Calculate from expenses if available
  const fixedCosts = context.fixedCosts ? parseFloat(context.fixedCosts.replace(/[^\d.-]/g, '')) : null;
  const variableCosts = context.variableCosts ? parseFloat(context.variableCosts.replace(/[^\d.-]/g, '')) : null;

  if (fixedCosts || variableCosts) {
    const totalMonthly = (fixedCosts || 0) + (variableCosts || 0);
    return `$${totalMonthly.toLocaleString()} per month (estimated from fixed and variable costs)`;
  }

  // Use expenses if available
  if (context.expenses) {
    return `${context.expenses} (using expenses as burn rate estimate)`;
  }

  return 'Monthly burn rate to be determined based on expense analysis';
};

// ============================================================================
// COMPREHENSIVE CONTEXT ENRICHMENT
// ============================================================================

export const enrichContext = (context) => {
  if (!context || typeof context !== 'object') {
    return {};
  }

  const enriched = normalizeContext(context);

  const generators = {
    traction: generateTractionFromContext,
    competitors: generateCompetitorsFromContext,
    team: generateTeamFromContext,
    ask: generateAskFromContext,
    askAmount: generateAskFromContext,
    allocation: generateAllocationFromContext,
    year1: (ctx) => generateYearlyProjections(ctx).year1,
    year2: (ctx) => generateYearlyProjections(ctx).year2,
    year3: (ctx) => generateYearlyProjections(ctx).year3,
    integrations: generateIntegrationsFromContext,
    timeline: generateTimelineFromContext,
    stage: generateStageFromContext,
    breakevenPoint: (ctx) => generateBreakevenFromContext(ctx).breakevenPoint,
    breakevenTimeline: (ctx) => generateBreakevenFromContext(ctx).breakevenTimeline,
    breakeven: generateBreakevenFromContext,
    pricing: generatePricingFromContext,
    revenue: generateRevenueFromContext,
    risk: generateRiskFromContext,
    market: generateMarketFromContext,
    differentiation: generateDifferentiationFromContext,
    trends: generateTrendsFromContext,
    alternatives: generateAlternativesFromContext,
    expenses: generateExpensesFromContext,
    inputs: generateInputsFromContext,
    preMoney: generatePreMoneyFromContext,
    valuation: generateValuationFromContext,
    burnRate: generateBurnRateFromContext,
  };

  for (const [key, generator] of Object.entries(generators)) {
    if (!enriched[key]) {
      enriched[key] = generator(context);
    }
  }

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

export const enrichContextForReports = (context) => enrichContext(context);

export const enrichContextForStep = (context, stepId, stepVariables) => {
  if (!context || typeof context !== 'object') {
    return enrichContext({});
  }

  const missingVars = stepVariables?.filter(v => {
    const value = getMappedValue(context, v);
    return value === null || value === '' || value === undefined;
  }) || [];

  const enriched = enrichContext(context);

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
// STEP DEPENDENCY MAP - 100% HEALTH EDITION
// Updated for new step order with clean dependencies
// ============================================================================

export const stepDependencies = {
  // PHASE 1: SYSTEM
  system: { name: 'System', required: ['problem'], outputs: ['rephrasedProblem'] },

  // PHASE 2: IDEA MODEL
  step2: { name: 'Problem Analysis', required: ['problem'], outputs: ['strugglers', 'impactScale', 'evidence'] },
  step3: { name: 'Severity Assessment', required: ['problem'], outputs: ['severity', 'frequency', 'consequences', 'comparison'] },
  step4: { name: 'Current Solutions', required: ['problem'], outputs: ['alternatives', 'adoptionRates', 'prosCons'] },
  step5: { name: 'Solution Gaps', required: ['alternatives', 'problem'], outputs: ['gaps', 'quantifiedImpact', 'userFeedback'] },
  step6: { name: 'User Persona', required: ['problem'], outputs: ['persona', 'workflow', 'decisionProcess'] },
  step7: { name: 'Urgency Assessment', required: ['persona', 'problem'], outputs: ['urgency', 'consequences', 'examples'] },
  step8: { name: 'Problem Validation', required: ['problem'], outputs: ['evidence', 'sources', 'supportAnalysis'] },
  step8b: { name: 'Traction Definition', required: ['problem', 'evidence', 'persona'], outputs: ['traction', 'validationMetrics', 'keyMilestones'] },

  // PHASE 3: BUSINESS CORE
  step9: { name: 'Solution Design', required: ['gaps', 'persona', 'problem'], outputs: ['solution', 'coreFeatures', 'addressedGaps', 'differentiation', 'modelType'] },
  step10: { name: 'Value Proposition', required: ['solution', 'alternatives', 'evidence', 'problem'], outputs: ['valueProp', 'uniqueBenefits', 'quantifiedValue', 'targetCustomers'] },
  step11: { name: 'Key Features', required: ['solution', 'problem'], outputs: ['features'] },
  step12: { name: 'Business Model', required: ['persona', 'problem'], outputs: ['modelType', 'prosCons', 'scalability', 'feasibility'] },

  // PHASE 4: MARKETING MODEL
  step25: { name: 'Target Market', required: ['solution'], outputs: ['industry', 'customerType', 'marketSize', 'idealCustomer', 'market'] },
  step26: { name: 'Total Addressable Market', required: ['industry'], outputs: ['tam', 'calculationMethod', 'dataSources', 'tamRationale'] },
  step27: { name: 'Serviceable Available Market', required: ['tam'], outputs: ['sam', 'reachRationale', 'segmentation', 'geographicScope'] },
  step28: { name: 'Serviceable Obtainable Market', required: ['sam'], outputs: ['som', 'captureShare', 'captureRationale', 'growthProjection'] },
  validate_tam_sam_som: { name: 'TAM/SAM/SOM Validation', required: ['tam', 'sam', 'som'], outputs: ['valid', 'message'] },
  step29: { name: 'Market Trends', required: ['industry'], outputs: ['trends', 'tailwinds', 'disruption', 'futureProjection'] },
  step30: { name: 'Competitive Landscape', required: ['industry', 'solution'], outputs: ['competitors', 'competitorsList'] },
  step31: { name: 'Market Entry', required: ['industry', 'solution'], outputs: ['marketEntryStrategy'] },
  step32: { name: 'Customer Acquisition', required: ['industry', 'solution'], outputs: ['customerChannels', 'channelPriority'] },
  step33: { name: 'Sales Strategy', required: ['industry', 'solution'], outputs: ['salesMotion', 'salesStrategy'] },
  step34: { name: 'Retention Strategy', required: ['solution'], outputs: ['retentionStrategy'] },

  // PHASE 5: BUSINESS DETAILS
  step13: { name: 'Revenue Streams', required: ['modelType'], outputs: ['revenueStreams', 'revenueModel'] },
  step14: { name: 'Pricing Strategy', required: ['modelType', 'persona', 'market'], outputs: ['pricing', 'tiers', 'logic', 'customerAcceptance'] },
  step15: { name: 'Competitive Moats', required: ['solution'], outputs: ['moat', 'implementation', 'examples', 'sustainability'] },
  step16: { name: 'Risk Analysis', required: ['solution'], outputs: ['assumptions', 'risks'] },

  // PHASE 6: TECHNICAL MODEL
  step17: { name: 'Technical Architecture', required: ['solution', 'modelType'], outputs: ['techStack', 'architecture', 'patterns', 'scalability'] },
  step18: { name: 'MVP Definition', required: ['solution', 'coreFeatures'], outputs: ['mvpFeatures', 'scope', 'prioritization'] },
  step19: { name: 'Infrastructure & Hosting', required: ['solution', 'scalability'], outputs: ['cloudProvider', 'hostingStrategy', 'cdnApproach', 'infrastructureCost'] },
  step20: { name: 'Security Architecture', required: ['solution', 'persona'], outputs: ['authentication', 'encryption', 'compliance', 'securityMeasures'] },
  step21: { name: 'Data Architecture', required: ['solution', 'market'], outputs: ['databaseDesign', 'dataFlow', 'analytics', 'storageStrategy'] },
  step22: { name: 'API & Integrations', required: ['solution', 'integrations'], outputs: ['apiDesign', 'integrations', 'webhooks', 'partnerships'] },
  step23: { name: 'Development Workflow', required: ['solution', 'timeline'], outputs: ['ciCdPipeline', 'testingStrategy', 'deployment', 'monitoring'] },
  step24: { name: 'Technical Roadmap', required: ['solution', 'mvpFeatures'], outputs: ['milestones', 'resources', 'risks', 'phases'] },
  step24b: { name: 'Timeline Definition', required: ['solution', 'mvpFeatures', 'milestones'], outputs: ['timeline', 'projectPlan', 'developmentPhases'] },
  step24c: { name: 'Integrations Definition', required: ['solution', 'architecture', 'apiDesign'], outputs: ['integrations', 'integrationPlan', 'partnershipOpportunities'] },

  // PHASE 7: FINANCIAL MODEL
  step35: { name: 'Revenue Streams', required: ['modelType'], outputs: ['revenueStreams', 'revenueModel'] },
  step36: { name: 'Unit Economics', required: ['modelType'], outputs: ['cac', 'ltv', 'grossMargin'] },
  step37: { name: 'Cost Structure', required: ['solution'], outputs: ['fixedCosts', 'variableCosts', 'costBreakdown'] },
  step38: { name: 'Financial Projections', required: ['solution', 'revenue', 'expenses'], outputs: ['financialProjections', 'year1Revenue', 'year2Revenue', 'year3Revenue'] },
  step39: { name: 'Burn Rate Analysis', required: ['fixedCosts', 'variableCosts'], outputs: ['monthlyBurn', 'runway', 'burnRate'] },
  step40: { name: 'Break-even Analysis', required: ['fixedCosts', 'variableCosts', 'revenue'], outputs: ['breakevenPoint', 'breakevenTimeline'] },

  // PHASE 8: TEAM MODEL
  step49: { name: 'Founding Team', required: ['solution'], outputs: ['team', 'teamMembers', 'foundingTeam'] },
  step50: { name: 'Team Gaps', required: ['persona', 'solution', 'team'], outputs: ['missingSkills', 'criticalGaps'] },
  step51: { name: 'Hiring Plan', required: ['solution', 'missingSkills'], outputs: ['hiringPlan', 'hiringTimeline'] },

  // PHASE 9: LEGAL MODEL
  step52: { name: 'Governance Structure', required: ['solution'], outputs: ['advisors', 'boardStructure', 'governance'] },
  step53: { name: 'Legal Structure', required: ['solution'], outputs: ['legalEntity', 'entityType', 'jurisdiction'] },
  step54: { name: 'IP Protection', required: ['solution'], outputs: ['ipOwnership', 'ipStrategy', 'patents'] },
  step55: { name: 'Compliance Requirements', required: ['solution'], outputs: ['compliance', 'contracts', 'regulatory'] },
  step56: { name: 'Risk Assessment', required: ['solution'], outputs: ['legalRisks', 'regulatoryRisks', 'mitigation'] },

  // PHASE 10: FUNDING MODEL
  step41: { name: 'Funding Readiness', required: ['tam', 'team', 'solution', 'traction'], outputs: ['traction', 'team', 'riskLevel'] },
  step42: { name: 'Valuation Analysis', required: ['solution', 'inputs'], outputs: ['valuation'] },
  step43: { name: 'Funding Stage', required: ['solution', 'traction'], outputs: ['fundingStage'] },
  step44: { name: 'Funding Amount', required: ['solution', 'monthlyBurn', 'runway'], outputs: ['askAmount'] },
  validate_deck_ask: { name: 'Funding Validation', required: ['valuation', 'ask'], outputs: ['valid', 'issues'] },
  step45: { name: 'Use of Funds', required: ['solution', 'askAmount'], outputs: ['useOfFunds', 'allocation'] },
  step46: { name: 'Pre-money Valuation', required: ['valuation', 'askAmount'], outputs: ['preMoney'] },
  validate_pre_money: { name: 'Valuation Check', required: ['preMoney', 'ask'], outputs: ['valid', 'issues'] },
  step47: { name: 'Target Investors', required: ['solution', 'stage'], outputs: ['targetInvestors', 'investorTypes'] },
  step48: { name: 'Funding Milestones', required: ['solution', 'askAmount'], outputs: ['milestones'] },

  // PHASE 11: REPORTS
  step57: { name: 'Pitch Deck Generation', required: ['problem', 'solution', 'tam', 'sam', 'som', 'coreFeatures', 'traction', 'modelType', 'competitors', 'year1', 'year2', 'year3', 'team', 'ask', 'allocation'], outputs: ['pitchDeck'] },
  step58: { name: 'Business Plan Generation', required: ['solution', 'market', 'tam', 'sam', 'som', 'trends', 'coreFeatures', 'modelType', 'revenue', 'pricing', 'competitors', 'differentiation', 'year1', 'year2', 'year3', 'ask', 'team'], outputs: ['businessPlan'] },
  step59: { name: 'Valuation Report Generation', required: ['tam', 'sam', 'som', 'traction', 'team', 'marketSize', 'risk', 'burnRate', 'runway', 'breakeven'], outputs: ['valuationReport'] },
};

// ============================================================================
// STEP REQUIRED VARIABLES (for validation)
// ============================================================================

export const stepRequiredVariables = Object.entries(stepDependencies)
  .filter(([id]) => !id.startsWith('validate'))
  .reduce((acc, [id, data]) => {
    acc[id] = data.required;
    return acc;
  }, {});

// ============================================================================
// STEP OUTPUT VARIABLES (for tracking)
// ============================================================================

export const stepOutputVariables = Object.entries(stepDependencies)
  .reduce((acc, [id, data]) => {
    acc[id] = data.outputs;
    return acc;
  }, {});
