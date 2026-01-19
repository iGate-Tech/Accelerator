
import { createStore } from "solid-js/store";
import logger from './logger.js';
import {
  extractTemplateData,
  injectTemplateData,
  mergeTemplateData,
} from "./llm-template.js";
import { steps } from "./machine/steps.js";

// Initial context
export const initialContext = {
  state: 'reset',
  stepIndex: 0,
  context: {},
  instructions: "",
  lastOutput: null,
  validation: { valid: true, issues: [] },
  retryAttempted: false,
};

// Validate data consistency during merge
const validateDataConsistency = (existing, incoming) => {
  const conflicts = Object.keys(incoming).filter(key =>
    existing.hasOwnProperty(key) && existing[key] !== incoming[key]
  ).map(key => ({ key, existing: existing[key], incoming: incoming[key] }));
  if (conflicts.length > 0) {
    logger.warn('Data consistency conflicts detected:', conflicts);
  }
  return conflicts;
};

// Extract data from LLM response
export const extractData = (response) => {
  logger.trace('extractData: Starting with response length:', response?.length);
  const extracted = extractTemplateData(response || "");
  let data = extracted;
  if (extracted.response && typeof extracted.response === "object") {
    data = extracted.response;
  }
  logger.trace('extractData: Completed, extracted keys:', Object.keys(data));
  return data;
};

export const fillPrompt = (template, ctx) => {
  logger.trace('fillPrompt: Starting with template length:', template?.length, 'context keys:', Object.keys(ctx || {}));
  const result = injectTemplateData(template, ctx);
  logger.trace('fillPrompt: Completed, result length:', result?.length);
  return result;
};

export const buildPrompt = (step, context, instructions) => {
  logger.trace('buildPrompt: Starting for step:', step.id);
  const template = step.promptTemplate(step.instructions, step.variables, step.outputKeys);
  const filled = injectTemplateData(template, { ...context, ...instructions });
  logger.trace('buildPrompt: Completed, prompt length:', filled?.length);
  return filled;
};

export const [agentStore, setAgentStore] = createStore(initialContext);

export const resetAgent = () => {
  logger.trace('resetAgent: Starting');
  setAgentStore('state', 'reset');
  setAgentStore('stepIndex', 0);
  setAgentStore('context', {});
  setAgentStore('instructions', '');
  setAgentStore('lastOutput', null);
  setAgentStore('validation', { valid: true, issues: [] });
  logger.debug('resetAgent: Agent reset to initial state');
  logger.trace('resetAgent: Completed');
};

export const enterInstructions = (instructions) => {
  logger.trace('enterInstructions: Starting');
  setAgentStore("state", "instructions");
  setAgentStore("instructions", instructions || "");
  logger.debug('enterInstructions: Instructions set');
  logger.trace('enterInstructions: Completed');
};

export const regenerate = async (callLLM, updateProject, projectId, userId, duration = 0) => {
  try {
    logger.trace('regenerate: Starting for stepIndex:', agentStore.stepIndex);
    setAgentStore("state", "regenerate");
    const currentStep = steps[agentStore.stepIndex];
    if (!currentStep) {
      throw new Error("No current step available");
    }

    const prompt = buildPrompt(currentStep, agentStore.context, agentStore.instructions);
    const response = await callLLM(prompt);

    const extracted = extractData(response);
    setAgentStore("lastOutput", extracted);
    setAgentStore("state", "confirm");

    // Persist
    if (updateProject && projectId) {
      await updateProject(projectId, {
        stepIndex: agentStore.stepIndex,
        context: agentStore.context,
        instructions: agentStore.instructions,
        lastOutput: agentStore.lastOutput,
      });
    }

    logger.debug('regenerate: Completed for step:', currentStep.id);
  } catch (error) {
    logger.error('regenerate: Error', error);
    throw error;
  }
};

export const confirm = async (action, callLLM, updateProject, projectId) => {
  try {
    logger.trace('confirm: Starting with action:', action);
    const currentStep = steps[agentStore.stepIndex];
    if (!currentStep) {
      throw new Error("No current step available");
    }

    if (action === "accept") {
      // Validate
      const validation = currentStep.validate(agentStore.context);
      setAgentStore("validation", validation);

      if (validation.valid) {
        // Merge output to context
        validateDataConsistency(agentStore.context, agentStore.lastOutput);
        setAgentStore("context", (prev) => mergeTemplateData(prev, agentStore.lastOutput));

        // Advance
        if (agentStore.stepIndex < steps.length - 1) {
          setAgentStore("stepIndex", (prev) => prev + 1);
        } else {
          // Completed all steps
          setAgentStore("validation", { valid: true, issues: [], completed: true });
        }
      }
    } else if (action === "retry") {
      await regenerate(callLLM, updateProject, projectId);
    } else if (action === "edit") {
      // Stay in instructions
    } else if (action === "reset") {
      resetAgent();
    }

    // Persist
    if (updateProject && projectId) {
      await updateProject(projectId, {
        stepIndex: agentStore.stepIndex,
        context: agentStore.context,
        validation: agentStore.validation,
      });
    }

    logger.debug('confirm: Completed with action:', action);
  } catch (error) {
    logger.error('confirm: Error', error);
    throw error;
  }
};

// Agent model exports
export { steps, stepNames, modelMap, sectionMap, modelCumul } from './machine/steps.js';

// Backward compatibility aliases
export const machineStore = agentStore;
export const setMachineStore = setAgentStore;
export const stepPrompts = {};
export const extractDataFromTasks = extractData;
export const startProcess = resetAgent;
export const receiveResponse = regenerate; // Placeholder
export const pause = () => {};
export const resume = () => {};
export const reset = resetAgent;
export const resetToPreviousStep = () => {};

// Additional missing exports
export const stepOrder = steps.map(s => s.id);
export const getNextStep = (current) => {
  const index = stepOrder.indexOf(current);
  return stepOrder[index + 1] || null;
};
export const persistableFields = [
  'stepIndex', 'context', 'instructions', 'lastOutput', 'validation'
];

// Utility functions
export const extractFromResponse = extractTemplateData;