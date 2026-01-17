import {
    Show,
    createSignal,
    createEffect,
    onMount,
    useContext
} from "solid-js";

import logger from '../../../lib/logger.js';
import ProgressAccordion from "../../ui/ProgressAccordion";

import {LangContext} from "../../../context/LangContext";
import {translations} from "../../../assets/translations/translations-index.js";
import {useUser} from "../../../context/UserContext";

const AgentInterface = (props) => { // Defensive checks for required props
    if (!props.machineStore || !props.tasksList || !props.agentBoxClass || !props.agentContentClass || !props.greetingClass) {
        logger.warn('AgentInterface: Missing required props, showing loading state');
        return (
            <div id="agentBox" class="flex flex-col rounded-lg mx-auto max-w-6xl">
                <div class="flex items-center justify-center h-64">
                    <div class="loading loading-spinner loading-lg text-primary"></div>
                    <span class="ml-4 text-lg">Loading agent interface...</span>
                </div>
            </div>
        );
    }


    // Context with fallbacks
    const langContext = useContext(LangContext);
    const userContext = useUser();

    const {lang} = langContext || {
        lang: () => 'en'
    };
    const {user} = userContext || {
        user: () => null
    };

    const [currentLang, setCurrentLang] = createSignal(lang ? lang() : 'en');
    const [currentProject, setCurrentProject] = createSignal(null);
    const [forceShowForm, setForceShowForm] = createSignal(false);

    createEffect(() => {
        if (props.projectData) {
            setCurrentProject(props.projectData());
        } else {
            setCurrentProject(null);
        }
    });

    createEffect(() => {
        forceShowForm();
    });

    let greetingRef;
    let cardRef;
    let textareaRef;
    let buttonsRef;
    let badgeRef;

    const t = () => {
        const langKey = currentLang();
        const langTranslations = translations[langKey];
        if (!langTranslations) {
            return translations.en || {};
        }
        return langTranslations;
    };

    // Auto-resize textarea when prompt changes
    createEffect(() => {
        props.prompt(); // Track prompt changes
        if (textareaRef && textareaRef.style) {
            textareaRef.style.height = 'auto';
            textareaRef.style.height = textareaRef.scrollHeight + 'px';
        }
    });

    // Initial animations
    onMount(() => {
        const greetingText = greetingRef.querySelector("h1");
        if (greetingText) {}


    });



    // Animate state changes
    createEffect(() => {
        const state = props.machineStore.state;
        if (badgeRef) { // Animation removed
        }
        // Continuous animations based on state
        if (state === "processing") { // Animation removed
        } else if (state === "completed") { // Animation removed
        } else if (state === "idle") {
            // Subtle breathing effect
            // Animation removed
        }
    });

    // Button press animations
    const handleButtonPress = (buttonRef) => { // Animation removed
    };

    const userName = () => {
        try {
            const userData = user ? user() : null;
            const name = userData?.profile?.name;
            if (name) {
                return name.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
            }
            // Fallback to email or "User"
            const email = userData?.email;
            if (email) {
                return email.split("@")[0]; // Username part of email
            }
            return "User";
        } catch (error) {
            logger.error("Error getting user name:", error);
            return "User";
        }
    };

    // Button hover animations
    const handleButtonHover = (buttonRef) => { // Animation removed
    };

    const handleButtonLeave = (buttonRef) => { // Animation removed
    };

    // Card hover effect
    const handleCardHover = () => { // Animation removed
    };

    const handleCardLeave = () => { // Animation removed
    };

    const handleTextareaFocus = () => { // Handle textarea focus if needed
    };

    const handleTextareaBlur = () => { // Handle textarea blur if needed
    };

    // Show loading state if essential data is not ready
    const isLoading = () => {
        if (!props.currentProjectId()) 
            return false;
         // No loading when no project selected
        return !props.machineStore || !props.tasksList || currentLang() === undefined;
    };

    if (isLoading()) {
        return (
            <div id="agentBox" class="flex flex-col rounded-lg mx-auto max-w-6xl">
                <div class="flex items-center justify-center h-64">
                    <div class="loading loading-spinner loading-lg text-primary"></div>
                    <span class="ml-4 text-lg">Initializing agent interface...</span>
                </div>
            </div>
        );
    }

    return (
        <div id="agentBox"
            class={
                `${
                    props.agentBoxClass()
                } ${
                    currentLang() === "ar" ? "rtl" : "ltr"
                } w-full`
            }
            style={
              (props.startPressed && props.startPressed()) ||
              (props.tasksList && props.tasksList().length > 0)
                ? "position: fixed !important; bottom: 10px !important; left: 50% !important; transform: translateX(-50%) !important; width: calc(100% - 40px) !important; max-width: 56rem !important; z-index: 50 !important;" : ""
            }>

            <div id="agentContent"
                class={
                    props.agentContentClass ? props.agentContentClass() : ""
            }>
                <div class="flex flex-col gap-4">
                    <Show when={!(props.startPressed && props.startPressed()) && !(props.tasksList && props.tasksList().length > 0)}>
                        <div ref={greetingRef}
                            id="greetingDiv"
                            class={
                                props.greetingClass ? props.greetingClass() : ""
                        }>
                            <h1 class="text-2xl sm:text-3xl md:text-4xl font-sans font-light mb-2 sm:mb-2">
                                <span class="text-base-content">
                                    {
                                    t().greetingPrefix
                                }</span>
                                {" "}
                                <span class="text-primary">
                                    {
                                    userName()
                                }</span>
                                <span class="text-base-content">
                                    {
                                    t().greetingSuffix
                                }</span>
                            </h1>
                        </div>
                        {/* Always visible Chat with AI button */}
                        <Show when={props.machineStore.state !== 'chatting'}>
                            <button type="button"
                                onClick={
                                    (e) => {
                                        console.log('Chat button clicked');
                                        handleButtonPress(e.currentTarget);
                                        if (props.handleEnterChat) {
                                            props.handleEnterChat();
                                        } else {
                                            console.log('handleEnterChat prop is undefined');
                                        }
                                    }
                                }
                                onMouseEnter={
                                    (e) => handleButtonHover(e.currentTarget)
                                }
                                onMouseLeave={
                                    (e) => handleButtonLeave(e.currentTarget)
                                }
                                class="bg-info/10 text-info px-4 py-2 rounded-full flex items-center gap-2 text-sm hover:bg-info/20 transition cursor-pointer mx-auto">
                                <i data-lucide="message-circle" class="w-4 h-4"></i>
                                Chat with AI
                            </button>
                        </Show>
                    </Show>
                    {/* Chat Interface - Always accessible */}
                    <Show when={props.machineStore.state === "chatting"}>
                        <div class="chat-interface p-4 bg-base-200 rounded-lg">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-sm font-semibold text-info flex items-center gap-2">
                                    <i data-lucide="message-circle" class="w-4 h-4"></i>
                                    Chat with AI
                                </h3>
                                <button 
                                    type="button"
                                    onClick={props.handleExitChat}
                                    class="bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-1.5 text-xs hover:bg-success/20 transition cursor-pointer">
                                    <i data-lucide="play" class="w-3 h-3"></i>
                                    Resume Accelerator
                                </button>
                            </div>
                            {/* Chat Messages */}
                            <div class="chat-messages max-h-80 overflow-y-auto space-y-3 mb-3 p-4 bg-base-100 rounded-lg">
                                <For each={props.machineStore.context?.chatMessages || []}>
                                    {(message) => (
                                        <div class={`chat ${message.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                                            <div class={`chat-bubble text-xs ${message.role === 'user' ? 'bg-primary text-primary-content' : 'bg-base-300'}`}>
                                                <div class="whitespace-pre-wrap">{message.content}</div>
                                                <div class="text-[10px] opacity-50 mt-1">
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </For>
                                <Show when={props.isLoading && props.isLoading() && props.streamingContent && props.streamingContent()}>
                                    <div class="chat chat-start">
                                        <div class="chat-bubble bg-base-300 text-xs animate-pulse">
                                            Thinking...
                                        </div>
                                    </div>
                                </Show>
                                <Show when={!props.machineStore.context?.chatMessages?.length}>
                                    <div class="text-center text-sm opacity-50 py-4">
                                        Ask me anything about your project or request changes...
                                    </div>
                                </Show>
                            </div>
                            {/* Chat Input */}
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const input = e.target.elements.chatInput;
                                if (input.value.trim()) {
                                    props.handleSendChatMessage(input.value.trim());
                                    input.value = '';
                                }
                            }}>
                                <div class="flex gap-2">
                                    <input 
                                        type="text"
                                        name="chatInput"
                                        id="chatInput"
                                        class="flex-1 text-base-content text-sm w-full px-3 py-2 bg-base-100 border border-base-300 rounded-lg focus:ring-0 focus:border-primary"
                                        placeholder="Ask about your project or give instructions..."
                                        disabled={props.isLoading && props.isLoading()}
                                    />
                                    <button 
                                        type="submit"
                                        disabled={props.isLoading && props.isLoading()}
                                        class="bg-primary/10 text-primary px-4 py-2 rounded-lg flex items-center gap-1 text-xs hover:bg-primary/20 transition cursor-pointer disabled:opacity-50">
                                        <i data-lucide="send" class="w-3 h-3"></i>
                                        Send
                                    </button>
                                </div>
                            </form>
                            <div class="text-[10px] opacity-50 mt-1 text-center">
                                Chat uses 5 credits per message
                            </div>
                        </div>
                    </Show>
                    <div class="">
                    <div ref={cardRef}
                        class=" card"
                        onMouseEnter={handleCardHover}
                        onMouseLeave={handleCardLeave}>
                        <div class="card-body relative p-0 !gap-0">
                              <Show when={
                                  props.currentProjectId && props.currentProjectId() !== null &&
                                  (props.startPressed && props.startPressed() ||
                                   (props.tasksList && props.tasksList().length > 0))
                              }>
                                  <ProgressAccordion machineStore={
                                          props.machineStore
                                      }
                                      project={
                                          currentProject()
                                      }
                                      isAccordionOpen={
                                          props.isAccordionOpen
                                      }
                                      setIsAccordionOpen={
                                          props.setIsAccordionOpen
                                      }
                                      isLoading={
                                          props.isLoading
                                      }
                                      handlePause={
                                          props.handlePause
                                      }
                                       handleResume={
                                           props.handleResume
                                       }
                                       handleEnterChat={
                                           props.handleEnterChat
                                       }
                                       handleToggleForm={
                                           () => setForceShowForm(!forceShowForm())
                                       }/>
                              </Show>
                              <Show when={props.machineStore.state === "processing" && props.streamingContent && props.streamingContent().trim()}>
                                  <div class="mt-4 p-4 bg-base-200 rounded-lg">
                                      <h3 class="text-sm font-semibold mb-2">AI Processing...</h3>
                                      <div class="text-sm whitespace-pre-wrap">{props.streamingContent()}</div>
                                  </div>
                              </Show>
                               {/* Form */}
                              <div class="btnshadow p-[1px]">
                                 <form id="taskForm" class="p-4  bg-base-100 border border-base-200 rounded-box ">
                                    <input type="hidden" name="action" id="action" value="send"/>
                                    <input type="hidden" name="taskContent" value=""/>
                                    <input type="hidden" name="taskTimestamp"
                                        value={
                                            new Date().toLocaleString()
                                        }/>
                                    <input type="hidden" name="taskModel" value="Llama-3.2-3B-Free"/>
                                    <textarea ref={textareaRef}
                                        name="prompt"
                                        id="promptTextarea"
                                        class={
                                            `   text-base-content text-lg  w-full  focus:ring-0 active:ring-0 ${
                                                props.machineStore.state === "processing" ? "opacity-50 cursor-not-allowed" : ""
                                            }`
                                        }
                                        style="resize: none; overflow: hidden; min-height: 3rem; box-sizing: border-box;"
                                        placeholder={
                                            t().placeholder
                                        }
                                        value={
                                            props.prompt ? props.prompt() : ""
                                        }
                                        onInput={
                                            (e) => {
                                                props.setPrompt(e.target.value);
                                                if (props.textareaRef) { // Animation removed
                                                }
                                            }
                                        }
                                        onFocus={handleTextareaFocus}
                                        onBlur={handleTextareaBlur}
                                        onKeyDown={
                                            (e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (props.machineStore && (props.machineStore.state === "idle" || props.machineStore.state === "completed")) {
                                                        handleButtonPress(e.target.closest("form").querySelector('button[type="button"]:last-child'),);
                                                        props.handleStart && props.handleStart();
                                                    }
                                                }
                                            }
                                        }
                                        disabled={
                                            props.machineStore ? props.machineStore.state === "processing" : true
                                        }></textarea>
                            <Show when={
                                props.machineStore && props.machineStore.state === "pause"
                            }>
                                <div class="text-warning text-sm mt-2">
                                    {
                                    t().agentPaused
                                }</div>
                            </Show>
                            <Show when={
                                props.machineStore && props.machineStore.state === "error"
                            }>
                                <div class="text-error text-sm mt-2">
                                    Processing error: {
                                    props.machineStore.context?.uiMessage || 'Unknown error occurred'
                                } </div>
                            </Show>
                            <div ref={buttonsRef}
                                class="flex justify-between items-center mt-2">
                                <div class="flex gap-2">
                                    <Show when={
                                        props.machineStore && (props.machineStore.state === "idle" || props.machineStore.state === "completed")
                                    }>
                                        <button type="button"
                                            onClick={
                                                (e) => {
                                                    handleButtonPress(e.currentTarget);
                                                    props.handleImprove && props.handleImprove();
                                                }
                                            }
                                            onMouseEnter={
                                                (e) => handleButtonHover(e.currentTarget)
                                            }
                                            onMouseLeave={
                                                (e) => handleButtonLeave(e.currentTarget)
                                            }
                                            class="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-primary/20 transition cursor-pointer">
                                            <i data-lucide="sparkles" class="w-3 h-3"></i>
                                            <span class="hidden sm:inline">
                                                {
                                                t().improveWithAI
                                            } </span>
                                        </button>
                                        <button type="button"
                                            onClick={
                                                (e) => {
                                                    logger.debug('AgentInterface: Suggest button clicked');
                                                    handleButtonPress(e.currentTarget);
                                                    props.handleSuggest();
                                                }
                                            }
                                            onMouseEnter={
                                                (e) => handleButtonHover(e.currentTarget)
                                            }
                                            onMouseLeave={
                                                (e) => handleButtonLeave(e.currentTarget)
                                            }
                                            class="bg-secondary/10 text-secondary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-secondary/20 transition cursor-pointer">
                                            <i data-lucide="lightbulb" class="w-3 h-3"></i>
                                            <span class="hidden sm:inline">
                                                {
                                                t().aiSuggestion
                                            }</span>
                                        </button>
                                        <Show when={props.machineStore.state !== 'chatting'}>
                                            <button type="button"
                                                onClick={
                                                    (e) => {
                                                        handleButtonPress(e.currentTarget);
                                                        props.handleEnterChat && props.handleEnterChat();
                                                    }
                                                }
                                                onMouseEnter={
                                                    (e) => handleButtonHover(e.currentTarget)
                                                }
                                                onMouseLeave={
                                                    (e) => handleButtonLeave(e.currentTarget)
                                                }
                                                class="bg-info/10 text-info px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-info/20 transition cursor-pointer">
                                                <i data-lucide="message-circle" class="w-3 h-3"></i>
                                                <span class="hidden sm:inline">Chat with AI</span>
                                            </button>
                                        </Show>
                                    </Show>
                                </div>
                                <div class="flex gap-2">
                                    <Show when={
                                        props.machineStore && (props.machineStore.state === "idle" || props.machineStore.state === "completed")
                                    }>
                                        <button type="button"
                                            onClick={
                                                (e) => {
                                                    handleButtonPress(e.currentTarget);
                                                    props.handleReset && props.handleReset();
                                                }
                                            }
                                            onMouseEnter={
                                                (e) => handleButtonHover(e.currentTarget)
                                            }
                                            onMouseLeave={
                                                (e) => handleButtonLeave(e.currentTarget)
                                            }
                                            class="bg-error/10 text-error px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-error/20 transition cursor-pointer">
                                            <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                                            <span class="hidden sm:inline">
                                                {
                                                t().reset
                                            }</span>
                                        </button>
                                         <button type="button"
                                              onClick={
                                                  (e) => {
                                                      handleButtonPress(e.currentTarget);
                                                      props.handleStart && props.handleStart();
                                                  }
                                              }
                                            onMouseEnter={
                                                (e) => handleButtonHover(e.currentTarget)
                                            }
                                            onMouseLeave={
                                                (e) => handleButtonLeave(e.currentTarget)
                                            }
                                            class="bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-success/20 transition cursor-pointer">
                                            <i data-lucide="play" class="w-3 h-3"></i>
                                            <span class="hidden sm:inline">
                                                {
                                                t().start
                                            }</span>
                                        </button>
                                    </Show>
                                </div>
                            </div>
                        </form></div>
                </div>
            </div>
            </div>
        </div>
    </div>
</div>
    );
};

export default AgentInterface;
