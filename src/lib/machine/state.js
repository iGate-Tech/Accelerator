import { createStore } from "solid-js/store";
import logger from '../logger.js';
import {
  extractTemplateData,
  injectTemplateData,
  mergeTemplateData,
} from "../llm-template.js";
import { stepOrder, initialContext, getNextStep } from "./constants.js";
import { stepPrompts } from "./prompts.js";
import { stepNames, modelMap, sectionMap } from "./mappings.js";
import { stepsConfig } from "./stepsConfig.js";

// Validate context data
const validateContext = (context) => {
  const errors = [];

  // Check required fields
  if (!context.currentStep) errors.push('Missing currentStep');
  if (typeof context.completedSteps !== 'number') errors.push('completedSteps must be number');
  if (typeof context.consumedCredits !== 'number') errors.push('consumedCredits must be number');

  // Check step validity
  if (context.currentStep && !stepsConfig.find(s => s.id === context.currentStep) && context.currentStep !== 'done') {
    errors.push(`Invalid currentStep: ${context.currentStep}`);
  }

  // Check progress bounds
  if (context.uiProgress < 0 || context.uiProgress > 100) {
    errors.push(`Invalid uiProgress: ${context.uiProgress}`);
  }

  if (errors.length > 0) {
    logger.error('Context validation errors:', errors);
    return errors;
  }
  return null;
};

// Validate data consistency during merge
const validateDataConsistency = (existing, incoming) => {
  const conflicts = [];
  for (const key in incoming) {
    if (existing.hasOwnProperty(key) && existing[key] !== incoming[key]) {
      conflicts.push({
        key,
        existing: existing[key],
        incoming: incoming[key]
      });
    }
  }
  if (conflicts.length > 0) {
    logger.warn('Data consistency conflicts detected:', conflicts);
    // For now, log warning but allow merge (last write wins)
  }
  return conflicts;
};

// Extract all business data from tasks
export const extractDataFromTasks = (tasks) => {
  logger.trace('extractDataFromTasks: Starting with tasks count:', tasks?.length || 0);
  let context = {};
  for (const task of tasks || []) {
    logger.trace('extractDataFromTasks: Processing task:', task.stepName, 'content length:', task.content?.length);
    const extracted = extractTemplateData(task.content || "");
    let dataToMerge = extracted;
    if (extracted.response && typeof extracted.response === "object") {
      dataToMerge = extracted.response;
    }
    // Validate consistency before merging
    validateDataConsistency(context, dataToMerge);
    context = mergeTemplateData(context, dataToMerge);
    logger.trace('extractDataFromTasks: Merged data, current context keys:', Object.keys(context));
  }
  logger.trace('extractDataFromTasks: Completed, final context keys:', Object.keys(context));
  return context;
};

// Validate state transition
const validateTransition = (currentStep, nextStep) => {
  logger.trace('validateTransition: Checking transition from', currentStep, 'to', nextStep);
  const currentStepConfig = stepsConfig.find((step) => step.id === currentStep);
  if (!currentStepConfig) {
    const error = `Invalid current step: ${currentStep}`;
    logger.error('validateTransition:', error);
    throw new Error(error);
  }
  const expectedNext = currentStepConfig.transitions?.next || "done";
  if (nextStep !== expectedNext) {
    const error = `Invalid transition: expected ${expectedNext}, got ${nextStep}`;
    logger.error('validateTransition:', error);
    throw new Error(error);
  }
  logger.trace('validateTransition: Transition validated successfully');
  return true;
};

// Config-driven next step helper
const getNextStepFromConfig = (currentStep) => {
  logger.trace('getNextStepFromConfig: Starting for step:', currentStep);
  const currentStepConfig = stepsConfig.find((step) => step.id === currentStep);
  if (!currentStepConfig) {
    logger.error('getNextStepFromConfig: No config found for step:', currentStep);
    return "done"; // Fallback
  }
  const nextStep = currentStepConfig?.transitions?.next || "done";
  logger.trace('getNextStepFromConfig: Next step determined as:', nextStep);
  return nextStep;
};

export const fillPrompt = (template, ctx) => {
  logger.trace('fillPrompt: Starting with template length:', template?.length, 'context keys:', Object.keys(ctx || {}));
  const result = injectTemplateData(template, ctx);
  logger.trace('fillPrompt: Completed, result length:', result?.length);
  return result;
};

export const getPromptForStep = (step) => {
  logger.trace('getPromptForStep: Starting for step:', step);
  const prompt = stepPrompts[step] || `Please provide input for ${step}`;
  logger.trace('getPromptForStep: Retrieved prompt length:', prompt?.length);
  return prompt;
};

