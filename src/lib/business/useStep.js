import { createSignal } from 'solid-js';
import { steps, stepNames } from './steps.js';
import { _updateProject } from '../database/projects.js';
import { getStepData, updateStepData } from '../ui/stepDataStore.js';
import { extractTemplateData, injectTemplateData } from '../ui/llm-template.js';
import { standardPromptTemplateWithProblem } from './templates.js';
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

  const initializeData = async () => {
    try {
      const data = await getStepData(projectId);
      const dataWithProblem = {
        ...data,
        problem: data.problem || data.originalProblem,
        originalProblem: data.originalProblem
      };
      console.log('createStepHook: Initial data loaded for project', projectId, ':', Object.keys(dataWithProblem));
      console.log('createStepHook: problem in initial data:', dataWithProblem.problem?.substring(0, 50) + '...');
      setStepData(dataWithProblem);
    } catch (e) {
      console.warn('createStepHook: Failed to load initial data:', e);
    }
  };
  initializeData();

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
    const uiMessageValue = completeValue ? 'Completed' : lastValue ? 'Final Step' : `Step ${stepIndexValue + 1} of ${steps.length}`;
    const updates = {
      currentStep: String(currentStepValue?.id || 'system'),
      completedSteps: stepIndexValue,
      stepName: stepNameValue,
      uiProgress: progressValue,
      uiStatus: uiStateValue,
      uiMessage: uiMessageValue
    };
    await _updateProject({ id: projectIdString, updates });
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
      console.log('regenerate: Current stepData keys:', Object.keys(context));
      console.log('regenerate: problem in context:', context?.problem?.substring(0, 50) + '...');
      
      const contextWithProblem = {
        ...context,
        problem: context?.problem || context?.originalProblem || instructions?.problem || ''
      };
      
      logger.debug('regenerate: stepData context keys:', Object.keys(contextWithProblem));
      logger.debug('regenerate: problem in context:', contextWithProblem?.problem);
      console.log('regenerate: Current stepData:', JSON.stringify(contextWithProblem, null, 2));
      
      const prompt = buildPrompt(currentStep(), contextWithProblem, instructions);
      logger.debug('regenerate: Built prompt, length:', prompt?.length);
      
      const response = await callLLM(prompt);
      setCurrentResponse(response);

      const extracted = extractTemplateData(response);
      console.log('regenerate: Extracted data from response:', JSON.stringify(extracted, null, 2));
      logger.debug('regenerate: Extracted', Object.keys(extracted).length, 'keys from response');

      if (Object.keys(extracted).length > 0) {
        const problem = contextWithProblem.problem || contextWithProblem.originalProblem || '';
        const validatedExtracted = validateExtractedData(extracted, problem);
        
        if (Object.keys(validatedExtracted).length === 0) {
          console.warn('regenerate: All extracted data was off-topic, preserving existing data');
        }
        
        const dataToSave = {
          ...validatedExtracted,
          problem: validatedExtracted.problem || contextWithProblem.problem,
          originalProblem: contextWithProblem.originalProblem || contextWithProblem.problem
        };
        const newData = { ...stepData(), ...dataToSave };
        console.log('regenerate: Merged data to save:', JSON.stringify(newData, null, 2));
        setStepData(newData);
        await updateStepData(projectId, dataToSave);
        logger.debug('regenerate: Saved extracted data to storage');
      } else {
        console.log('regenerate: No data extracted from response, preserving existing stepData');
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
      const freshData = await getStepData(projectId);
      const dataWithProblem = {
        ...freshData,
        problem: freshData.problem || freshData.originalProblem,
        originalProblem: freshData.originalProblem
      };
      console.log('confirm: Reloaded step data for new step, keys:', Object.keys(dataWithProblem));
      console.log('confirm: problem in fresh data:', dataWithProblem.problem?.substring(0, 50) + '...');
      console.log('confirm: All data:', JSON.stringify(dataWithProblem, null, 2));
      setStepData(dataWithProblem);
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
    } else if (project?.completedSteps !== undefined) {
      // Set to the next step after completed ones (don't restart from beginning)
      const nextStepIndex = Math.min(project.completedSteps, steps.length - 1);
      console.log('loadFromProject: Setting step index to next step after completed:', nextStepIndex);
      setStepIndex(nextStepIndex);
    }
    if (project?.ui_status) {
      setUiState(project.ui_status);
    }
    logger.debug('loadFromProject: Loading step data for projectId:', projectId);
    const data = await getStepData(projectId);
    const dataWithProblem = {
      ...data,
      problem: data.problem || data.originalProblem || project.description,
      originalProblem: data.originalProblem || project.description
    };
    console.log('loadFromProject: Loaded step data for project', projectId, ':', JSON.stringify(dataWithProblem, null, 2));
    logger.debug('loadFromProject: Loaded step data keys:', Object.keys(dataWithProblem));
    logger.debug('loadFromProject: problem value:', dataWithProblem?.problem?.substring(0, 50) + '...');
    setStepData(dataWithProblem);
  };

  const refreshStepData = async () => {
    console.log('refreshStepData: Refreshing data for project', projectId);
    const data = await getStepData(projectId);
    const dataWithProblem = {
      ...data,
      problem: data.problem || data.originalProblem,
      originalProblem: data.originalProblem
    };
    console.log('refreshStepData: Fresh data:', JSON.stringify(dataWithProblem, null, 2));
    setStepData(dataWithProblem);
    return dataWithProblem;
  };

  return {
    stepIndex,
    uiState,
    currentResponse,
    setCurrentResponse,
    stepData,
    setStepData,
    refreshStepData,
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
  
  const mergedContext = { 
    ...context, 
    ...instructions,
    problem: instructions?.problem || context?.problem || context?.originalProblem || ''
  };
  
  if (step.variables && step.variables.length > 0) {
    const missingVars = step.variables.filter(v => {
      const value = mergedContext[v];
      return value === undefined || value === null || value === '';
    });
    
    if (missingVars.length > 0) {
      logger.warn('buildPrompt: Missing required variables for step', step.id, ':', missingVars);
      console.warn('buildPrompt: Missing variables for step', step.id, ':', missingVars);
      console.warn('buildPrompt: Available context keys:', Object.keys(mergedContext));
      console.warn('buildPrompt: context.problem:', mergedContext.problem?.substring(0, 50) + '...');
    }
  }
  
  const problemStatement = mergedContext.problem || mergedContext.originalProblem || '';
  const promptContent = step.detailedPrompt || step.instructions || '';
  const baseTemplate = step.promptTemplate(promptContent, step.variables, problemStatement);
  const result = injectTemplateData(baseTemplate, mergedContext);
  
  if (step.variables?.includes('problem')) {
    console.log('buildPrompt: Step', step.id, 'needs problem, context has:', mergedContext.problem?.substring(0, 50) + '...');
  }
  
  return result;
}

