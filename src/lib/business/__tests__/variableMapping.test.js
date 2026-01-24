// Data Flow Verification Test
// Tests that all 59 steps have proper data flow and fallbacks

import { describe, it, expect, beforeAll } from 'vitest';
import {
  enrichContext,
  enrichContextForStep,
  validateRequiredVariables,
  getMappedValue,
  stepRequiredVariables,
  stepDependencies,
  getMissingVariablesReport,
  variableAliases
} from './variableMapping.js';

describe('Variable Mapping System', () => {
  describe('Core Alias Functionality', () => {
    it('should map market to industry when industry is provided', () => {
      const context = { industry: 'Tech Industry', marketSize: '$10B' };
      expect(getMappedValue(context, 'market')).toBe('Tech Industry');
    });

    it('should map market to marketSize when industry is missing', () => {
      const context = { marketSize: '$10B' };
      expect(getMappedValue(context, 'market')).toBe('$10B');
    });

    it('should return null when no alias matches', () => {
      const context = { something: 'else' };
      expect(getMappedValue(context, 'market')).toBeNull();
    });

    it('should handle missing context gracefully', () => {
      expect(getMappedValue(null, 'market')).toBeNull();
      expect(getMappedValue({}, 'market')).toBeNull();
    });
  });

  describe('Missing Variable Aliases', () => {
    it('should have aliases for integrations', () => {
      expect(variableAliases.integrations).toBeDefined();
      expect(Array.isArray(variableAliases.integrations)).toBe(true);
    });

    it('should have aliases for timeline', () => {
      expect(variableAliases.timeline).toBeDefined();
      expect(Array.isArray(variableAliases.timeline)).toBe(true);
    });

    it('should have aliases for stage', () => {
      expect(variableAliases.stage).toBeDefined();
      expect(Array.isArray(variableAliases.stage)).toBe(true);
    });

    it('should have aliases for breakeven', () => {
      expect(variableAliases.breakeven).toBeDefined();
      expect(Array.isArray(variableAliases.breakeven)).toBe(true);
    });
  });

  describe('Context Enrichment', () => {
    it('should enrich empty context with fallbacks', () => {
      const enriched = enrichContext({});
      expect(enriched.traction).toBeDefined();
      expect(enriched.traction).toContain('Initial validation phase');
      expect(enriched.integrations).toBeDefined();
      expect(enriched.timeline).toBeDefined();
      expect(enriched.stage).toBeDefined();
      expect(enriched.breakeven).toBeDefined();
    });

    it('should preserve existing values when enriching', () => {
      const context = {
        traction: 'My custom traction',
        market: 'My market',
        team: 'My team'
      };
      const enriched = enrichContext(context);
      expect(enriched.traction).toBe('My custom traction');
      expect(enriched.market).toBe('My market');
      expect(enriched.team).toBe('My team');
    });

    it('should enrich step-specific context', () => {
      const context = { solution: 'My solution' };
      const stepId = 'step25';
      const stepVars = ['solution', 'market'];

      const enriched = enrichContextForStep(context, stepId, stepVars);

      expect(enriched._stepId).toBe('step25');
      expect(enriched._missingVariables).toBeDefined();
      expect(enriched.market).toBeDefined();
    });
  });

  describe('Required Variable Validation', () => {
    it('should pass validation when all required vars exist', () => {
      const context = {
        problem: 'Test problem',
        solution: 'Test solution',
        market: 'Test market'
      };
      const result = validateRequiredVariables(context, ['problem', 'solution', 'market']);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.provided).toHaveLength(3);
    });

    it('should fail validation when required vars are missing', () => {
      const context = {
        problem: 'Test problem'
        // missing solution and market
      };
      const result = validateRequiredVariables(context, ['problem', 'solution', 'market']);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(2);
      expect(result.summary).toBe('1/3 variables available');
    });

    it('should identify errors vs warnings in validation', () => {
      const context = {
        problem: 'Test problem'
      };
      const result = validateRequiredVariables(context, ['problem', 'solution']);

      const errors = result.issues.filter(i => i.severity === 'error');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Step Dependencies', () => {
    it('should have dependencies defined for all 59 steps', () => {
      const stepIds = Object.keys(stepDependencies);
      expect(stepIds.length).toBeGreaterThanOrEqual(59);
    });

    it('should have required variables for each step', () => {
      const steps = Object.keys(stepRequiredVariables);
      expect(steps.length).toBeGreaterThanOrEqual(57); // Excluding system and validation steps
    });

    it('should have output variables for each step', () => {
      for (const [stepId, data] of Object.entries(stepDependencies)) {
        expect(data.outputs).toBeDefined();
        expect(Array.isArray(data.outputs)).toBe(true);
        expect(data.outputs.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Missing Variables Report', () => {
    it('should generate report for empty context', () => {
      const report = getMissingVariablesReport({}, stepRequiredVariables);

      expect(report.timestamp).toBeDefined();
      expect(report.totalSteps).toBeGreaterThan(0);
      expect(report.stepsWithMissingVars.length).toBeGreaterThan(0);
      expect(report.totalMissingVariables.length).toBeGreaterThan(0);
      expect(report.totalMissingCount).toBeGreaterThan(0);
    });

    it('should show coverage percentages', () => {
      const report = getMissingVariablesReport({}, stepRequiredVariables);

      for (const [stepId, coverage] of Object.entries(report.coverage)) {
        expect(coverage.total).toBeGreaterThan(0);
        expect(coverage.missing).toBeGreaterThanOrEqual(0);
        expect(coverage.provided).toBeGreaterThanOrEqual(0);
        expect(coverage.percentage).toBeGreaterThanOrEqual(0);
        expect(coverage.percentage).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Critical Variable Flow', () => {
    it('should handle integrations variable flow', () => {
      const context = {};
      const enriched = enrichContext(context);

      expect(enriched.integrations).toBeDefined();
      expect(typeof enriched.integrations).toBe('string');
      expect(enriched.integrations.length).toBeGreaterThan(0);
    });

    it('should handle timeline variable flow', () => {
      const context = {};
      const enriched = enrichContext(context);

      expect(enriched.timeline).toBeDefined();
      expect(typeof enriched.timeline).toBe('string');
      expect(enriched.timeline.length).toBeGreaterThan(0);
    });

    it('should handle stage variable flow', () => {
      const context = {};
      const enriched = enrichContext(context);

      expect(enriched.stage).toBeDefined();
      expect(typeof enriched.stage).toBe('string');
      expect(enriched.stage.length).toBeGreaterThan(0);
    });

    it('should handle breakeven variable flow', () => {
      const context = {};
      const enriched = enrichContext(context);

      expect(enriched.breakevenPoint).toBeDefined();
      expect(enriched.breakevenTimeline).toBeDefined();
      expect(typeof enriched.breakevenPoint).toBe('string');
      expect(typeof enriched.breakevenTimeline).toBe('string');
    });

    it('should handle traction variable flow with context', () => {
      const context = {
        revenue: 100000,
        customerCount: 1000,
        growthRate: '50%'
      };
      const enriched = enrichContext(context);

      expect(enriched.traction).toBeDefined();
      expect(enriched.traction).toContain('Revenue');
    });

    it('should handle year1/year2/year3 variable flow', () => {
      const context = {
        financialProjections: 'Projected $1M ARR'
      };
      const enriched = enrichContext(context);

      expect(enriched.year1).toBeDefined();
      expect(enriched.year2).toBeDefined();
      expect(enriched.year3).toBeDefined();
      expect(enriched.year1).toContain('$1M');
    });
  });

  describe('Data Persistence Through Steps', () => {
    it('should persist problem through enrichment', () => {
      const context = { problem: 'My startup problem' };
      const enriched = enrichContext(context);

      expect(enriched.problem).toBe('My startup problem');
    });

    it('should add problem fallback when missing', () => {
      const context = {};
      const enriched = enrichContext(context);

      expect(enriched.problem).toBeDefined();
      expect(enriched.problem).toContain('Problem statement');
    });

    it('should add solution fallback when missing', () => {
      const context = {};
      const enriched = enrichContext(context);

      expect(enriched.solution).toBeDefined();
      expect(enriched.solution).toContain('Solution');
    });
  });

  describe('Report Steps (57-59) Requirements', () => {
    it('step57 should have all required variables mapped', () => {
      const required = stepRequiredVariables['57'];
      expect(required).toBeDefined();

      const context = {
        problem: 'Test',
        solution: 'Test',
        tam: 'Test',
        sam: 'Test',
        som: 'Test',
        coreFeatures: 'Test',
        traction: 'Test',
        modelType: 'Test',
        competitors: 'Test',
        year1: 'Test',
        year2: 'Test',
        year3: 'Test',
        team: 'Test',
        ask: 'Test',
        allocation: 'Test'
      };

      const result = validateRequiredVariables(context, required);
      expect(result.valid).toBe(true);
    });

    it('step58 should have all required variables mapped', () => {
      const required = stepRequiredVariables['58'];
      expect(required).toBeDefined();

      const context = {
        solution: 'Test',
        market: 'Test',
        tam: 'Test',
        sam: 'Test',
        som: 'Test',
        trends: 'Test',
        coreFeatures: 'Test',
        modelType: 'Test',
        revenue: 'Test',
        pricing: 'Test',
        competitors: 'Test',
        differentiation: 'Test',
        year1: 'Test',
        year2: 'Test',
        year3: 'Test',
        ask: 'Test',
        team: 'Test'
      };

      const result = validateRequiredVariables(context, required);
      expect(result.valid).toBe(true);
    });

    it('step59 should have all required variables mapped', () => {
      const required = stepRequiredVariables['59'];
      expect(required).toBeDefined();

      const context = {
        tam: 'Test',
        sam: 'Test',
        som: 'Test',
        traction: 'Test',
        team: 'Test',
        marketSize: 'Test',
        risk: 'Test',
        burnRate: 'Test',
        runway: 'Test',
        breakeven: 'Test'
      };

      const result = validateRequiredVariables(context, required);
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined context', () => {
      const enriched = enrichContext(undefined);
      expect(enriched).toEqual({});
    });

    it('should handle null context', () => {
      const enriched = enrichContext(null);
      expect(enriched).toEqual({});
    });

    it('should handle empty arrays', () => {
      const enriched = enrichContext({ variables: [] });
      expect(enriched.variables).toEqual([]);
    });

    it('should handle complex nested objects', () => {
      const context = {
        nested: {
          deep: {
            value: 'found'
          }
        }
      };
      expect(getMappedValue(context, 'market')).toBeNull();
    });
  });
});
