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

    const shouldShowFormContent = () => {
        const state = props.machineStore.state;
        const tasks = props.tasksList ?. ();
        const hasTasks = tasks && Array.isArray(tasks) && tasks.length > 0;
        return ! hasTasks && (state === "idle" || state === "processing");
    };

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

    createEffect(() => {
        console.log('AgentInterface: currentProject signal changed', currentProject());
    });

    // Animation refs
    let greetingRef;
    let cardRef;
    let textareaRef;
    let buttonsRef;
    let badgeRef;

    const t = () => {
        const langKey = currentLang();
        const langTranslations = translations[langKey];
        if (! langTranslations) {
            logger.warn('AgentInterface: No translations found for language:', langKey);
            return translations.en || {}; // Fallback to English
        }
        return langTranslations;
    };

    createEffect(() => {
        setCurrentLang(lang());
    });

    createEffect(() => {
        if (props.projectData) {
            const proj = props.projectData();
            console.log('AgentInterface: setting currentProject', proj);
            setCurrentProject(proj);
        } else {
            console.log('AgentInterface: setting currentProject to null');
            setCurrentProject(null);
        }
    });

    // Auto-resize textarea when prompt changes
    createEffect(() => {
        console.log('AgentInterface: prompt changed to', props.prompt ? props.prompt() : 'undefined');
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
            const name = userData ?. profile ?. name;
            if (name) {
                return name.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
            }
            // Fallback to email or "User"
            const email = userData ?. email;
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
                }`
        }>

            <div id="agentContent"
                class={
                    props.agentContentClass ? props.agentContentClass() : ""
            }>
                <div class="flex flex-col gap-4">
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
                    <div class="btnshadow p-[3px]">
                    <div ref={cardRef}
                        class=" card  bg-base-100 border border-base-200 rounded-box "
                        onMouseEnter={handleCardHover}
                        onMouseLeave={handleCardLeave}>
                        <div class="card-body relative p-4 !gap-0">
                            <Show when={
                                props.currentProjectId && props.currentProjectId() !== null && props.tasksList && (props.tasksList().length > 0 || (props.machineStore && props.machineStore.state === "processing"))
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
                                    }/>
                            </Show>
                            {/* Form */}
                            <Show when={
                                props.tasksList && props.tasksList().length === 0
                            }>
                                <form id="taskForm">
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
                                            `custom-textarea text-base-content text-lg sm:text-xl md:text-2xl placeholder:text-base-content placeholder:text-lg sm:placeholder:text-xl md:placeholder:text-2xl focus:ring-0 active:ring-0 ${
                                                props.machineStore.state !== "idle" ? "opacity-50 cursor-not-allowed" : ""
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
                                                    if (props.machineStore && props.machineStore.state === "idle") {
                                                        handleButtonPress(e.target.closest("form").querySelector('button[type="button"]:last-child'),);
                                                        props.handleStart && props.handleStart();
                                                    }
                                                }
                                            }
                                        }
                                        disabled={
                                            props.machineStore ? props.machineStore.state !== "idle" : true
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
                                    props.machineStore.context ?. uiMessage || 'Unknown error occurred'
                                } </div>
                            </Show>
                            <div ref={buttonsRef}
                                class="flex justify-between items-center mt-2">
                                <div class="flex gap-2">
                                    <Show when={
                                        props.machineStore && props.machineStore.state === "idle"
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
                                    </Show>
                                </div>
                                <div class="flex gap-2">
                                    <Show when={
                                        props.machineStore && props.machineStore.state === "idle"
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
                        </form>
                    </Show>
                </div>
            </div>
            </div>
        </div>
    </div>
</div>
    );
};

export default AgentInterface;
