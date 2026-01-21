import { createSignal } from 'solid-js';
import { steps, stepNames } from './steps.js';
import { _updateProject } from '../database/projects.js';
import { getStepData, updateStepData } from '../ui/stepDataStore.js';
import { extractTemplateData, injectTemplateData } from '../ui/llm-template.js';
import { logger } from '../core';

export function createStepHook(projectId, onStepChange) {
  const [stepIndex, setStepIndex] = createSignal(0);
  const [uiState, setUiState] = createSignal('idle');
  const [currentResponse, setCurrentResponse] = createSignal(null);
  const [stepData, setStepData] = createSignal({});
  const [isSaving, setIsSaving] = createSignal(false);
  
  const currentStep = () => steps[stepIndex()];
  const isFirst = () => stepIndex() === 0;
  const isLast = () => stepIndex() >= steps.length - 1;
  const isComplete = () => uiState() === 'completed';
  const progress = () => Math.round((stepIndex() / steps.length) * 100);
  const stepName = () => stepNames[currentStep()?.id] || currentStep()?.name || 'Unknown';

  const persist = async (state = uiState()) => {
    if (!projectId) return;
    
    const projectIdString = typeof projectId === 'string' ? projectId : String(projectId);
    
    if (!projectIdString) return;
    
    const currentStepValue = currentStep();
    const stepIndexValue = Number(stepIndex()) || 0;
    const progressValue = Number(progress()) || 0;
    const stepNameValue = String(stepName()) || 'Unknown Step';
    const uiStateValue = typeof state === 'function' ? String(state()) : String(state);
    
    const completeValue = Boolean(isComplete());
    const lastValue = Boolean(isLast());
    
    const uiMessageValue = completeValue 
      ? 'Completed' 
      : lastValue 
        ? 'Final Step' 
        : `Step ${stepIndexValue + 1} of ${steps.length}`;

    const updates = {
      currentStep: String(currentStepValue?.id || 'system'),
      completedSteps: stepIndexValue,
      stepName: stepNameValue,
      uiProgress: progressValue,
      uiStatus: uiStateValue,
      uiMessage: uiMessageValue
    };

    await _updateProject({
      id: projectIdString,
      updates
    });
  };

  const resetStep = async () => {
    setUiState('idle');
    setCurrentResponse(null);
    await persist('idle');
  };

  const resetProject = async () => {
    setStepIndex(0);
    setUiState('idle');
    setCurrentResponse(null);
    await persist('idle');
  };

  const setInstructions = async (instructions) => {
    await persist('idle');
    return instructions;
  };

  const regenerate = async (callLLM, instructions) => {
    setUiState('processing');
    setIsSaving(true);
    try {
      const context = stepData();
      logger.debug('regenerate: stepData context keys:', Object.keys(context));
      logger.debug('regenerate: problem in context:', context?.problem);
      const prompt = buildPrompt(currentStep(), context, instructions);
      logger.debug('regenerate: Built prompt, length:', prompt?.length);
      
      const response = await callLLM(prompt);
      setCurrentResponse(response);

      const extracted = extractTemplateData(response);
      logger.debug('regenerate: Extracted', Object.keys(extracted).length, 'keys from response');

      if (Object.keys(extracted).length > 0) {
        const newData = { ...stepData(), ...extracted };
        setStepData(newData);
        await updateStepData(projectId, extracted);
        logger.debug('regenerate: Saved extracted data to storage');
      }

      setUiState('confirm');
      await persist('confirm');
      logger.debug('regenerate: Step completed, ready for confirmation');
      return response;
    } finally {
      setIsSaving(false);
    }
  };

  const confirm = async (output = currentResponse()) => {
    if (isSaving()) {
      logger.warn('confirm: Blocked - still saving data');
      throw new Error('Please wait while data is being saved');
    }
    
    setUiState('idle');
    setCurrentResponse(null);

    if (!isLast()) {
      setStepIndex(s => s + 1);
      await persist('idle');
      // Reload step data for the new step to ensure we have the latest context
      const freshData = await getStepData(projectId);
      logger.debug('confirm: Reloaded step data for new step, keys:', Object.keys(freshData));
      logger.debug('confirm: problem in fresh data:', freshData?.problem);
      setStepData(freshData);
      if (onStepChange) onStepChange();
    } else {
      setUiState('completed');
      await persist('completed');
    }
  };

  const goToStep = async (index) => {
    if (index >= 0 && index < steps.length) {
      setStepIndex(index);
      setUiState('idle');
      setCurrentResponse(null);
      await persist('idle');
    }
  };

  const loadFromProject = async (project) => {
    if (project?.current_step) {
      const idx = steps.findIndex(s => s.id === project.current_step);
      if (idx >= 0) setStepIndex(idx);
    }
    if (project?.ui_status) {
      setUiState(project.ui_status);
    }
    logger.debug('loadFromProject: Loading step data for projectId:', projectId);
    const data = await getStepData(projectId);
    logger.debug('loadFromProject: Loaded step data keys:', Object.keys(data));
    logger.debug('loadFromProject: problem value:', data?.problem);
    setStepData(data);
  };

  return {
    stepIndex,
    uiState,
    currentResponse,
    setCurrentResponse,
    stepData,
    currentStep,
    isFirst,
    isLast,
    isComplete,
    progress,
    stepName,
    steps,
    stepNames,
    resetStep,
    resetProject,
    setInstructions,
    regenerate,
    confirm,
    goToStep,
    loadFromProject,
    persist,
    isSaving
  };
}

function buildPrompt(step, context, instructions) {
  if (!step) return '';
  
  const mergedContext = { ...context, ...instructions };
  
  if (step.variables && step.variables.length > 0) {
    const missingVars = step.variables.filter(v => {
      const value = mergedContext[v];
      return value === undefined || value === null || value === '';
    });
    
    if (missingVars.length > 0) {
      logger.warn('buildPrompt: Missing required variables for step', step.id, ':', missingVars);
    }
  }
  
  const template = step.promptTemplate(step.detailedPrompt, step.variables);
  return injectTemplateData(template, mergedContext);
}


