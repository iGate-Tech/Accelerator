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
    fillPrompt
} from "../lib/machine";
import {
    getTasks,
    addTask,
    addMessage,
    clearAllTasks,
    clearAllMessages,
    updateTask,
    saveProgress,
    loadProgress,
    addProject,
    getProjectByName
} from "../lib/db";
import {setMachineStore} from "../lib/machine";
import {marked} from 'marked';
import {renderFilledTemplate} from '../lib/llm-template';
import ResponseSection from './ResponseSection';
import AgentInterface from './AgentInterface';

const promptToStepName = {
    "You are an AI-powered startup accelerator": stepNames.system,
    "Analyze the problem": stepNames.step2,
    "Evaluate the severity": stepNames.step3,
    "List and categorize current solutions": stepNames.step4,
    "Analyze why current": stepNames.step5,
    "Develop a detailed user persona": stepNames.step6,
    "Assess the urgency": stepNames.step7,
    "Gather and validate evidence": stepNames.step8,
    "Design a comprehensive solution": stepNames.step9,
    "Craft a compelling value proposition": stepNames.step10,
    "List key features": stepNames.step11,
    "Determine the optimal business model": stepNames.step12,
    "Design revenue streams": stepNames.step13,
    "Develop a pricing strategy": stepNames.step14,
    "Build competitive moats": stepNames.step15,
    "List key assumptions": stepNames.step16,
    "Clearly define the target market": stepNames.step17,
    "Estimate the Total Addressable Market": stepNames.step18,
    "Estimate the Serviceable Available Market": stepNames.step19,
    "Estimate the Serviceable Obtainable Market": stepNames.step20,
    "Check if": stepNames.validate_tam_sam_som,
    "Identify trends": stepNames.step21,
    "List direct and indirect competitors": stepNames.step22,
    "Develop a strategy to enter": stepNames.step23,
    "Identify channels": stepNames.step24,
    "Describe the sales motion": stepNames.step25,
    "Develop strategies to retain": stepNames.step26,
    "Explain how revenue is generated": stepNames.step27,
    "Provide Customer Acquisition Cost": stepNames.step28,
    "List major fixed and variable costs": stepNames.step29,
    "Provide 3-year revenue": stepNames.step30,
    "Calculate the monthly burn rate": stepNames.step31,
    "Determine when": stepNames.step32,
    "Provide current traction": stepNames.step33,
    "Calculate the valuation": stepNames.step34,
    "Determine the appropriate funding stage": stepNames.step35,
    "Determine how much capital": stepNames.step36,
    "Check if  {{valuation}}": stepNames.validate_deck_ask,
    "Plan the allocation": stepNames.step37,
    "Calculate the expected pre-money": stepNames.step38,
    "Validate if  {{preMoney}}": stepNames.validate_pre_money,
    "Identify target investor types": stepNames.step39,
    "List milestones": stepNames.step40,
    "List founding team members": stepNames.step41,
    "Identify key skills": stepNames.step42,
    "Develop a hiring plan": stepNames.step43,
    "List advisors": stepNames.step44,
    "Determine the legal structure": stepNames.step45,
    "Plan intellectual property": stepNames.step46,
    "Identify key contracts": stepNames.step47,
    "Identify legal and regulatory risks": stepNames.step48
};

const getStepName = (task) => {
    for (let key in promptToStepName) {
        if (task.prompt && task.prompt.includes(key)) {
            return promptToStepName[key];
        }
    }
    return "Unknown Step";
};

