import {
    createSignal,
    For,
    createResource,
    onMount,
    createEffect,
    Show,
    createMemo
} from "solid-js";
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
    stepNames,
    stepPrompts,
    fillPrompt
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
    getCreditBalance
} from "../../lib/db";
import { useUser } from "../../context/UserContext";
import { toastManager } from "../../lib/feedback";
import { useActivityLogger } from "../../lib/activity";
import { handleLLMProjectUpdate } from "../../lib/utils";
import {setMachineStore} from "../../lib/machine";
import {marked} from 'marked';
import {renderFilledTemplate} from '../../lib/llm-template';
import ResponseSection from '../../components/ui/ResponseSection';
import AgentInterface from '../../components/features/home/AgentInterface';
import RouteGuard from '../../components/common/RouteGuard';
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
    for (let key in promptToStepName) {
        if (task.prompt && task.prompt.includes(key)) {
            return promptToStepName[key];
        }
    }
    return "Unknown Step";
};

const Tasks = () => {
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
    const [tasks, {
            refetch
        }
    ] = createResource(() => ({ projectId: currentProjectId(), userId: user()?.id }), async ({ projectId, userId }) => {
      return await getTasks(projectId, userId);
    });
    const [streamingContent, setStreamingContent] = createSignal("");
    const [isAccordionOpen, setIsAccordionOpen] = createSignal(false);
    const [editingTaskId, setEditingTaskId] = createSignal(null);
    const [editContent, setEditContent] = createSignal("");
    const [agentBoxClass, setAgentBoxClass] = createSignal("flex items-center h-[calc(100vh-24rem)] max-w-6xl w-full mx-auto");
    const [agentContentClass, setAgentContentClass] = createSignal("relative w-full");
    const [greetingClass, setGreetingClass] = createSignal("text-center py-4 h-auto overflow-visible transition-all duration-300 opacity-100");
    const [isLoading, setIsLoading] = createSignal(false);
    const [autoProgress, setAutoProgress] = createSignal(false);
    const [tasksList, setTasksList] = createSignal([]);
    const [activeCardId, setActiveCardId] = createSignal(null);

    const currentContent = createMemo(() => streamingContent() || machineStore.context.llmResponse);

    // Adjust UI based on project selection and tasks
    createEffect(() => {
      const hasProject = currentProjectId() !== null;
      const hasTasks = tasksList().length > 0;
      if (hasProject && hasTasks) {
        setAgentBoxClass("flex items-start max-w-6xl w-full mx-auto"); // Auto height when project has tasks
      } else {
        setAgentBoxClass("flex items-center h-[calc(100vh-4rem)] max-w-6xl mx-auto"); // Full height otherwise
      }
      if (hasTasks) {
        setGreetingClass("hidden");
        setIsAccordionOpen(true);
      } else {
        setGreetingClass("text-center py-4 h-auto overflow-visible transition-all duration-300 opacity-100");
        setIsAccordionOpen(false);
      }
    });

    // Save progress to current project
    createEffect(() => {
      machineStore.context; // trigger on change
      if (currentProjectId() && machineStore.context) {
        // Filter context to only include database fields
        const dbFields = [
          'problem', 'solution', 'currentStep', 'completedSteps', 'stepName',
          'currentModel', 'currentSection', 'uiProgress', 'uiMessage', 'uiStatus',
          'totalCredits', 'consumedCredits', 'totalTime', 'consumedTime', 'totalSteps',
          'currentPrompt', 'llmResponse'
        ];
        const filteredContext = {};
        for (const field of dbFields) {
          if (machineStore.context[field] !== undefined) {
            filteredContext[field] = machineStore.context[field];
          }
        }
        // Only update if there are fields to update
        if (Object.keys(filteredContext).length > 0) {
          updateProject(currentProjectId(), filteredContext);
        }
      }
    });

    // Load initial tasks - removed for now

    let cardRef;
    let streamingRef;
    let textareaRef;
    let taskRefs = {};

    const advanceToNextStep = () => {
        setMachineStore('context', (prev) => {
            const nextStep = getNextStep(prev.currentStep);
            if (nextStep === 'done') {
                setMachineStore('state', 'completed');
                return {
                    ...prev,
                    currentStep: 'done',
                    uiProgress: 100,
                    uiStatus: 'completed',
                    uiMessage: '🎉 All 48 steps completed successfully!'
                };
            } else {
                const isSystem = prev.currentStep === 'system';
                const newCompletedSteps = isSystem ? 1 : prev.completedSteps + 1;
                const progress = (newCompletedSteps / 48) * 100;
                const message = isSystem ? t().initializationComplete : `Step ${newCompletedSteps} complete. Moving to ${
                    stepNames[nextStep] || 'next step'
                }...`;
                return {
                    ...prev,
                    currentStep: nextStep,
                    stepName: stepNames[nextStep] || 'Next Step',
                    currentModel: modelMap[nextStep] || 'System',
                    currentSection: sectionMap[nextStep] || 'Initialization',
                    completedSteps: newCompletedSteps,
                    uiProgress: Math.min(progress, 100),
                    uiMessage: message,
                    currentPrompt: fillPrompt(getPromptForStep(nextStep), {
                        ...prev,
                        currentStep: nextStep
                    })
                };
            }
        });
    };

    const handleLLMCall = async (prompt, retryCount = 0, options = {}) => { // Rate limit: 4 requests per minute (15 seconds between calls after the first)
        if (machineStore.context.completedSteps > 0) {
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
        try {
            const result = await callLLM(prompt, retryCount, options);
            receiveResponse(result, setAutoProgress, setTasksList, tasksList, (task) => {
                console.log('Adding task for project:', currentProjectId());
                addTask(task, currentProjectId());
            });
            setStreamingContent('');
        } catch (e) {
            console.log('LLM call failed, advancing to next step:', e.message);
            advanceToNextStep();
            setAutoProgress(true);
        }
    };

    const callLLM = async (prompt, retryCount = 0, options = {}) => {
        try {
            // Check and consume credits
            const currentUser = user();
            if (currentUser && currentUser.id) {
                const balance = await getCreditBalance(currentUser.id);
                if (balance < 10) {
                    toastManager.error('Insufficient credits. You need at least 10 credits to use AI features.');
                    return;
                }
                await consumeCredits(currentUser.id, 10, `AI Request: ${prompt.substring(0, 50)}...`);
                toastManager.info('Consumed 10 credits for AI request');

                // Log AI usage
                activityLogger.logAI('used', null, 'Home AI Request', { creditsUsed: 10, promptLength: prompt.length });
            }

            setIsLoading(true);
            const response = await fetch('/api/llm/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({prompt})
            });
            if (! response.ok) {
                if (response.status === 429) {
                    const waitTime = 60000 * (2 ** retryCount); // Exponential backoff: 60s, 120s, 240s, etc.
                    toastManager.warning(`Rate limit exceeded for prompt (${prompt.length} chars). Retrying in ${waitTime / 1000} seconds... (Attempt ${retryCount + 1}/3)`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return callLLM(prompt, retryCount + 1);
                }
                throw new Error(`HTTP ${
                    response.status
                }`);
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            const chunks = [];
            while (true) {
                const {done, value} = await reader.read();
                if (done) 
                    break;
                
                const chunkText = decoder.decode(value, {stream: true});
                chunks.push(chunkText);
                if (options.streamToTextarea) {
                    setPrompt(chunks.join(''));
                } else {
                    setStreamingContent(chunks.join(''));
                }
                // Small delay to ensure UI updates are visible
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            console.log('LLM response received:', chunks.join('').length, 'chars');
            return chunks.join('');
        } catch (e) {
            toastManager.error(`Failed to get AI response for prompt (${prompt.length} chars): ${e.message}. Process paused.`);
            // Continue to next step on any error, only pause on button press
            setAutoProgress(true);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const handleStart = async () => {
        setAgentBoxClass("flex items-center max-w-6xl w-full mx-auto");
        setStreamingContent("");
        setIsAccordionOpen(true);
        // Reset textarea height to prevent it from being tall during processing
        if (textareaRef) {
            textareaRef.style.height = '3rem';
        }
        startProcess("Please help me start a new project");
        if (!currentProjectId()) {
            const projectName = "New Project";
            const description = "AI-powered startup accelerator project";
            const projectId = await addProject({name: projectName, description, createdAt: new Date()});
            setCurrentProjectId(projectId);
            toastManager.success(`New project "${projectName}" created (ID: ${projectId}) with ${description.length} chars description. Accelerator process started.`);
            window.dispatchEvent(new CustomEvent('projectAdded'));
        }
        await handleLLMCall(machineStore.context.currentPrompt, 0);
    };

    const handlePause = () => {
        pause();
    };

    const handleResume = () => {
        resume();
        setAutoProgress(true);
        setIsAccordionOpen(true);
    };

    const handleImprove = async () => {
        const improvedPrompt = `${t().improvePrompt} Please improve my startup idea`;
        const extractProjectName = (result) => result.split('\n')[0].trim();
        await handleLLMProjectUpdate(callLLM, improvedPrompt, extractProjectName, currentProjectId, setCurrentProjectId, setPrompt);
    };

    const handleSuggest = async () => {
        const suggestPrompt = t().suggestPrompt;
        const extractProjectName = (result) => {
            const lines = result.split('\n').map(l => l.trim()).filter(l => l);
            const firstLine = lines[0] || '';
            let projectName = firstLine.replace(/^#+\s*/, '').split(':')[0].trim();
            return projectName || 'Unnamed Idea';
        };
        await handleLLMProjectUpdate(callLLM, suggestPrompt, extractProjectName, currentProjectId, setCurrentProjectId, setPrompt);
    };

    const handleReset = async () => {
        reset();
        setStreamingContent('');
        setAutoProgress(false);
        setTasksList([]);
        setIsAccordionOpen(false);
        setPrompt(''); // Clear the prompt
        setCurrentProjectId(null); // Unselect current project
        if (textareaRef) {
            textareaRef.style.height = '3rem'; // Reset textarea height
        }
        await clearAllTasks();
    };

    onMount(async () => { // Load progress

        // Set initial textarea height
        if (textareaRef) {
            textareaRef.style.height = 'auto';
            textareaRef.style.height = textareaRef.scrollHeight + 'px';
        }

        // Listen for open project
        window.addEventListener('openProject', async (e) => {
            const project = await getProjectById(e.detail);
            console.log('Selected project data:', project);
            if (project) {
                setCurrentProjectId(project.id);
                setPrompt(project.description || '');
                setMachineStore('context', {
                  problem: '',
                  solution: '',
                  currentStep: project.currentStep || 'system',
                  completedSteps: project.completedSteps || 0,
                  stepName: project.stepName || 'System Initialization',
                  currentModel: project.currentModel || 'System',
                  currentSection: project.currentSection || 'Initialization',
                  uiProgress: project.uiProgress || 0,
                  uiMessage: project.uiMessage || t().uiMessage,
                  uiStatus: project.uiStatus || 'idle',
                  currentPrompt: '',
                  llmResponse: '',
                  strugglers: '',
                  alternatives: '',
                  gaps: '',
                  persona: '',
                  urgency: '',
                  evidence: '',
                  valueProp: '',
                  features: '',
                  modelType: '',
                  revenue: '',
                  pricing: '',
                  moat: '',
                  risks: '',
                  tasks_list: ''
                });
            }
        });

        // Listen for reset agent
        window.addEventListener('resetAgent', () => {
            handleReset();
        });

        // Create Lucide icons after a delay to ensure script loaded
        setTimeout(() => {
            if (window.lucide) 
                window.lucide.createIcons();
            
        }, 100);
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

    createEffect(() => {
        console.log('Setting tasksList from resource:', tasks());
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
        if (autoProgress() && !isLoading() && machineStore.state === 'processing') {
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
            <div class={`relative flex flex-col ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
            <ResponseSection tasksList={tasksList}
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
                taskRefs={taskRefs}/>
            <AgentInterface agentBoxClass={agentBoxClass} currentProjectId={currentProjectId}
                agentContentClass={agentContentClass}
                greetingClass={greetingClass}
                cardRef={cardRef}
                isAccordionOpen={isAccordionOpen}
                setIsAccordionOpen={setIsAccordionOpen}
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
        </div>
        </RouteGuard>
    );
};


export default Tasks;