export const [machineStore, setMachineStore] = createStore({
  state: "idle",
  context: initialContext,
});

export const startProcess = (problem) => {
  console.log(`[${new Date().toISOString()}] startProcess: Starting with problem length: ${problem?.length || 0}`);
  console.log(`[${new Date().toISOString()}] startProcess: Setting machine state to 'processing'`);
  setMachineStore("state", "processing");
  setMachineStore("context", (prev) => {
    const newContext = {
      ...prev,
      problem: problem || prev.problem,
      currentStep: "system",
      stepName: "Initialization",
      currentModel: "System",
      currentSection: "Initialization",
      uiStatus: "processing",
      uiMessage: "Starting initialization...",
      completedSteps: 0,
      currentPrompt: fillPrompt(getPromptForStep("system"), {
        ...prev,
        problem: problem || prev.problem,
      }),
    };
    console.log(`[${new Date().toISOString()}] startProcess: Context updated - currentStep: ${newContext.currentStep}, uiStatus: ${newContext.uiStatus}, promptLength: ${newContext.currentPrompt?.length || 0}`);
    return newContext;
  });
  console.log(`[${new Date().toISOString()}] startProcess: Completed - machine state: ${machineStore.state}`);
};

export const receiveResponse = async (
  response,
  setAutoProgress,
  setTasksList,
  tasksList,
  addTask,
  updateProject,
  projectId,
  userId,
  duration = 0,
) => {
  console.log(`[${new Date().toISOString()}] receiveResponse: START - response length: ${response?.length || 0}, projectId: ${projectId}, userId: ${userId}, duration: ${duration}ms`);
  try {
    if (typeof response === "undefined") {
      console.log(`[${new Date().toISOString()}] receiveResponse: ERROR - undefined response received`);
      throw new Error("Received undefined response from LLM");
    }
    console.log(`[${new Date().toISOString()}] receiveResponse: Response validation passed`);

  // Add the response as a task
  const currentStep = machineStore.context.currentStep;
  console.log(`[${new Date().toISOString()}] receiveResponse: Creating new task for step: ${currentStep}, response length: ${response.length}`);
  const newTask = {
    content: response,
    model: modelMap[currentStep] || "Unknown",
    llm_model: "Llama-3.2-3B-Free",
    section: sectionMap[currentStep] || "Unknown",
    stepName: stepNames[currentStep] || "Unknown",
    step: currentStep,
    prompt: machineStore.context.currentPrompt || "",
    timestamp: new Date().toISOString(),
  };
  console.log(`[${new Date().toISOString()}] receiveResponse: Task created - stepName: ${newTask.stepName}, model: ${newTask.model}, section: ${newTask.section}, contentLength: ${newTask.content.length}`);
  const updatedTasks = [...(tasksList() || []), newTask];
  console.log(`[${new Date().toISOString()}] receiveResponse: Updated tasks list - previous count: ${(tasksList() || []).length}, new count: ${updatedTasks.length}`);
  setTasksList(updatedTasks);
  console.log(`[${new Date().toISOString()}] receiveResponse: setTasksList called`);

    if (addTask) {
      console.log(`[${new Date().toISOString()}] receiveResponse: Calling addTask with userId: ${userId}, projectId: ${projectId}`);
      await addTask(newTask, projectId, userId);
      console.log(`[${new Date().toISOString()}] receiveResponse: addTask completed successfully`);
    } else {
      console.log(`[${new Date().toISOString()}] receiveResponse: addTask not provided, skipping database save`);
    }

  // Extract and merge data from all tasks into context
  console.log(`[${new Date().toISOString()}] receiveResponse: Extracting data from ${updatedTasks.length} tasks`);
  const extractedData = extractDataFromTasks(updatedTasks);
  console.log(`[${new Date().toISOString()}] receiveResponse: Extracted data keys: ${Object.keys(extractedData).slice(0, 10).join(', ')}${Object.keys(extractedData).length > 10 ? '...' : ''}`);

  // Filter out consumedCredits from extracted data to prevent overriding numeric values
  const filteredExtractedData = { ...extractedData };
  if ('consumedCredits' in filteredExtractedData) {
    console.log(`[${new Date().toISOString()}] receiveResponse: Filtering out consumedCredits from extracted data to preserve numeric value`);
    delete filteredExtractedData.consumedCredits;
  }

  setMachineStore("context", (prev) => {
    const merged = mergeTemplateData(prev, filteredExtractedData);

    // Validate new context
    const validationErrors = validateContext(merged);
    if (validationErrors) {
      console.error(`[${new Date().toISOString()}] receiveResponse: Context validation failed:`, validationErrors);
      // Continue but log error - don't block process
    }

    return merged;
  });

  // Accumulate stats
  const currentConsumedCredits = machineStore.context.consumedCredits || 0;
  const currentConsumedTime = machineStore.context.consumedTime || 0;
  console.log(`[${new Date().toISOString()}] receiveResponse: Current context consumedCredits: ${machineStore.context.consumedCredits} (type: ${typeof machineStore.context.consumedCredits})`);
  const newConsumedCredits = currentConsumedCredits + 10; // 10 credits per call
  const newConsumedTime = currentConsumedTime + duration;
  console.log(`[${new Date().toISOString()}] receiveResponse: Updated stats - credits: ${currentConsumedCredits} -> ${newConsumedCredits}, time: ${currentConsumedTime}ms -> ${newConsumedTime}ms`);

  console.log(`[${new Date().toISOString()}] receiveResponse: Determining next step from current step: ${machineStore.context.currentStep}`);
  const nextStep = getNextStepFromConfig(machineStore.context.currentStep);
  console.log(`[${new Date().toISOString()}] receiveResponse: Next step determined: ${nextStep}`);

  // Validate transition
  try {
    console.log(`[${new Date().toISOString()}] receiveResponse: Validating transition from ${machineStore.context.currentStep} to ${nextStep}`);
    validateTransition(machineStore.context.currentStep, nextStep);
    console.log(`[${new Date().toISOString()}] receiveResponse: Transition validation passed`);
  } catch (error) {
    console.log(`[${new Date().toISOString()}] receiveResponse: Transition validation failed - ${error.message}`);
    // Set error state and stop process
    setMachineStore("state", "error");
    setMachineStore("context", (prev) => ({
      ...prev,
      uiStatus: "error",
      uiMessage: `Transition error: ${error.message}`,
    }));
    console.log(`[${new Date().toISOString()}] receiveResponse: Set machine to error state`);
    return;
  }

  if (nextStep === "done") {
    console.log(`[${new Date().toISOString()}] receiveResponse: PROCESS COMPLETED! All 51 steps done.`);
    setMachineStore("context", (prev) => ({
      ...prev,
      llmResponse: response || "",
      currentStep: "done",
      completedSteps: prev.completedSteps + 1,
      uiProgress: 100,
      uiStatus: "completed",
      uiMessage: "🎉 All 51 steps completed successfully!",
      consumedCredits: newConsumedCredits,
      consumedTime: newConsumedTime,
    }));
    console.log(`[${new Date().toISOString()}] receiveResponse: Set final context - completedSteps: ${machineStore.context.completedSteps + 1}, uiProgress: 100`);
  } else {
    console.log(`[${new Date().toISOString()}] receiveResponse: Transitioning to next step: ${nextStep}`);
    setMachineStore("context", (prev) => {
      const isSys = prev.currentStep === "system";
      const newCompletedSteps = isSys ? 1 : prev.completedSteps + 1;
      const progress = Math.min((newCompletedSteps / 51) * 100, 100);
      const message = isSys
        ? "Initialization complete. Starting step 1..."
        : `Step ${newCompletedSteps} complete. Moving to ${stepNames[nextStep] || "next step"}...`;

      console.log(`[${new Date().toISOString()}] receiveResponse: Preparing next context - isSys: ${isSys}, newCompletedSteps: ${newCompletedSteps}, progress: ${progress}%`);

      const newContext = {
        ...prev,
        llmResponse: response || "",
        currentStep: nextStep,
        stepName: stepNames[nextStep] || "Next Step",
        currentModel: modelMap[nextStep] || "System",
        currentSection: sectionMap[nextStep] || "Initialization",
        completedSteps: newCompletedSteps,
        uiProgress: Math.floor(progress),
        uiMessage: message,
        currentPrompt: fillPrompt(
          getPromptForStep(nextStep),
          mergeTemplateData(prev, filteredExtractedData),
        ),
        consumedCredits: newConsumedCredits,
        consumedTime: newConsumedTime,
      };
      console.log(`[${new Date().toISOString()}] receiveResponse: Next context prepared - currentStep: ${newContext.currentStep}, completedSteps: ${newContext.completedSteps}, uiProgress: ${newContext.uiProgress}%`);
      return newContext;
    });
    if (setAutoProgress) {
      logger.trace('Machine: setting auto progress');
      setAutoProgress(true);
    }
  }

  // Update project in database after each task completion
  if (updateProject && projectId) {
    console.log(`[${new Date().toISOString()}] receiveResponse: Updating project in database - projectId: ${projectId}, currentStep: ${machineStore.context.currentStep}`);
    try {
      const updates = {
        currentStep: machineStore.context.currentStep,
        completedSteps: machineStore.context.completedSteps,
        stepName: machineStore.context.stepName,
        currentModel: machineStore.context.currentModel,
        currentSection: machineStore.context.currentSection,
        uiProgress: machineStore.context.uiProgress,
        uiMessage: machineStore.context.uiMessage,
        uiStatus: machineStore.context.uiStatus,
        currentPrompt: machineStore.context.currentPrompt,
        llmResponse: machineStore.context.llmResponse,
        totalCredits: machineStore.context.totalCredits,
        consumedCredits: machineStore.context.consumedCredits,
        totalTime: machineStore.context.totalTime,
        consumedTime: machineStore.context.consumedTime,
      };
      logger.debug('Machine: project update data prepared');
      await updateProject(projectId, updates);
      console.log(`[${new Date().toISOString()}] receiveResponse: Project updated successfully in database`);
    } catch (error) {
      console.log(`[${new Date().toISOString()}] receiveResponse: Failed to update project - ${error.message}`);
    }
  }
  console.log(`[${new Date().toISOString()}] receiveResponse: COMPLETED - currentStep: ${machineStore.context.currentStep}, completedSteps: ${machineStore.context.completedSteps}`);
} catch (error) {
    console.log(`[${new Date().toISOString()}] receiveResponse: CRITICAL ERROR - ${error.message}`);
    console.log(`[${new Date().toISOString()}] receiveResponse: Setting machine to error state`);
    // Set error state
    setMachineStore("state", "error");
    setMachineStore("context", (prev) => ({
      ...prev,
      uiStatus: "error",
      uiMessage: `Processing error: ${error.message}`,
    }));
    console.log(`[${new Date().toISOString()}] receiveResponse: Error state set, re-throwing error`);
    throw error; // Re-throw to allow caller to handle
  }
};

