import {
    createSignal,
    For,
    createResource,
    onMount,
    onCleanup,
    createEffect,
    Show,
    createMemo
} from "solid-js";
import logger from "../../lib/logger.js";
import {
    machineStore,
    startProcess,
    receiveResponse,
    pause,
    resume,
    reset,
    modelCumul,
    stepOrder,
    getNextStep,
    modelMap,
    sectionMap,
    persistableFields,
    extractDataFromTasks,
    stepNames,
    stepPrompts,
    fillPrompt,
    initialContext
} from "../../lib/machine";
import {
    getTasks,
    addTask,
    clearAllTasks,
    updateTask,
    addProject,
    updateProject,
    getProjectByName,
    getProjectById,
    getProjects,
    consumeCredits,
    getCreditBalance,
    updateEntity,
    getUserProfile
} from "../../lib/db";
import { useUser } from "../../context/UserContext";
import { toastManager } from "../../lib/feedback";
import { useActivityLogger } from "../../lib/activity";
import { handleLLMProjectUpdate, extractProjectName, handleQuickLLMCall, streamQuickLLMCall } from "../../lib/utils";
import {setMachineStore} from "../../lib/machine";
import {marked} from 'marked';
import { confirmReset } from "../../components/ui/GlobalConfirm";
import {renderFilledTemplate} from '../../lib/llm-template';
import { validateLLMPrompt } from '../../lib/security';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import ResponseSection from '../../components/ui/ResponseSection';
import AgentInterface from '../../components/features/home/AgentInterface';
import RouteGuard from '../../components/common/RouteGuard';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { useContext } from "solid-js";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";

// Generate prompt to step name mapping dynamically
const promptToStepName = Object.fromEntries(
  Object.entries(stepPrompts).map(([key, prompt]) => [
    prompt.split('\n')[0].trim(),
    stepNames[key]
  ])
);

const getStepName = (task) => {
  logger.trace('getStepName: Starting');
    for (let key in promptToStepName) {
        if (task.prompt && task.prompt.includes(key)) {
            return promptToStepName[key];
        }
    }
    return "Unknown Step";
};