const Tasks = () => {
    const [currentProjectId, setCurrentProjectId] = createSignal(null);
    const [prompt, setPrompt] = createSignal("");
    const [tasks, {
            refetch
        }
    ] = createResource(currentProjectId, getTasks);
    const [streamingContent, setStreamingContent] = createSignal("");
    const [isAccordionOpen, setIsAccordionOpen] = createSignal(false);
    const [editingTaskId, setEditingTaskId] = createSignal(null);
    const [editContent, setEditContent] = createSignal("");
    const [agentBoxClass, setAgentBoxClass] = createSignal("flex items-center h-[calc(100vh-4rem)] max-w-6xl w-full mx-auto");
    const [agentContentClass, setAgentContentClass] = createSignal("relative w-full");
    const [greetingClass, setGreetingClass] = createSignal("text-center py-4 h-auto overflow-visible transition-all duration-300 opacity-100");
    const [error, setError] = createSignal("");
    const [isLoading, setIsLoading] = createSignal(false);
    const [autoProgress, setAutoProgress] = createSignal(false);
    const [tasksList, setTasksList] = createSignal([]);
    const [activeCardId, setActiveCardId] = createSignal(null);

    const currentContent = createMemo(() => streamingContent() || machineStore.context.llmResponse);

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
                const message = isSystem ? 'Initialization complete. Starting step 1...' : `Step ${newCompletedSteps} complete. Moving to ${
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
            await addMessage({type: 'user', content: prompt});
            await addMessage({type: 'ai', content: result});
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
            if (retryCount === 0) 
                setError("");
            
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
                    setError(`Rate limit hit. Retrying in ${
                        waitTime / 1000
                    } seconds... (Attempt ${
                        retryCount + 1
                    })`);
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
            setError(`Failed to get AI response: ${
                e.message
            }`);
            // Continue to next step on any error, only pause on button press
            setAutoProgress(true);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const handleStart = async () => {
        setAgentBoxClass("flex pb-20 items-center max-w-6xl w-full mx-auto");
        setStreamingContent("");
        setIsAccordionOpen(true);
        // Reset textarea height to prevent it from being tall during processing
        if (textareaRef) {
            textareaRef.style.height = '3rem';
        }
        startProcess(prompt());
        const projectName = prompt().split('\n')[0].trim();
        const projectId = await addProject({name: projectName, createdAt: new Date()});
        setCurrentProjectId(projectId);
        window.dispatchEvent(new CustomEvent('projectAdded'));
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
        const improvedPrompt = `Improve this startup idea for better clarity, specificity, and market potential. Start with the improved idea name followed by ': ' and then provide a concise description in simple English, in only 3 lines. Do not generate in markdown: ${
            prompt()
        }`;
        try {
            const result = await callLLM(improvedPrompt, 0, {streamToTextarea: true});
            await addMessage({type: 'user', content: improvedPrompt});
            await addMessage({type: 'ai', content: result});
            setPrompt(result);
            const projectName = result.split('\n')[0].trim();
            const projectId = await addProject({name: projectName, createdAt: new Date()});
            setCurrentProjectId(projectId);
            window.dispatchEvent(new CustomEvent('projectAdded'));
        } catch (e) { // Error handled
        }
    };

    const handleSuggest = async () => {
        const suggestPrompt = `Suggest a compelling startup idea in the legal tech space. Start with the idea name followed by ': ' and then provide a brief description, target market, and unique value proposition in simple English, in only 3 lines. Do not generate in markdown.`;
        try {
            const result = await callLLM(suggestPrompt, 0, {streamToTextarea: true});
            await addMessage({type: 'user', content: suggestPrompt});
            await addMessage({type: 'ai', content: result});
            setPrompt(result);
            const projectName = result.split('\n')[0].trim();
            const projectId = await addProject({name: projectName, createdAt: new Date()});
            setCurrentProjectId(projectId);
            window.dispatchEvent(new CustomEvent('projectAdded'));
        } catch (e) { // Error handled
        }
    };

    const handleReset = async () => {
        reset();
        setStreamingContent('');
        setError('');
        setAutoProgress(false);
        setTasksList([]);
        setIsAccordionOpen(false);
        setPrompt(''); // Clear the prompt
        if (textareaRef) {
            textareaRef.style.height = '3rem'; // Reset textarea height
        }
        await clearAllTasks();
        await clearAllMessages();
    };

    const handleSaveProgress = async () => {
        await saveProgress({state: machineStore.state, context: machineStore.context});
    };


    onMount(async () => { // Load progress
        const progress = await loadProgress();
        if (progress) {
            setMachineStore(progress);
        }

        // Set initial textarea height
        if (textareaRef) {
            textareaRef.style.height = 'auto';
            textareaRef.style.height = textareaRef.scrollHeight + 'px';
        }

        // Listen for open project
        window.addEventListener('openProject', async (e) => {
            const project = await getProjectByName(e.detail);
            if (project) {
                setCurrentProjectId(project.id);
                setPrompt(e.detail);
            }
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
        <div class="relative  flex flex-col">
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
            <AgentInterface agentBoxClass={agentBoxClass}
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
                handleImprove={handleImprove}
                handleSuggest={handleSuggest}
                handleReset={handleReset}
                handleSaveProgress={handleSaveProgress}
                handleStart={handleStart}
                handlePause={handlePause}
                handleResume={handleResume}/>
        </div>
    );
};


export default Tasks;
