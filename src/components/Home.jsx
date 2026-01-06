import { createSignal, For, createResource, onMount, createEffect, Show, createMemo } from "solid-js";
import { machineStore, startProcess, receiveResponse, pause, resume, reset, modelCumul, stepOrder, getNextStep, modelMap, sectionMap } from "../lib/machine";
import { getTasks, addTask, addMessage, clearAllTasks, clearAllMessages, updateTask, saveProgress, loadProgress } from "../lib/db";
import { setMachineStore } from "../lib/machine";
import { marked } from 'marked';
import { renderFilledTemplate } from '../lib/llm-template';
import ResponseSection from './ResponseSection';
import AgentInterface from './AgentInterface';

const Tasks = () => {
  const [prompt, setPrompt] = createSignal("");
  const [tasks, { refetch }] = createResource(getTasks);
  const [streamingContent, setStreamingContent] = createSignal("");
  const [isAccordionOpen, setIsAccordionOpen] = createSignal(false);
  const [editingTaskId, setEditingTaskId] = createSignal(null);
  const [editContent, setEditContent] = createSignal("");
    const [agentBoxClass, setAgentBoxClass] = createSignal("fixed inset-0 bg-base-200 transition-all duration-500 ease-in-out z-50 flex justify-center items-center");
    const [agentContentClass, setAgentContentClass] = createSignal("relative max-w-2xl");
     const [greetingClass, setGreetingClass] = createSignal("text-center py-4 h-auto overflow-visible transition-all duration-300 opacity-100");
    const [error, setError] = createSignal("");
    const [isLoading, setIsLoading] = createSignal(false);
    const [autoProgress, setAutoProgress] = createSignal(false);
     const [tasksList, setTasksList] = createSignal([]);

    const currentContent = createMemo(() => streamingContent() || machineStore.context.llmResponse);

    // Load initial tasks - removed for now

   let cardRef;
   let streamingRef;
   let textareaRef;

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
        const message = isSystem ? 'Initialization complete. Starting step 1...' : `Step ${newCompletedSteps} complete. Moving to ${stepNames[nextStep] || 'next step'}...`;
        return {
          ...prev,
          currentStep: nextStep,
          stepName: stepNames[nextStep] || 'Next Step',
          currentModel: modelMap[nextStep] || 'System',
          currentSection: sectionMap[nextStep] || 'Initialization',
          completedSteps: newCompletedSteps,
          uiProgress: Math.min(progress, 100),
          uiMessage: message,
          currentPrompt: fillPrompt(getPromptForStep(nextStep), { ...prev, currentStep: nextStep })
        };
      }
    });
  };

  const handleLLMCall = async (prompt, retryCount = 0, options = {}) => {
    // Rate limit: 4 requests per minute (15 seconds between calls after the first)
    if (machineStore.context.completedSteps > 0) {
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
    try {
      const result = await callLLM(prompt, retryCount, options);
      await addMessage({ type: 'user', content: prompt });
      await addMessage({ type: 'ai', content: result });
       receiveResponse(result, setAutoProgress, setTasksList, tasksList);
       setStreamingContent('');
    } catch (e) {
      console.log('LLM call failed, advancing to next step:', e.message);
      advanceToNextStep();
      setAutoProgress(true);
    }
  };

  const callLLM = async (prompt, retryCount = 0, options = {}) => {
    try {
      if (retryCount === 0) setError("");
      setIsLoading(true);
      const response = await fetch('/api/llm/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) {
        if (response.status === 429) {
          const waitTime = 60000 * (2 ** retryCount); // Exponential backoff: 60s, 120s, 240s, etc.
          setError(`Rate limit hit. Retrying in ${waitTime / 1000} seconds... (Attempt ${retryCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return callLLM(prompt, retryCount + 1);
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
          const chunkText = decoder.decode(value, { stream: true });
          chunks.push(chunkText);
          if (options.streamToTextarea) {
            setPrompt(chunks.join(''));
          } else {
            setStreamingContent(chunks.join(''));
          }
         // Small delay to ensure UI updates are visible
         await new Promise(resolve => setTimeout(resolve, 50));
      }
      return chunks.join('');
    } catch (e) {
      setError(`Failed to get AI response: ${e.message}`);
      // Continue to next step on any error, only pause on button press
      setAutoProgress(true);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
     setAgentBoxClass("fixed bottom-0 left-0 right-0 bg-transparent z-50 w-full h-auto flex justify-center items-start");
     setStreamingContent("");
     setIsAccordionOpen(true);
     // Reset textarea height to prevent it from being tall during processing
     if (textareaRef) {
       textareaRef.style.height = '3rem';
     }
      startProcess(prompt());
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
    const improvedPrompt = `Improve this startup idea for better clarity, specificity, and market potential. Provide a concise response in simple English, in only 3 lines. Do not generate in markdown: ${prompt()}`;
    try {
      const result = await callLLM(improvedPrompt, 0, { streamToTextarea: true });
      await addMessage({ type: 'user', content: improvedPrompt });
      await addMessage({ type: 'ai', content: result });
      setPrompt(result);
    } catch (e) {
      // Error handled
    }
  };

  const handleSuggest = async () => {
    const suggestPrompt = `Suggest a compelling startup idea in the legal tech space. Provide a brief description, target market, and unique value proposition in simple English, in only 3 lines. Do not generate in markdown.`;
    try {
      const result = await callLLM(suggestPrompt, 0, { streamToTextarea: true });
      await addMessage({ type: 'user', content: suggestPrompt });
      await addMessage({ type: 'ai', content: result });
      setPrompt(result);
    } catch (e) {
      // Error handled
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



    onMount(async () => {
      // Load progress
      const progress = await loadProgress();
      if (progress) {
        setMachineStore(progress);
      }

      // Load tasks
      const loadedTasks = await getTasks();
      setTasksList(loadedTasks);

      // Set initial textarea height
      if (textareaRef) {
        textareaRef.style.height = 'auto';
        textareaRef.style.height = textareaRef.scrollHeight + 'px';
      }

      // Create Lucide icons after a delay to ensure script loaded
      setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
      }, 100);
    });

    createEffect(() => {
      machineStore.state;
      if (window.lucide) window.lucide.createIcons();
    });



     createEffect(() => {
      machineStore.context.completedSteps;
      machineStore.context.currentModel;
      if (window.lucide) window.lucide.createIcons();
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
         const t = elapsed * 0.001; // time in seconds

         // Smooth oscillating values using sine waves
         const x = Math.sin(t * 0.2) * 15; // -15 to 15
         const y = Math.sin(t * 0.1) * 12; // -12 to 12
         const blur = 25 + Math.sin(t * 0.3) * 15; // 10 to 40
         const spread = Math.sin(t * 0.15) * 5; // -5 to 5

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

   createEffect(() => {
     streamingContent();
     if (streamingRef) {
       streamingRef.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
     }
   });

   return (
     <div class="relative flex flex-col">
       <ResponseSection
         tasksList={tasksList}
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
       />
        <AgentInterface
          agentBoxClass={agentBoxClass}
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
          handleResume={handleResume}
        />
     </div>
   );
};

// Step names from machine
const stepNames = {
  step2: 'Problem Analysis',
  step3: 'Severity Assessment',
  step4: 'Current Solutions',
  step5: 'Solution Gaps',
  step6: 'User Persona',
  step7: 'Urgency Assessment',
  step8: 'Problem Validation',
  step9: 'Solution Design',
  step10: 'Value Proposition',
  step11: 'Key Features',
  step12: 'Business Model',
  step13: 'Revenue Streams',
  step14: 'Pricing Strategy',
  step15: 'Competitive Moats',
  step16: 'Risk Analysis',
  step17: 'Target Market',
  step18: 'Total Addressable Market',
  step19: 'Serviceable Available Market',
  step20: 'Serviceable Obtainable Market',
  validate_tam_sam_som: 'Market Validation',
  step21: 'Market Trends',
  step22: 'Competitive Landscape',
  step23: 'Market Entry',
  step24: 'Customer Acquisition',
  step25: 'Sales Strategy',
  step26: 'Customer Retention',
  step27: 'Revenue Logic',
  step28: 'Unit Economics',
  step29: 'Cost Structure',
  step30: 'Financial Projections',
  step31: 'Monthly Burn Rate',
  step32: 'Profitability Timeline',
  step33: 'Valuation Inputs',
  step34: 'Company Valuation',
  step35: 'Funding Stage',
  step36: 'Funding Amount',
  validate_deck_ask: 'Funding Validation',
  step37: 'Fund Allocation',
  step38: 'Pre-Money Valuation',
  validate_pre_money: 'Valuation Check',
  step39: 'Target Investors',
  step40: 'Funding Milestones',
  step41: 'Founding Team',
  step42: 'Team Gaps',
  step43: 'Hiring Plan',
  step44: 'Advisors & Board',
  step45: 'Legal Structure',
  step46: 'IP Protection',
  step47: 'Contracts & Compliance',
  step48: 'Legal Risks'
};

export default Tasks;