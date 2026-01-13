import {
    createSignal,
    For,
    createResource,
    onMount,
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
    consumeCredits,
    getCreditBalance,
    updateEntity,
    getUserProfile
} from "../../lib/db";
import { useUser } from "../../context/UserContext";
import { toastManager } from "../../lib/feedback";
import { useActivityLogger } from "../../lib/activity";
import { handleLLMProjectUpdate, extractProjectName } from "../../lib/utils";
import {setMachineStore} from "../../lib/machine";
import {marked} from 'marked';
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
    const { isOnline } = useOnlineStatus();
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
    const [streamingContent, setStreamingContent] = createSignal("");
    const [tasksList, setTasksList] = createSignal([]);
    const [editingTaskId, setEditingTaskId] = createSignal(null);
    const [editContent, setEditContent] = createSignal("");
    const [activeCardId, setActiveCardId] = createSignal(null);

    // Refs
    let streamingRef;
    let taskRefs = {};
    let textareaRef;

    // Handler functions
    const handleImprove = async () => {
        const improvedPrompt = `Improve this startup idea for better clarity, specificity, and market potential. Start with the improved idea name followed by ': ' and then provide a concise description in simple English, in only 3 lines. Do not generate in markdown: ${prompt()}`;
        try {
            const improvedText = await handleQuickLLMCall(improvedPrompt, true, setPrompt);
            // Update current project if exists
            if (currentProjectId()) {
                // Parse name and description from improvedText
                const colonIndex = improvedText.indexOf(': ');
                let name = '', description = improvedText;
                if (colonIndex !== -1) {
                    name = improvedText.substring(0, colonIndex).trim();
                    description = improvedText.substring(colonIndex + 2).trim();
                }
                await updateProject(currentProjectId(), { name, description });
                window.dispatchEvent(new CustomEvent('projectUpdated'));
                toastManager.success('Project improved successfully!');
                logger.info('Project updated with improved name and description');
            }
        } catch (error) {
            logger.error('Improve error:', error);
            toastManager.error('Failed to improve project');
        }
    };
    const handleSuggest = async () => {
        logger.info('Starting AI suggestion process for prompt:', prompt().substring(0, 50) + '...');
        const suggestPrompt = `Suggest a compelling startup idea in the legal tech space. Start with the idea name followed by ': ' and then provide a brief description, target market, and unique value proposition in simple English, in only 3 lines. Do not generate in markdown.`;
        try {
            const suggestedText = await handleQuickLLMCall(suggestPrompt, true, setPrompt);
            logger.info('AI suggestion received:', suggestedText.substring(0, 100) + '...');
            setPrompt(suggestedText);
            // Create a new project with the suggested idea
            const projectName = suggestedText.length > 50 ? suggestedText.substring(0, 50) + '...' : suggestedText;
            const projectId = await addProject({
                name: projectName,
                description: suggestedText,
                createdAt: new Date()
            });
            setCurrentProjectId(projectId);
            logger.info('Project created from AI suggestion, ID:', projectId);
            toastManager.success('New project created with AI suggestion!');
        } catch (error) {
            logger.error('AI suggestion process failed:', error.message);
        }
    };
    const handleReset = () => {
        logger.info('Resetting application state to initial');
        reset();
        setTasksList([]);
        setPrompt('');
        setMachineStore('context', initialContext);
    };
    const handleStart = async () => {
        console.log('HandleStart: starting process');
        setAutoProgress(true);
        await handleLLMProjectUpdate(prompt(), extractProjectName, currentProjectId, setCurrentProjectId, setPrompt, setStreamingContent);
        console.log('HandleStart: after LLMProjectUpdate, starting process');
        startProcess();
        console.log('HandleStart: process started, state:', machineStore.state, 'autoProgress:', autoProgress());
    };
    const handlePause = () => {
        pause();
    };
    const handleResume = () => {
        resume();
    };

    // Quick LLM Call handler for short responses
    const handleQuickLLMCall = async (prompt, stream = true, setFunction = setStreamingContent) => {
        const creditsCost = 0; // Free for quick LLM calls
        logger.info('Quick LLM call initiated, prompt length:', prompt.length);
        setIsLoading(true);
        setStreamingContent('');

        try {
            // Check user authentication
            if (!user() || !user().id) {
              toastManager.error('Please log in to use this feature');
              return;
            }
            let balance = user().credits?.balance || 0;
            if (balance === 0) {
              try {
                balance = await getCreditBalance(user().id);
              } catch (e) {
                logger.error('Error getting credit balance:', e);
              }
            }
            if (balance < creditsCost) {
                logger.error('Insufficient credits - balance:', balance, 'required:', creditsCost);
                throw new Error('Insufficient credits. You need at least ' + creditsCost + ' credits to use AI features.');
            }
            await consumeCredits(user().id, creditsCost, `Quick AI: ${prompt.substring(0, 50)}...`);

            // Log activity
            if (activityLogger.user) {
                activityLogger.logAI('used', null, 'Quick LLM', { creditsUsed: creditsCost, promptLength: prompt.length });
            }

            const response = await fetch('/api/llm/quick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error(`Quick LLM API error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                aiResponse += chunk;
                if (stream) setFunction(aiResponse);
            }

            logger.debug('Home: quick LLM call completed successfully');
            return aiResponse;
        } catch (error) {
            logger.error('Home: Quick LLM call error:', error);
            toastManager.error(`Failed to get quick LLM response: ${error.message}`);
            throw error;
        } finally {
            logger.debug('Home: finally block - setting isLoading to false, clearing streamingContent');
            setIsLoading(false);
            setStreamingContent('');
        }
    };

    // LLM Call handler
    const handleLLMCall = async (prompt) => {
        setIsLoading(true);
        setStreamingContent('');
        try {
            // Check online status for AI features
            if (!isOnline()) {
                throw new Error('AI features require an internet connection. Please check your connection and try again.');
            }

            // Check user authentication
            if (!user() || !user().id) {
                logger.error('Home: User not authenticated');
                throw new Error('You must be logged in to use AI features.');
            }

            // Validate and sanitize prompt for security
            const promptValidation = validateLLMPrompt(prompt);
            if (!promptValidation.valid) {
                throw new Error(`Prompt validation failed: ${promptValidation.reason}`);
            }
            const sanitizedPrompt = promptValidation.sanitized;

            // Consume credits
            const creditsCost = 10;
            const balance = await getCreditBalance(user().id);
            if (balance < creditsCost) {
                throw new Error('Insufficient credits. You need at least ' + creditsCost + ' credits to use AI features.');
            }
            await consumeCredits(user().id, creditsCost, `AI Processing: ${sanitizedPrompt.substring(0, 50)}...`);

            // Log activity
            if (activityLogger.user) {
                activityLogger.logAI('used', null, 'LLM Stream', { creditsUsed: creditsCost, promptLength: sanitizedPrompt.length });
            }

            // Make real API call to streaming LLM endpoint
            const response = await fetch('/api/llm/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: sanitizedPrompt }),
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                aiResponse += chunk;
                setStreamingContent(aiResponse);
            }

            // After streaming, process the response
            await receiveResponse(aiResponse, setAutoProgress, setTasksList, tasksList, addTask, updateProject, currentProjectId());
            // Refetch tasks to update the UI
            await refetch();
        } catch (error) {
            logger.error('LLM call error:', error);
            toastManager.error(`Failed to get LLM response: ${error.message}`);
            setIsLoading(false);
        }
    };

    // CSS class signals for AgentInterface
    const agentBoxClass = () => "flex flex-col rounded-lg mx-auto max-w-6xl";
    const agentContentClass = () => "flex-1 overflow-hidden";
    const [greetingClass, setGreetingClass] = createSignal("text-lg font-semibold text-gray-900 dark:text-white mb-4");
    const [tasks, {
            refetch
        }
    ] = createResource(() => {
      const pid = currentProjectId();
      if (!pid) return null;
      return { projectId: pid, userId: user()?.id };
    }, async (params) => {
      if (!params || !params.userId) return [];
      return await getTasks(params.projectId, params.userId);
    });
    const [projectData, { mutate }] = createResource(currentProjectId, async (projectId) => {
      if (!projectId) return null;
      return await getProjectById(projectId);
    });

     // Load project context when project data changes
     createEffect(() => {
       const project = projectData();
       if (project && typeof project === 'object') {
                 // Load context from flattened project fields
                 const contextFromDB = {
                   problem: project.description || "", // Use project description as problem
                   solution: "", // Will be filled by AI during processing
                   currentStep: project.currentStep,
                   completedSteps: project.completedSteps,
                   stepName: project.stepName,
                   currentModel: project.currentModel,
                   currentSection: project.currentSection,
                   uiProgress: project.uiProgress,
                   uiMessage: project.uiMessage,
                   uiStatus: project.uiStatus,
                   currentPrompt: project.currentPrompt,
                   llmResponse: project.llmResponse,
                   totalCredits: project.totalCredits,
                   consumedCredits: project.consumedCredits,
                   totalTime: project.totalTime,
                   consumedTime: project.consumedTime
                 };
                  console.log('Home: setting machine context', { ...initialContext, ...contextFromDB });
                  setMachineStore('context', { ...initialContext, ...contextFromDB });
                  // Set machine state: use saved state or default to idle
                  const newState = project.uiStatus || "idle";
                  console.log('Home: setting machine state to', newState);
                  setMachineStore("state", newState);

                  // Set the prompt to project description
                  console.log('Home: setting prompt to project description', project.description);
                  setPrompt(project.description || "");
        }
      });

      // Handle async operations when project changes
      createEffect(() => {
        const project = projectData();
        if (project && typeof project === 'object') {
          // Refetch tasks for the opened project
          (async () => {
            console.log('Home: refetching tasks for project', project.id);
            await refetch();
            console.log('Home: tasks after refetch', tasks());
            logger.debug('Opened project', project.id, 'with context:', machineStore.context);
            logger.debug('Project tasks_list:', project.tasks_list);

            // Extract business data from loaded tasks
            const currentTasks = tasks();
            if (currentTasks && currentTasks.length > 0) {
              const extractedData = extractDataFromTasks(currentTasks);
              setMachineStore('context', (prev) => ({ ...prev, ...extractedData }));
              logger.debug('Extracted business data from tasks:', extractedData);
            }

            // If no tasks loaded and project has tasks_list, create tasks from it
            logger.debug('Current tasks:', currentTasks);

            if ((!currentTasks || currentTasks.length === 0) && project.tasks_list) {
              logger.debug('Attempting to create tasks from tasks_list...');
              try {
                const tasksData = JSON.parse(project.tasks_list);
                logger.debug('Parsed tasks_data:', tasksData);
                if (Array.isArray(tasksData) && tasksData.length > 0) {
                  logger.debug('Creating tasks from project tasks_list:', tasksData);
                  for (const taskData of tasksData) {
                    logger.debug('Adding task:', taskData);
                    await addTask({
                      content: taskData.content || taskData,
                      llmResponse: taskData.llmResponse || null,
                      timestamp: taskData.timestamp || new Date().toISOString(),
                      completed: taskData.completed || false
                    }, project.id, user()?.id || 'local-user');
                  }
                  // Refetch again to load the newly created tasks
                  await refetch();
                  // Extract data from newly created tasks
                  const newTasks = tasks();
                  if (newTasks && newTasks.length > 0) {
                    logger.debug('Extracted data from newly created tasks');
                    const extractedData = extractDataFromTasks(newTasks);
                    setMachineStore('context', (prev) => ({ ...prev, ...extractedData }));
                  }
                } else {
                  logger.debug('tasksData is not a valid array or is empty');
                }
              } catch (e) {
                logger.error('Error parsing or creating tasks from tasks_list:', e);
              }
            } else {
              logger.debug('Tasks already exist or no tasks_list, not creating tasks');
            }
          })();
        }
      });

     // Event listeners and initialization
     onMount(() => {
         // Listen for project deletion
         window.addEventListener('projectDeleted', (e) => {
             if (currentProjectId() === e.detail.projectId) {
                 logger.debug('Current project was deleted, resetting selection');
                 setCurrentProjectId(null);
                 setPrompt('');
                 setTasksList([]);
                 setMachineStore('context', initialContext);
             }
         });

          // Listen for reset agent
          window.addEventListener('resetAgent', () => {
              handleReset();
          });

          // Listen for open project
          console.log('Home: adding openProject listener');
          window.addEventListener('openProject', (e) => {
              const pid = e.detail;
              console.log('Home: openProject event received', pid);
              // Save selected project to user profile
              updateEntity({ table: 'profiles', idField: 'user_id', id: user().id, updates: { current_project_id: pid } });
              setCurrentProjectId(pid);
          });

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
            }).catch(e => logger.error('Error loading user profile:', e));
          }
      });

    createEffect(() => {
        machineStore.state;
        if (window.lucide) 
            window.lucide.createIcons();
        
    });


    createEffect(() => {
        machineStore.context.completedSteps;
        machineStore.context.currentModel;
        if (window.lucide) 
            window.lucide.createIcons();
        
    });

     // Set tasksList when project changes
     createEffect(() => {
         currentProjectId();
         logger.debug('Setting tasksList from resource:', tasks());
         if (Array.isArray(tasks())) {
             setTasksList(tasks());
         }
     });

    createEffect(() => {
        if (machineStore.state === 'idle') {
            setGreetingClass("text-center py-4 h-auto overflow-visible transition-all duration-300 opacity-100");
        } else {
            setGreetingClass("text-center py-0 h-0 overflow-hidden transition-all duration-300 opacity-0");
        }
    });

    createEffect(() => {
        console.log('CreateEffect: autoProgress:', autoProgress(), 'isLoading:', isLoading(), 'state:', machineStore.state);
        if (autoProgress() && !isLoading() && machineStore.state === 'processing') {
            console.log('CreateEffect: calling handleLLMCall with prompt:', machineStore.context.currentPrompt);
            setAutoProgress(false);
            handleLLMCall(machineStore.context.currentPrompt);
        }
    });

    createEffect(() => {
        if (cardRef) {
            let animationId;
            let startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const t = elapsed * 0.001;
                // time in seconds

                // Smooth oscillating values using sine waves
                const x = Math.sin(t * 0.2) * 15; // -15 to 15
                const y = Math.sin(t * 0.1) * 12; // -12 to 12
                const blur = 25 + Math.sin(t * 0.3) * 15; // 10 to 40
                const spread = Math.sin(t * 0.15) * 5;
                // -5 to 5

                // Smooth color transition
                const hue = (t * 20) % 360; // Cycle through hues faster
                const color = `hsla(${hue}, 40%, 60%, 0.4)`;

                cardRef.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;

                animationId = requestAnimationFrame(animate);
            };

            // Start animating after a short delay
            setTimeout(() => {
                animationId = requestAnimationFrame(animate);
            }, 1000);
        }
    });

    // Save progress to current project when context changes
    createEffect(() => {
      machineStore.context; // trigger on change
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
          logger.debug('Updating project', currentProjectId(), 'with flattened context');
          updateProject(currentProjectId(), updates);
          // Update local project data to update UI
          mutate((prev) => prev ? { ...prev, ...updates } : prev);
        } catch (error) {
          logger.error('Failed to update project in createEffect:', error);
        }
      }
    });

    // createEffect(() => {
    // streamingContent();
    // setTimeout(() => {
    //     const element = document.getElementById('streaming');
    //     if (element) {
    //       element.scrollIntoView({ behavior: 'smooth', block: 'end' });
    //     }
    // }, 100);
    // });

    // createEffect(() => {
    // if (activeCardId()) {
    //     setTimeout(() => {
    //       const element = document.getElementById(activeCardId());
    //     if (element) {
    //       element.scrollIntoView({ behavior: 'smooth', block: 'end' });
    //     }
    //     }, 100);
    // }
    // });

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
            <div class={`relative flex flex-col justify-center h-[calc(100vh-4rem)] items-center ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
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
                 handleImprove={handleImprove}
                 handleSuggest={handleSuggest}
                 handleReset={handleReset}
                 handleStart={handleStart}
                 handlePause={handlePause}
                 handleResume={handleResume}/>
            <Show when={currentProjectId() && tasksList().length > 0}>
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
                  taskRefs={taskRefs}
                  handleImprove={handleImprove}
                  handleSuggest={handleSuggest}/>
              </Show>
        </div>
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