export const pause = () => {
  logger.trace('pause: Starting');
  setMachineStore("state", "pause");
  setMachineStore("context", "uiStatus", "paused");
  logger.debug('pause: Machine state set to paused');
  logger.trace('pause: Completed');
};

export const resume = () => {
  logger.trace('resume: Starting');
  if (machineStore.state !== 'pause') {
    logger.debug('resume: Not paused, skipping resume');
    return;
  }
  setMachineStore("state", "processing");
  setMachineStore("context", "uiStatus", "processing");
  logger.debug('resume: Machine state set to processing');

  // Refill currentPrompt with updated context after resume
  const currentStep = machineStore.context.currentStep;
  logger.debug('resume: Refilling prompt for current step:', currentStep);
  if (currentStep && currentStep !== "done") {
    setMachineStore("context", "currentPrompt", fillPrompt(getPromptForStep(currentStep), machineStore.context));
    logger.debug('resume: Prompt refilled');
  } else {
    logger.debug('resume: Skipping prompt refill - step is done or invalid');
  }
  logger.trace('resume: Completed');
};

export const resetToPreviousStep = () => {
  logger.trace('resetToPreviousStep: Starting');
  const currentStep = machineStore.context.currentStep;
  const currentCompleted = machineStore.context.completedSteps;

  // Find previous step
  const currentIndex = stepsConfig.findIndex(s => s.id === currentStep);
  if (currentIndex > 0) {
    const prevStep = stepsConfig[currentIndex - 1];
    setMachineStore("context", (prev) => ({
      ...prev,
      currentStep: prevStep.id,
      stepName: prevStep.name,
      currentModel: prevStep.model,
      currentSection: prevStep.section,
      completedSteps: Math.max(0, currentCompleted - 1),
      uiStatus: "processing",
      uiMessage: `Reset to ${prevStep.name}`,
      currentPrompt: fillPrompt(getPromptForStep(prevStep.id), prev),
    }));
    logger.debug('resetToPreviousStep: Reset to step:', prevStep.id);
  } else {
    logger.warn('resetToPreviousStep: No previous step available');
  }
  logger.trace('resetToPreviousStep: Completed');
};

export const reset = () => {
  logger.trace('reset: Starting');
  setMachineStore("state", "idle");
  setMachineStore("context", initialContext);
  logger.debug('reset: Machine state and context reset to initial');
  logger.trace('reset: Completed');
};
