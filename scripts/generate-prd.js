#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

function generatePRD() {
  const projectRoot = path.resolve('.');

  // Read package.json for basic info
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  // Get key files (basic listing)
  const keyFiles = [
    'src/App.jsx',
    'src/Home/index.jsx',
    'server.js',
    'db-schema.js'
  ];

  // Basic PRD structure
  const prdContent = `# ${packageJson.name} PRD

## Project Overview
${packageJson.description}

Tech Stack: SolidJS, Node.js, Express, PGLite, Tailwind CSS, DaisyUI
Repository: ${packageJson.repository}

## Existing User Stories
- US-001: Add priority field to database (Priority 1) - Add priority column to tasks table: 'high' | 'medium' | 'low' (default 'medium'), generate migration, typecheck passes.
- US-002: Display priority indicator on task cards (Priority 2) - Colored priority badge on task cards, visible without hover, typecheck passes, browser verify.
- US-003: Add priority selector to task edit (Priority 3) - Priority dropdown in edit modal, saves on change, typecheck passes, browser verify.
- US-004: Filter tasks by priority (Priority 4) - Filter dropdown with All/High/Medium/Low, persists in URL, empty state, typecheck passes, browser verify.

## Inferred User Stories
- US-005: Implement Agent Instruction Functionality (Priority 2) - Custom instructions for AI agent, instruction button, text area, persistence, typecheck, browser verify.
- US-006: Implement Agent Confirmation Functionality (Priority 2) - Confirmation workflows for AI content, accept/retry/edit/reset, feedback to AI, typecheck, browser verify.
- US-007: Task Content Editing (Priority 3) - Edit task content inline, auto-save, history, sync, typecheck, browser verify.
- US-008: Project Progress Visualization (Priority 3) - Progress bar for 51-step process, highlighting, responsive.
- US-009: Offline Mode Enhancement (Priority 4) - Full offline CRUD, sync queue, indicator.
- US-010: Collaborative Project Sharing (Priority 4) - Invite collaborators, permissions, real-time editing.
- US-011: Advanced AI Model Selection (Priority 4) - Model selector, cost/quality options.
- US-012: Credit Usage Analytics (Priority 3) - Usage dashboard, predictions, alerts.
- US-013: Mobile Responsiveness Optimization (Priority 2) - Touch controls, responsive interface, PWA.
- US-014: Error Recovery and Retry Mechanisms (Priority 3) - Auto-retry, backoff, user messages.
- US-015: Data Export and Backup (Priority 4) - Export projects, import, backups.

## Key Files Analyzed
${keyFiles.slice(0, 10).map(f => `- ${f}`).join('\n')}

Edit this PRD to add/modify user stories, then run \`npm run convert-prd\` to generate prd.json.
`;

  fs.writeFileSync('PRD.md', prdContent);
  console.log('PRD.md generated. Edit it to add/modify user stories.');
}

generatePRD();