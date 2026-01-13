import { Show, createSignal, createEffect, onMount, useContext } from "solid-js";

import logger from '../../../lib/logger.js';
import ProgressAccordion from "../../ui/ProgressAccordion";
import {getProjectById} from "../../../lib/db";
import {LangContext} from "../../../context/LangContext";
import {translations} from "../../../assets/translations/translations-index.js";
import {useUser} from "../../../context/UserContext";

const AgentInterface = (props) => {
    const shouldShowFormContent = () => {
        const state = props.machineStore.state;
        const tasks = props.tasksList ?. ();
        const hasTasks = tasks && Array.isArray(tasks) && tasks.length > 0;
        return !hasTasks && (state === "idle" || state === "processing");
    };
    const {lang} = useContext(LangContext);
    const {user} = useUser();
    const [currentLang, setCurrentLang] = createSignal(lang());
    const [currentProject, setCurrentProject] = createSignal(null);

    // Animation refs
    let greetingRef;
    let cardRef;
    let textareaRef;
    let buttonsRef;
    let badgeRef;

    const t = () => translations[currentLang()];

    createEffect(() => {
        setCurrentLang(lang());
    });

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

    createEffect(() => {
        if (props.currentProjectId()) {
            getProjectById(props.currentProjectId()).then((project) => {
                logger.debug("Fetched project in AgentInterface:", project);
                setCurrentProject(project);
            });
        }
    });

    // Animate state changes
    createEffect(() => {
        const state = props.machineStore.state;
        if (badgeRef) {
            // Animation removed
        }
            // Continuous animations based on state
            if (state === "processing") {
                // Animation removed
            } else if (state === "completed") {
                // Animation removed
            } else if (state === "idle") { // Subtle breathing effect
                // Animation removed
            }
    });

    // Button press animations
    const handleButtonPress = (buttonRef) => {
        // Animation removed
    };

    const userName = () => {
        const name = user()?.profile?.name;
        return name ? name.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") : "";
    };

    // Button hover animations
    const handleButtonHover = (buttonRef) => {
        // Animation removed
    };

    const handleButtonLeave = (buttonRef) => {
        // Animation removed
    };

    // Card hover effect
    const handleCardHover = () => {
        // Animation removed
    };

    const handleCardLeave = () => {
        // Animation removed
    };

    const handleTextareaFocus = () => { // Handle textarea focus if needed
    };

    const handleTextareaBlur = () => { // Handle textarea blur if needed
    };

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
                        props.agentContentClass()
                }>
                    <div class="flex flex-col gap-4">
                        <div ref={greetingRef}
                            id="greetingDiv"
                            class={
                                props.greetingClass()
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
                        <div ref={cardRef}
                            class="card bg-base-100 border border-base-200 rounded-box"
                            onMouseEnter={handleCardHover}
                            onMouseLeave={handleCardLeave}>
                            <div class="card-body relative p-4 !gap-0">
                                <Show when={
                                    props.currentProjectId() !== null && props.tasksList().length > 0
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
                                                props.prompt()
                                            }
                                            onInput={
                                                (e) => {
                                                    props.setPrompt(e.target.value);
                                                    if (props.textareaRef) {
                                                        // Animation removed
                                                    }
                                                }
                                            }
                                            onFocus={handleTextareaFocus}
                                            onBlur={handleTextareaBlur}
                                            onKeyDown={
                                                (e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault();
                                                        if (props.machineStore.state === "idle") {
                                                            handleButtonPress(e.target.closest("form").querySelector('button[type="button"]:last-child'),);
                                                            props.handleStart();
                                                        }
                                                    }
                                                }
                                            }
                                            disabled={
                                                props.machineStore.state !== "idle"
                                        }></textarea>
                                <Show when={
                                    props.machineStore.state === "pause"
                                }>
                                    <div class="text-warning text-sm mt-2">
                                        {
                                        t().agentPaused
                                    }</div>
                                </Show>
                                <div ref={buttonsRef}
                                    class="flex justify-between items-center mt-2">
                                    <div class="flex gap-2">
                                        <Show when={
                                            props.machineStore.state === "idle"
                                        }>
                                            <button type="button"
                                                onClick={
                                                    (e) => {
                                                        handleButtonPress(e.currentTarget);
                                                        props.handleImprove();
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
                                            props.machineStore.state === "idle"
                                        }>
                                            <button type="button"
                                                onClick={
                                                    (e) => {
                                                        handleButtonPress(e.currentTarget);
                                                        props.handleReset();
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
                                                        props.handleStart();
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
                     </div>
                 </div>
                </div>
            </div>
        </div>
    );
};

export default AgentInterface;