const TasksContent = () => {
    const { lang } = useContext(LangContext);
    const { user } = useUser();
    const activityLogger = useActivityLogger();
    const [currentLang, setCurrentLang] = createSignal(lang());

    const t = () => translations[currentLang()];

    createEffect(() => {
        setCurrentLang(lang());
    });

    const [currentProjectId, setCurrentProjectId] = createSignal(null);
    const [prompt, setPrompt] = createSignal("");

    // Save selected project to user profile
    createEffect(() => {
      const pid = currentProjectId();
      if (pid && user()?.id) {
        updateEntity({ table: 'profiles', idField: 'user_id', id: user().id, updates: { current_project_id: pid } });
      }
    });

    // Refs
    let cardRef;

    // Accordion state
    const [isAccordionOpen, setIsAccordionOpen] = createSignal(false);

    // Additional signals
    const [isLoading, setIsLoading] = createSignal(false);
    const [autoProgress, setAutoProgress] = createSignal(false);
    const [startPressed, setStartPressed] = createSignal(false);
    const [streamingContent, setStreamingContent] = createSignal("");
    const [tasksList, setTasksList] = createSignal([]);
    const [editingTaskId, setEditingTaskId] = createSignal(null);
    const [editContent, setEditContent] = createSignal("");
    const [activeCardId, setActiveCardId] = createSignal(null);

    // Project data signal
    const [projectData, setProjectData] = createSignal(null);

    // Tasks resource
    const [tasks] = createResource(currentProjectId, async (projectId) => {
        if (!projectId) return [];
        try {
            const result = await getTasks(projectId);
            return result || [];
        } catch (error) {
            logger.error('Error loading tasks:', error);
            return [];
        }
    });

    // Projects list resource (for state restoration)
    const [projects] = createResource(
        () => user()?.id,
        async (userId) => {
            if (!userId) return [];
            try {
                const result = await getProjects(userId);
                return result || [];
            } catch (error) {
                logger.error('Error loading projects:', error);
                return [];
            }
        }
    );

    // Agent interface class names
    const agentBoxClass = createMemo(() => {
        const hasProject = currentProjectId() !== null;
        const isActive = hasProject && (startPressed() || (tasksList() && tasksList().length > 0 && machineStore.context?.currentStep !== 'done'));
        const base = isActive ? "w-full max-w-4xl mx-auto" : "w-full max-w-4xl mx-auto";
        const expanded = ""; // Removed to prevent height issues
        return `${base} ${expanded}`.trim();
    });

    const agentContentClass = createMemo(() => {
        return "flex flex-col gap-4 w-full";
    });

    const greetingClass = createMemo(() => {
        return "text-center mb-8 fade-in";
    });

    // Refs
    let streamingRef;
    let taskRefs = {};
    let textareaRef;

    // Handler functions
    const handleImprove = async () => {
      if (!user()?.id) {
        toastManager.error('Please log in to use AI features');
        return;
      }
      
      const improvedPrompt = `Improve this startup idea for better clarity, specificity, and market potential. Start with the improved idea name followed by ': ' and then provide a concise description in simple English, in only 3 lines. Do not generate in markdown: ${prompt()}`;
      
      setIsLoading(true);
      setActiveCardId('streaming');
      setStreamingContent('');
      
      try {
        const improvedText = await streamQuickLLMCall(
          improvedPrompt,
          user()?.id,
          (chunk) => {
            setStreamingContent(chunk);
          }
        );
        
        setPrompt(improvedText);
        
        if (currentProjectId()) {
          const colonIndex = improvedText.indexOf(': ');
          let name = '', description = improvedText;
          if (colonIndex !== -1) {
            name = improvedText.substring(0, colonIndex).trim();
            description = improvedText.substring(colonIndex + 2).trim();
          }
          await updateProject(currentProjectId(), { name, description });
          window.dispatchEvent(new CustomEvent('projectUpdated'));
        }
        
        setIsLoading(false);
        setActiveCardId(null);
        setStreamingContent('');
        toastManager.success('Project improved successfully!');
      } catch (error) {
        setIsLoading(false);
        setActiveCardId(null);
        setStreamingContent('');
        logger.error('Improve error:', error);
        toastManager.error('Failed to improve project: ' + error.message);
      }
    };
    const handleSuggest = async () => {
      if (!user()?.id) {
        toastManager.error('Please log in to use AI features');
        return;
      }
      
      logger.info('Starting AI suggestion process for prompt:', prompt().substring(0, 50) + '...');
      const suggestPrompt = `Suggest a compelling startup idea in the legal tech space. Start with the idea name followed by ': ' and then provide a brief description, target market, and unique value proposition in simple English, in only 3 lines. Do not generate in markdown.`;
      
      setIsLoading(true);
      setActiveCardId('streaming');
      setStreamingContent('');
      
      try {
        const suggestedText = await streamQuickLLMCall(
          suggestPrompt,
          user()?.id,
          (chunk) => {
            setStreamingContent(chunk);
          }
        );
        
        logger.info('AI suggestion received:', suggestedText.substring(0, 100) + '...');
        setPrompt(suggestedText);
        
        const projectName = suggestedText.length > 50 ? suggestedText.substring(0, 50) + '...' : suggestedText;
        const projectId = await addProject({
          name: projectName,
          description: suggestedText,
          createdAt: new Date()
        });
        setCurrentProjectId(projectId);
        
        setIsLoading(false);
        setActiveCardId(null);
        setStreamingContent('');
        
        logger.info('Project created from AI suggestion, ID:', projectId);
        toastManager.success('New project created with AI suggestion!');
      } catch (error) {
        setIsLoading(false);
        setActiveCardId(null);
        setStreamingContent('');
        logger.error('AI suggestion process failed:', error.message);
        toastManager.error('Failed to get AI suggestion: ' + error.message);
      }
    };
      const handleReset = async () => {
        const confirmed = await confirmReset(t().resetAgent, "All current progress and tasks will be cleared.", "This action cannot be undone.");
        if (confirmed) {
          setCurrentProjectId(null);
          setPrompt('');
          setTasksList([]);
          setStreamingContent("");
          setMachineStore('context', initialContext);
          setMachineStore('state', 'idle');
          toastManager.success(t().resetSuccessful);
        }
      };

      const processLLMResponse = async (responseText, stepDuration = 1000) => {
        await receiveResponse(
          responseText,
          setAutoProgress,
          setTasksList,
          tasksList,
          addTask,
          updateProject,
          currentProjectId(),
          user()?.id,
          stepDuration
        );

        if (machineStore.context.currentStep === 'done') {
          setMachineStore('state', 'completed');
          setIsLoading(false);
          toastManager.success('All 51 steps completed successfully!');
          return false;
        }

        return true;
      };

      const callLLMForStep = async (prompt, isFirstStep = false) => {
        if (user()?.id) {
          const balance = await getCreditBalance(user().id);
          if (balance < 10) {
            toastManager.error('Insufficient credits. Need at least 10 credits to continue.');
            setStartPressed(false);
            setIsLoading(false);
            setMachineStore('state', 'idle');
            return false;
          }
        }

        setStreamingContent("");
        const response = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
          throw new Error(`LLM API error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let responseText = '';
        let chunkCount = 0;
        const startTime = Date.now();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          chunkCount++;
          responseText += chunk;
          setStreamingContent(responseText);
        }

        if (user()?.id) {
          await consumeCredits(user().id, 10, `Step: ${machineStore.context.stepName}`);
        }

        return responseText;
      };

      const runNextStep = async () => {
        const currentState = machineStore.state;
        const currentUiStatus = machineStore.context?.uiStatus;

        if (currentState === 'pause' || currentUiStatus === 'paused') {
          logger.info('Process is paused, skipping next step');
          setIsLoading(false);
          return;
        }

        const currentStep = machineStore.context.currentStep;
        if (currentStep === 'done') {
          setMachineStore('state', 'completed');
          setMachineStore('context', 'uiStatus', 'completed');
          setIsLoading(false);
          return;
        }

        const prompt = machineStore.context.currentPrompt;
        if (!prompt) {
          logger.error('No prompt available for current step');
          setIsLoading(false);
          return;
        }

        try {
          const responseText = await callLLMForStep(prompt);
          if (responseText && responseText.trim().length > 0) {
            const shouldContinue = await processLLMResponse(responseText);
            if (shouldContinue && autoProgress()) {
              setTimeout(() => runNextStep(), 500);
            } else if (!autoProgress()) {
              setIsLoading(false);
            }
          } else {
            logger.warn('Empty response from LLM, skipping to next step');
            await processLLMResponse('No response generated.');
            if (autoProgress()) {
              setTimeout(() => runNextStep(), 500);
            } else {
              setIsLoading(false);
            }
          }
        } catch (error) {
          logger.error('LLM call error:', error);
          toastManager.error(`Failed to get response: ${error.message}`);
          setIsLoading(false);
          setMachineStore('state', 'error');
          setMachineStore('context', 'uiStatus', 'error');
        }
      };

      const handleStart = async () => {
        if (!prompt() || prompt().trim().length < 5) {
          toastManager.error('Please enter a valid startup idea (at least 5 characters)');
          return;
        }

        logger.info('Starting AI agent process');
        setStartPressed(true);
        setIsLoading(true);
        setAutoProgress(true);
        setStreamingContent("");

        try {
          startProcess(prompt());
          setMachineStore('state', 'processing');
          setMachineStore('context', 'uiStatus', 'processing');
          logger.info('Process started, running first step...');
          await runNextStep();
        } catch (error) {
          logger.error('Start process error:', error);
          toastManager.error('Failed to start process');
          setStartPressed(false);
          setIsLoading(false);
          setMachineStore('state', 'error');
          setMachineStore('context', 'uiStatus', 'error');
        }
      };

      const handlePause = () => {
        if (machineStore.state !== 'processing') return;
        
        logger.info('Pausing AI agent process');
        setMachineStore('state', 'pause');
        setMachineStore('context', 'uiStatus', 'paused');
        setAutoProgress(false);
        toastManager.info('Process paused');
      };

      const handleResume = async () => {
        if (machineStore.state !== 'pause') return;
        
        logger.info('Resuming AI agent process');
        setMachineStore('state', 'processing');
        setMachineStore('context', 'uiStatus', 'processing');
        setAutoProgress(true);
        setIsLoading(true);
        toastManager.success('Process resumed');
        await runNextStep();
      };
      
      const onProjectDeleted = (e) => {
        if (currentProjectId() === e.detail.projectId) {
          setCurrentProjectId(null);
          setPrompt('');
          setTasksList([]);
          setMachineStore('context', initialContext);
        }
      };
      
      const onResetAgent = () => {
        handleReset();
      };
      
      const onOpenProject = (e) => {
        const pid = e.detail;
        if (currentProjectId() === pid) {
          return;
        }
        updateEntity({ table: 'profiles', idField: 'user_id', id: user().id, updates: { current_project_id: pid } });
        setCurrentProjectId(pid);
      };

      onMount(() => {
          window.addEventListener('projectDeleted', onProjectDeleted);
          window.addEventListener('resetAgent', onResetAgent);
          window.addEventListener('openProject', onOpenProject);

           // Create Lucide icons after a delay to ensure script loaded
           setTimeout(() => {
               if (window.lucide)
                   window.lucide.createIcons();
           }, 100);

           // Load selected project from user profile
           if (user()?.id) {
             getUserProfile(user().id).then(profile => {
               if (profile?.current_project_id) {
                 setCurrentProjectId(profile.current_project_id);
               }
             });
           }
       });

       onCleanup(() => {
           window.removeEventListener('projectDeleted', onProjectDeleted);
           window.removeEventListener('resetAgent', onResetAgent);
           window.removeEventListener('openProject', onOpenProject);
       });

        // Set tasksList when project changes
       createEffect(() => {
           currentProjectId();
           if (Array.isArray(tasks())) {
               setTasksList(tasks());
           }
       });

     createEffect(() => {
         if (cardRef) {
             let animationId;
             let startTime = Date.now();

             const animate = () => {
                 const elapsed = Date.now() - startTime;
                 const t = elapsed * 0.001;

                 const x = Math.sin(t * 0.2) * 15;
                 const y = Math.sin(t * 0.1) * 12;
                 const blur = 25 + Math.sin(t * 0.3) * 15;
                 const spread = Math.sin(t * 0.15) * 5;

                 const hue = (t * 20) % 360;
                 const color = `hsla(${hue}, 40%, 60%, 0.4)`;

                 cardRef.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;

                 animationId = requestAnimationFrame(animate);
             };

             const timeoutId = setTimeout(() => {
                 animationId = requestAnimationFrame(animate);
             }, 1000);

             onCleanup(() => {
                 cancelAnimationFrame(animationId);
                 clearTimeout(timeoutId);
             });
         }
     });

    // Save progress to current project when context changes (debounced)
    let saveTimeout;
    createEffect(() => {
      machineStore.context; // trigger on change
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        if (currentProjectId() && machineStore.context && typeof machineStore.context === 'object') {
          try {
            const updates = {
              currentPrompt: machineStore.context.currentPrompt,
              llmResponse: machineStore.context.llmResponse,
              currentStep: machineStore.context.currentStep,
              completedSteps: machineStore.context.completedSteps,
              stepName: machineStore.context.stepName,
              currentModel: machineStore.context.currentModel,
              currentSection: machineStore.context.currentSection,
              uiProgress: machineStore.context.uiProgress,
              uiMessage: machineStore.context.uiMessage,
              uiStatus: machineStore.context.uiStatus,
              totalCredits: machineStore.context.totalCredits,
              consumedCredits: machineStore.context.consumedCredits,
              totalTime: machineStore.context.totalTime,
              consumedTime: machineStore.context.consumedTime
             };
              updateProject(currentProjectId(), updates);
              mutate((prev) => prev ? { ...prev, ...updates } : prev);
            } catch (error) {
            }
          }
        }, 1000);
      });

      // Restore machine state from project data when project changes
      createEffect(() => {
        const pid = currentProjectId();
        if (!pid) return;
        
        // Get the project data from the projects resource
        const projectsList = projects();
        const project = projectsList?.find(p => p.id === pid);
        
        if (project && project.current_step && project.completedSteps !== undefined) {
          // Only restore if we have saved progress (not initial state)
          if (project.completedSteps > 0 || project.current_step !== 'system') {
            const savedState = {
              currentStep: project.current_step,
              completedSteps: project.completed_steps,
              stepName: project.step_name,
              currentModel: project.current_model,
              currentSection: project.current_section,
              uiProgress: project.ui_progress,
              uiMessage: project.ui_message,
              uiStatus: project.ui_status || 'idle',
              currentPrompt: project.current_prompt || '',
              llmResponse: project.llm_response || '',
              totalCredits: project.total_credits || 600,
              consumedCredits: project.consumed_credits || 0,
              totalTime: project.total_time || 18900,
              consumedTime: project.consumed_time || 0,
              problem: project.description || '',
              solution: project.name || ''
            };
            
            // Only update if different from current state
            const current = machineStore.context;
            if (current.currentStep !== savedState.currentStep || 
                current.completedSteps !== savedState.completedSteps) {
              setMachineStore('context', savedState);
              console.log('Restored machine state from project:', savedState);
            }
          }
        }
      });

    createEffect(() => {
        if (isLoading() && streamingContent()) {
            setActiveCardId('streaming');
        } else { // Find the latest task matching the current step
            const currentStepName = machineStore.context.stepName;
            const matchingTask = [...tasksList()].reverse().find(task => getStepName(task) === currentStepName);
            setActiveCardId(matchingTask ? matchingTask.id : null);
        }
    });

    return (
        <RouteGuard requireAuth={true}>
            <AgentInterface key={currentProjectId()} agentBoxClass={agentBoxClass} currentProjectId={currentProjectId}
               agentContentClass={agentContentClass}
               greetingClass={greetingClass}
               cardRef={cardRef}
               isAccordionOpen={isAccordionOpen}
               setIsAccordionOpen={setIsAccordionOpen}
               projectData={projectData}
               isLoading={isLoading}
               machineStore={machineStore}
               textareaRef={textareaRef}
               prompt={prompt}
               setPrompt={setPrompt}
               tasksList={tasksList}
               startPressed={startPressed}
               handleImprove={handleImprove}
               handleSuggest={handleSuggest}
               handleReset={handleReset}
               handleStart={handleStart}
               handlePause={handlePause}
               handleResume={handleResume}/>
            <Show when={
                !!currentProjectId() && (startPressed() || (tasksList && tasksList().length > 0 && machineStore.context?.currentStep !== 'done'))
            }>
                <ResponseSection tasksList={tasksList}
               project={projectData()}
               editingTaskId={editingTaskId}
               setEditingTaskId={setEditingTaskId}
               editContent={editContent}
               setEditContent={setEditContent}
               updateTask={updateTask}
               setTasksList={setTasksList}
               isLoading={isLoading}
               streamingContent={streamingContent}
               machineStore={machineStore}
               streamingRef={streamingRef}
               activeCardId={activeCardId}
               setActiveCardId={setActiveCardId}
               startPressed={startPressed}
                taskRefs={taskRefs}
                handleImprove={handleImprove}
                handleSuggest={handleSuggest}/>
           </Show>
        </RouteGuard>
    );
};


const Tasks = () => {
    return (
        <ProtectedRoute>
            <TasksContent />
        </ProtectedRoute>
    );
};

export default Tasks;
