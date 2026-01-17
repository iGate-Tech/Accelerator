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
    return newContext;
  });
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
  try {
    if (typeof response === "undefined") {
      throw new Error("Received undefined response from LLM");
    }

  const currentStep = machineStore.context.currentStep;
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
  const updatedTasks = [...(tasksList() || []), newTask];
  setTasksList(updatedTasks);

    if (addTask) {
      await addTask(newTask, projectId, userId);
    }

  const extractedData = extractDataFromTasks(updatedTasks);

  const filteredExtractedData = { ...extractedData };
  if ('consumedCredits' in filteredExtractedData) {
    delete filteredExtractedData.consumedCredits;
  }

  setMachineStore("context", (prev) => {
    const merged = mergeTemplateData(prev, filteredExtractedData);
    return merged;
  });

  const currentConsumedCredits = machineStore.context.consumedCredits || 0;
  const currentConsumedTime = machineStore.context.consumedTime || 0;
  const newConsumedCredits = currentConsumedCredits + 10;
  const newConsumedTime = currentConsumedTime + duration;

  const nextStep = getNextStepFromConfig(machineStore.context.currentStep);

  try {
    validateTransition(machineStore.context.currentStep, nextStep);
  } catch (error) {
    setMachineStore("state", "error");
    setMachineStore("context", (prev) => ({
      ...prev,
      uiStatus: "error",
      uiMessage: `Transition error: ${error.message}`,
    }));
    return;
  }

  if (nextStep === "done") {
    setMachineStore("context", (prev) => ({
      ...prev,
      llmResponse: response || "",
      currentStep: "done",
      completedSteps: prev.completedSteps + 1,
      uiProgress: 100,
      uiStatus: "completed",
      uiMessage: "All 60 steps completed successfully!",
      consumedCredits: newConsumedCredits,
      consumedTime: newConsumedTime,
    }));
  } else {
    setMachineStore("context", (prev) => {
      const isSys = prev.currentStep === "system";
      const newCompletedSteps = isSys ? 1 : prev.completedSteps + 1;
      const progress = Math.min((newCompletedSteps / 63) * 100, 100);
      const message = isSys
        ? "Initialization complete. Starting step 1..."
        : `Step ${newCompletedSteps} complete. Moving to ${stepNames[nextStep] || "next step"}...`;

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
      return newContext;
    });
    if (setAutoProgress) {
      setAutoProgress(true);
    }
  }

  if (updateProject && projectId) {
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
      await updateProject(projectId, updates);
    } catch (error) {
    }
  }
} catch (error) {
    setMachineStore("state", "error");
    setMachineStore("context", (prev) => ({
      ...prev,
      uiStatus: "error",
      uiMessage: `Processing error: ${error.message}`,
    }));
    throw error;
  }
};

export const pause = () => {
  logger.trace('pause: Starting');
  setMachineStore("state", "pause");
  setMachineStore("context", "uiStatus", "paused");
  logger.debug('pause: Machine state set to paused');
  logger.trace('pause: Completed');
};

export const enterChatMode = () => {
  logger.trace('enterChatMode: Starting');
  // Store the current step so we can resume from the same point
  setMachineStore("context", "chatPausedStep", machineStore.context.currentStep);
  setMachineStore("context", "chatPausedStepName", machineStore.context.stepName);
  setMachineStore("state", "chatting");
  setMachineStore("context", "uiStatus", "chatting");
  setMachineStore("context", "uiMessage", "Chat mode - ask questions or give instructions");
  logger.debug('enterChatMode: Machine state set to chatting');
  logger.trace('enterChatMode: Completed');
};

export const exitChatMode = () => {
  logger.trace('exitChatMode: Starting');
  const pausedStep = machineStore.context.chatPausedStep;
  const pausedStepName = machineStore.context.chatPausedStepName;
  
  // Clear chat-specific context
  setMachineStore("context", "chatPausedStep", undefined);
  setMachineStore("context", "chatPausedStepName", undefined);
  setMachineStore("context", "chatMessages", []);
  
  // Resume to processing state
  setMachineStore("state", "processing");
  setMachineStore("context", "uiStatus", "processing");
  setMachineStore("context", "stepName", pausedStepName);
  setMachineStore("context", "currentStep", pausedStep);
  
  // Refill the prompt for the resumed step
  if (pausedStep && pausedStep !== "done") {
    setMachineStore("context", "currentPrompt", fillPrompt(getPromptForStep(pausedStep), machineStore.context));
  }
  
  logger.debug('exitChatMode: Machine state set to processing, resuming from:', pausedStep);
  logger.trace('exitChatMode: Completed');
  return pausedStep;
};

export const addChatMessage = (role, content) => {
  logger.trace('addChatMessage: Adding message from', role);
  const messages = machineStore.context.chatMessages || [];
  const newMessage = {
    id: Date.now().toString(),
    role,
    content,
    timestamp: new Date().toISOString()
  };
  setMachineStore("context", "chatMessages", [...messages, newMessage]);
  logger.debug('addChatMessage: Message added, total messages:', messages.length + 1);
};

export const clearChatMessages = () => {
  logger.trace('clearChatMessages: Starting');
  setMachineStore("context", "chatMessages", []);
  logger.debug('clearChatMessages: Chat messages cleared');
  logger.trace('clearChatMessages: Completed');
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
