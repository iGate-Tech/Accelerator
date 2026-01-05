const { interpret } = require('xstate');
const { startupMachine } = require('./xstate-startup.js');
const fs = require('fs');

const templatableKeys = [
  'problem', 'strugglers', 'alternatives', 'gaps', 'persona', 'urgency', 'evidence', 'solution',
  'valueProp', 'features', 'modelType', 'revenue', 'pricing', 'moat', 'risks', 'economics',
  'revenueLogic', 'costs', 'projections', 'burn', 'breakeven', 'inputs', 'valuation', 'preMoney',
  'investors', 'milestones', 'team', 'hiring', 'advisors', 'entity', 'ip', 'contracts', 'legalRisks',
  'market', 'tam', 'sam', 'som', 'growth', 'channels', 'sales', 'retention', 'gtm', 'landscape', 'valid', 'message'
];

// Real LLM response via app API
async function getLLMResponse(prompt, ctx) {
    const response = await fetch('http://localhost:3000/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.response;
}

function buildMarkdown(obj, path = [], inherited = {}) {
  let md = '';

  if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    const dataKeys = keys.filter(k => !['description', 'status', 'summary', 'sections', 'nodes', 'edges', 'reports', 'lastStepTime', 'currentPrompt', 'llmResponse'].includes(k) && typeof obj[k] !== 'object');
    const childObjects = keys.filter(k => typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k]));

    // Title
    if (path.length === 0) {
      md += '# Startup Development Workflow Results\n\n';
    } else {
      const level = '#'.repeat(path.length + 1);
      const title = path[path.length - 1].replace(/^\w/, c => c.toUpperCase());
      md += `${level} ${title}\n\n`;
    }

    // Data block
    if (dataKeys.length > 0 || obj.description || obj.status) {
      md += '```\n';
      if (obj.description) md += `description: ${obj.description}\n`;
      if (obj.status) md += `status: ${obj.status}\n`;
      if (obj.summary) md += `summary: ${obj.summary}\n`;
      dataKeys.forEach(k => {
        md += `${k}: ${JSON.stringify(obj[k])}\n`;
      });
      md += '```\n\n';
    }

    // Inherited keys
    if (path.length > 0 && Object.keys(inherited).length > 0) {
      md += 'Inherited keys:\n';
      Object.keys(inherited).forEach(k => {
        md += `  ${k}: ${JSON.stringify(inherited[k])}\n`;
      });
      md += '\n';
    }

    // Recurse into children
    childObjects.forEach(k => {
      const newInherited = { ...inherited };
      if (templatableKeys.includes(k)) {
        newInherited[k] = obj[k];
      }
      md += buildMarkdown(obj[k], [...path, k], newInherited);
    });
  }

  return md;
}

const service = interpret(startupMachine).start();

// Run to completion with rate limiting and LLM simulation
let step = 0;
const maxSteps = 100;

async function runSimulation() {
  while (!service.getSnapshot().done && step < maxSteps) {
    console.log(`Step ${step + 1}: ${service.getSnapshot().value}`);

    // Send NEXT to trigger entry actions and fill prompt
    service.send({ type: 'NEXT' });

    const snapshot = service.getSnapshot();
    console.log(`After NEXT: ${snapshot.value}`);

    // Get real LLM response
    console.log('Full Prompt:', snapshot.context.currentPrompt);
    const response = await getLLMResponse(snapshot.context.currentPrompt, snapshot.context);
    console.log('LLM Response:', response);
    global.response = response;

    // Wait for rate limit (simulate 15s delay for 4/min)
    const delay = Math.max(0, 15000 - (Date.now() - snapshot.context.lastStepTime));
    await new Promise(resolve => setTimeout(resolve, delay));

    // Send response
    service.send({ type: 'SET_PENDING_RESPONSE' });
    service.send({ type: 'RECEIVE_RESPONSE' });

    step++;
  }

  // Get final context
  const finalContext = service.getSnapshot().context;

  // Generate Markdown from final context
  const md = buildMarkdown(finalContext);

  // Write reports
  if (finalContext.reports) {
    fs.writeFileSync('pitch-deck.md', finalContext.reports.pitchDeck);
    fs.writeFileSync('business-plan.md', finalContext.reports.businessPlan);
    fs.writeFileSync('valuation.md', finalContext.reports.valuation);
    console.log('Reports written to pitch-deck.md, business-plan.md, valuation.md');
  }

  fs.writeFileSync('workflow-results.md', md);
  console.log('Results written to workflow-results.md');
}

runSimulation();