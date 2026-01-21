// Test script to validate data flow
import { processLLMTemplate, extractKeysFromPrompt } from './llm-template.js';
import { updateStepData, resetStepData, getStepData } from './stepDataStore.js';

async function testDataFlow(projectId = 'test-project') {
  console.log('Testing data flow...');

  // Reset store
  await resetStepData(projectId);

  // Simulate initial data
  await updateStepData(projectId, { problem: 'High legal document review costs' });

  const initialData = await getStepData(projectId);
  console.log('Initial stepData:', initialData);

  // Mock step2 detailedPrompt
  const mockPrompt = `
Analyze the specific problem: {{problem}}.
Provide:
- {{strugglers: "Law firms and small businesses"}}
- {{impactScale: "Affects 50,000 firms"}}
- {{evidence: "Studies show 30% cost reduction possible"}}
`;

  // Process template
  const result = processLLMTemplate(mockPrompt, { problem: 'High legal document review costs' }, {}, async (data) => {
    await updateStepData(projectId, data);
  });

  console.log('Processed template:', result.template);
  console.log('Extracted data:', result.extractedData);

  // Check updated data
  const updatedData = await getStepData(projectId);
  console.log('Updated stepData:', updatedData);

  // Check keys extraction
  const keys = extractKeysFromPrompt(mockPrompt);
  console.log('Extracted keys from prompt:', keys);
}

export { testDataFlow };