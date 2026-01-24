# 100% Data Flow Health - Complete Migration Plan

## Current State vs Target State

### Current Order (89% Healthy)
```
1. System (1 step)
2. Idea Model (7 steps: 2-8)
3. Business Model (8 steps: 9-16)
4. Technical Model (8 steps: 17-24)
5. Marketing Model (10 steps: 25-34)
6. Financial Model (6 steps: 35-40)
7. Funding Model (8 steps: 41-48)
8. Team Model (3 steps: 49-51)
9. Legal Model (5 steps: 52-56)
10. Reports (3 steps: 57-59)
```

### Target Order (100% Healthy)
```
1. System (1 step: 1)
2. Idea Model (7 steps: 2-8)
3. Business Core (4 steps: 9-12)      ← Solution, Features, Business Model
4. Marketing Model (10 steps: 13-22)  ← Market defined HERE
5. Business Details (4 steps: 23-26)  ← Pricing uses market from step 22
6. Technical Model (10 steps: 27-36)  ← Added timeline, integrations steps
7. Financial Model (6 steps: 37-42)
8. Team Model (3 steps: 43-45)        ← Team defined BEFORE Funding
9. Legal Model (5 steps: 46-50)
10. Funding Model (6 steps: 51-56)    ← Uses team from step 45
11. Reports (3 steps: 57-59)
```

---

## Step-by-Step Migration

### Phase 1: New Step Definitions

#### Step X: Traction Definition (New - add to Idea Model)
**File:** `src/lib/business/models/IdeaModel/step8b.js` (between step8 and step9)
**Purpose:** Output traction variable for Funding Model
**Variables:** problem, evidence, personas
**Outputs:** traction, validationMetrics

#### Step Y: Timeline Definition (New - add to Technical Model)
**File:** `src/lib/business/models/TechnicalModel/step24b.js`
**Purpose:** Output timeline variable for Technical Roadmap
**Variables:** solution, mvpFeatures, milestones
**Outputs:** timeline, projectPlan, developmentPhases

#### Step Z: Integrations Definition (New - add to Technical Model)
**File:** `src/lib/business/models/TechnicalModel/step24c.js`
**Purpose:** Output integrations variable for API & Integrations
**Variables:** solution, architecture, apiDesign
**Outputs:** integrations, integrationPlan

---

### Phase 2: Renumbering Map

| Old Step | New Step | Change |
|----------|----------|--------|
| system | 1 | Same |
| step2 | 2 | Same |
| step3 | 3 | Same |
| step4 | 4 | Same |
| step5 | 5 | Same |
| step6 | 6 | Same |
| step7 | 7 | Same |
| step8 | 8 | Same |
| step8b (new) | 9 | NEW |
| step9 | 10 | +1 |
| step10 | 11 | +1 |
| step11 | 12 | +1 |
| step12 | 13 | +1 |
| step25 | 14 | -11 |
| step26 | 15 | -11 |
| step27 | 16 | -11 |
| step28 | 17 | -11 |
| validate_tam_sam_som | 18 | -11 |
| step29 | 19 | -10 |
| step30 | 20 | -10 |
| step31 | 21 | -10 |
| step32 | 22 | -10 |
| step33 | 23 | -10 |
| step34 | 24 | -10 |
| step13 | 25 | +12 |
| step14 | 26 | +12 |
| step15 | 27 | +12 |
| step16 | 28 | +12 |
| step17 | 29 | +12 |
| step18 | 30 | +12 |
| step19 | 31 | +12 |
| step20 | 32 | +12 |
| step21 | 33 | +12 |
| step22 | 34 | +12 |
| step23 | 35 | +12 |
| step24 | 36 | +12 |
| step24b (new) | 37 | NEW |
| step24c (new) | 38 | NEW |
| step35 | 39 | +4 |
| step36 | 40 | +4 |
| step37 | 41 | +4 |
| step38 | 42 | +4 |
| step39 | 43 | +4 |
| step40 | 44 | +4 |
| step49 | 45 | -4 |
| step50 | 46 | -4 |
| step51 | 47 | -4 |
| step52 | 48 | -4 |
| step53 | 49 | -4 |
| step54 | 50 | -4 |
| step55 | 51 | -4 |
| step56 | 52 | -4 |
| step41 | 53 | +12 |
| step42 | 54 | +12 |
| step43 | 55 | +12 |
| step44 | 56 | +12 |
| validate_deck_ask | 57 | +12 |
| step45 | 58 | +13 |
| step46 | 59 | +13 |
| validate_pre_money | 60 | +13 |
| step47 | 61 | +14 |
| step48 | 62 | +14 |
| step57 | 63 | +6 |
| step58 | 64 | +6 |
| step59 | 65 | +6 |

**Total Steps: 65 (added 6 new steps for completeness)**

---

### Phase 3: Files to Create

1. `src/lib/business/models/IdeaModel/step8b.js` - Traction Definition
2. `src/lib/business/models/TechnicalModel/step24b.js` - Timeline Definition
3. `src/lib/business/models/TechnicalModel/step24c.js` - Integrations Definition

---

### Phase 4: Files to Modify

1. `src/lib/business/models/index.js` - Update import order and exports
2. `src/lib/business/variableMapping.js` - Update stepDependencies, stepRequiredVariables, stepOutputVariables
3. `src/lib/business/steps.js` - Update modelCumul

---

### Phase 5: Files to Rename (Step ID updates)

Each step file needs:
1. Update `id` property
2. Update `variables` array if step numbers change
3. Keep same content otherwise

Affected files:
- `IdeaModel/step2.js` → id: "step2" → "step2"
- `BusinessModel/step9.js` → id: "step9" → "step10"
- `MarketingModel/step25.js` → id: "step25" → "step14"
- ... (52 files total)

---

### Phase 6: Database Migration

Create migration script to update:
- `projects.current_step` - map old step IDs to new
- `projects.completed_steps` - adjust count if needed
- `step_data` - keys may need mapping

---

## Implementation Order

1. BACKUP (DONE)
2. Create new step files (step8b, step24b, step24c)
3. Create new models/index.js with new order
4. Create new variableMapping.js with updated dependencies
5. Create batch script to update all step file IDs
6. Test with syntax validation
7. Run data flow verification
8. Create database migration

---

## Rollback Plan

If issues arise:
1. Restore from backup directory
2. Revert database changes
3. No code changes to commit until verified

---

## Success Criteria

- All step syntax validates
- Data flow test passes with 100% coverage
- No missing variable warnings
- Reports generate complete output
- User flow works end-to-end