function validateExtractedData(extracted, problemStatement) {
  if (!problemStatement || problemStatement.trim() === '') {
    console.log('validateExtractedData: No problem statement to validate against');
    return extracted;
  }
  
  const validated = {};
  const problemLower = problemStatement.toLowerCase();
  
  const problemWords = problemLower
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  console.log('validateExtractedData: Problem keywords:', problemWords.slice(0, 10));
  
  for (const [key, value] of Object.entries(extracted)) {
    if (typeof value === 'string' && value.trim() !== '') {
      const valueLower = value.toLowerCase();
      const hasRelevantContent = problemWords.some(word => valueLower.includes(word));
      
      const genericOffTopicPatterns = [
        'http://', 'https://', 'www.',
        '{{', '}}',
        'null', 'undefined',
      ];
      
      const hasOffTopicPattern = genericOffTopicPatterns.some(pattern => valueLower.includes(pattern));
      const isLikelyPlaceholder = value.length < 10 && !hasRelevantContent;
      
      if (!hasRelevantContent && !isLikelyPlaceholder) {
        console.warn(`validateExtractedData: Key "${key}" may be off-topic:`, value.substring(0, 80));
        console.warn(`validateExtractedData: Problem keywords found:`, problemWords.slice(0, 5));
        validated[key] = value;
        validated[key + '_needsReview'] = true;
      } else {
        validated[key] = value;
      }
    }
  }
  
  const inputKeys = Object.keys(extracted);
  const outputKeys = Object.keys(validated).filter(k => !k.endsWith('_needsReview'));
  console.log(`validateExtractedData: Input: ${inputKeys.length} keys, Output: ${outputKeys.length} keys`);
  
  return validated;
}
