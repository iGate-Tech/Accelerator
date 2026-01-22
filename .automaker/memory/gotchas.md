---
tags: [gotchas]
summary: gotchas implementation decisions and patterns
relevantTo: [gotchas]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 4
  referenced: 0
  successfulFeatures: 0
---
# gotchas

#### [Gotcha] ESLint revealed critical runtime errors like unreachable code and undefined variables, exposing hidden logic flaws and import issues in the codebase (2026-01-22)
- **Situation:** Performing linting check on a mature codebase with accumulated technical debt
- **Root cause:** Unreachable code typically indicates incomplete conditional logic or dead code paths, while undefined variables often result from missing module imports or variable declaration errors, both of which can cause silent failures or runtime exceptions
- **How to avoid:** Automated linting provides fast, consistent detection but requires ongoing rule maintenance and can produce noise with extensive warnings