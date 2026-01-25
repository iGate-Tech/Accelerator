import {
    Show,
    For,
    createSignal,
    createEffect,
    createMemo,
    onMount,
    useContext
} from "solid-js";
import { logger } from '../lib/core';
import { LangContext } from "../context/LangContext";
import { useUser } from "../context/UserContext";
import { agentTranslations } from "../assets/translations/translations-index.js";

const AgentInterface = (props) => {
    const LogoIcon = ({
        className,
        fillColor,
        ...props
    }) => {
        const color = createMemo(() => typeof fillColor === 'function' ? fillColor() : fillColor);
        return (
            <svg class={className}
                viewBox="130 245 230 230"
                width="20"
                height="20"
                {...props}>
                <g>
                    <g>
                        <g id="Layer_1" transform="matrix(1, 0, 0, 1, 171.58522, 14.641378)">
                            <g transform="matrix(1, 0, 0, 1, 73.123965, -108.644679)">
                                <g transform="matrix(1, 0, 0, 1, -96.212367, 106.556072)"/>
                                <g transform="matrix(1, 0, 0, 1, -96.212367, 106.556072)"></g>
                            </g>
                            <g id="svg-1" transform="matrix(1, 0, 0, 1, 170.335073, 57.983076)">
                                <g transform="matrix(1, 0, 0, 1, -192.074377, 169.970846)"/>
                                <g transform="matrix(1, 0, 0, 1, -192.074377, 169.970846)"/>
                            </g>
                            <g transform="matrix(1, 0, 0, 1, 32.358464, 377.3195)">
                                <path fill={
                                        color()
                                    }
                                    id="object-0"/>
                                <path fill={
                                        color()
                                    }
                                    id="object-1"/>
                                <g transform="matrix(1, 0, 0, 1, -10.654114, -272.98291)" id="object-2">
                                    <path fill={
                                            color()
                                        }
                                        d="M 118.928 304.856 L 87.648 296.786 C 86.708 296.546 85.718 296.546 84.768 296.786 L -7.532 320.776 C -8.502 320.016 -9.722 319.566 -11.052 319.566 C -14.222 319.566 -16.792 322.136 -16.792 325.306 L -16.792 344.486 C -16.792 346.266 -15.972 347.936 -14.562 349.026 C -13.542 349.816 -12.312 350.226 -11.052 350.226 C -10.572 350.226 -10.082 350.166 -9.612 350.046 L 110.528 318.836 C 113.558 318.056 116.658 316.996 119.728 315.696 C 121.988 314.736 123.398 312.446 123.208 309.986 C 123.028 307.536 121.298 305.466 118.918 304.856 L 118.928 304.856 M 155.398 189.906 C 152.108 188.136 148.188 188.186 144.958 189.996 L 120.018 198.236 C 119.518 198.406 119.038 198.636 118.598 198.936 C 114.228 201.896 111.618 206.876 111.618 212.246 L 111.618 261.076 C 111.618 268.826 109.338 276.236 105.038 282.516 C 100.178 289.596 93.058 294.646 85.038 296.716 L 84.818 296.776 C 82.268 297.416 80.478 299.696 80.468 302.316 C 80.458 304.936 82.228 307.236 84.768 307.896 L 116.048 315.966 C 116.518 316.086 116.998 316.146 117.478 316.146 C 118.238 316.146 118.998 315.996 119.718 315.696 C 127.918 312.226 135.258 307.176 141.528 300.696 C 154.238 287.636 161.228 270.196 161.228 251.606 L 161.228 199.696 C 161.228 195.556 158.968 191.796 155.378 189.906 L 155.398 189.906"
                                        style="transform-box: fill-box; transform-origin: 52.7671% 51.533%;"/>
                                    <g>
                                        <g>
                                            <path fill={
                                                    color()
                                                }
                                                d="M 155.968 137.909 C 153.888 135.909 151.178 134.879 148.418 134.999 L 127.138 135.669 C 120.128 135.889 113.108 136.899 106.278 138.679 L -8.462 168.479 C -19.172 171.269 -29.047 176.869 -37.047 184.719 C -37.047 184.719 -37.057 184.739 -37.077 184.749 C -38.337 185.999 -39.527 187.269 -40.587 188.539 C -41.857 190.049 -42.277 192.099 -41.667 193.979 C -41.077 195.859 -39.557 197.299 -37.637 197.789 L -7.522 205.559 C -7.042 205.679 -6.562 205.739 -6.092 205.739 C -4.092 205.739 -2.192 204.689 -1.152 202.919 C -1.142 202.899 -1.132 202.889 -1.132 202.889 C 0.358 200.779 2.108 198.859 4.068 197.189 C 7.648 194.109 11.778 191.949 16.328 190.769 L 151.338 155.699 C 155.948 154.499 159.168 150.299 159.168 145.499 C 159.168 142.669 158.008 139.919 155.945 137.899 L 155.968 137.909 Z M -0.692 198.029 C -1.342 196.269 -2.822 194.939 -4.642 194.469 L -34.757 186.699 C -36.857 186.159 -39.087 186.849 -40.527 188.479 C -51.137 200.649 -56.977 216.409 -56.977 232.859 L -56.977 330.119 C -56.977 336.449 -52.757 341.959 -46.697 343.539 L -18.962 350.689 C -17.882 350.989 -16.722 351.139 -15.522 351.139 C -14.322 351.139 -13.212 350.989 -12.102 350.699 L -11.612 350.569 C -9.102 349.899 -7.362 347.619 -7.362 345.029 L -7.362 222.569 C -7.362 215.579 -5.292 208.919 -1.372 203.299 C -0.292 201.759 -0.042 199.789 -0.692 198.019 L -0.692 198.029 Z"/>
                                        </g>
                                    </g>
                                </g>
                            </g>
                        </g>
                    </g>
                </g>
            </svg>
        );
    };

    const selectedTaskIdValue = createMemo(() => {
        const sid = props.selectedTaskId;
        if (typeof sid === 'function') {
            return sid();
        }
        return sid;
    });

    const isLoading = () => {
        if (!props.tasksList) return false;
        if (!props.agentStore) return false;
        return false;
    };

    if (isLoading()) {
        return (
            <div id="agentBox" class="flex flex-col rounded-lg w-full">
                <div class="flex items-center justify-center h-64">
                    <div class="loading loading-spinner loading-lg text-primary"></div>
                    <span class="ms-4 text-lg">
                        {
                        agentTranslations.en.loadingAgentInterface
                    }</span>
                </div>
            </div>
        );
    }

    const langContext = useContext(LangContext);
    const userContext = useUser();

    const {lang} = langContext || {
        lang: () => 'en'
    };
    const {user, isAuthenticated} = userContext || {
        user: () => null,
        isAuthenticated: () => false
    };

    const [currentLang, setCurrentLang] = createSignal(lang ? lang() : 'en');
    const [selectedMode, setSelectedMode] = createSignal('Accelerator Mode');

    const modeColors = {
        'Accelerator Mode': '#9e28b5',
        'Services Mode': '#00a7e0',
        'Venture Mode': '#6cd14d',
        'Studio Mode': '#ffc600',
        'General Mode': 'gray'
    };



    const t = createMemo(() => {
        const langKey = currentLang();
        const translations = agentTranslations[langKey] || agentTranslations.en;
        return translations;
    });



    createEffect(() => {
        if (lang) {
            setCurrentLang(lang());
        }
    });

    let greetingRef;
    let textareaRef;

    onMount(() => {
        const greetingText = greetingRef.querySelector("h1");
        if (greetingText) {
          // TODO: Handle greeting text
        }

    });

    const userName = () => {
        try {
            const userData = user ? user() : null;
            return userData ?. profile ?. name || userData ?. email ?. split("@")[0] || "User";
        } catch (error) {
            logger.error("Error getting user name:", error);
            return "User";
        }
    };

    const uiState = () => props.agentStore ?. uiState ?. () || 'idle';
    
    const placeholderText = createMemo(() => {
        const hasProject = props.currentProjectId && props.currentProjectId();
        if (selectedTaskIdValue()) {
            return 'Enter instructions for selected task...';
        } else if (hasProject) {
            return 'Select a task above to give instructions';
        }
        return t().agentPlaceholder;
    });

    return (
        <div id="agentBox"
            class={
                `${
                    props.agentBoxClass()
                } w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-3xl mx-auto`
            }
            style={
                (props.startPressed && props.startPressed()) || (props.tasksList && props.tasksList().length > 0) || (props.currentProjectId && props.currentProjectId()) ? "position: fixed !important; bottom: 10px !important; z-index: 50 !important;" : ""
            }>

            <div id="agentContent"
                class={
                    props.agentContentClass ? props.agentContentClass() : ""
            }>

                <div class="flex flex-col gap-3 sm:gap-4">
                     <Show when={
                         isAuthenticated() && !(props.startPressed && props.startPressed()) && !(props.tasksList && props.tasksList().length > 0) && !(props.currentProjectId && props.currentProjectId())
                     }>
                        <div ref={greetingRef}
                            id="greetingDiv"
                            class="text-center fade-in px-2">
                            <h1 class="text-base sm:text-xl md:text-2xl font-sans font-light mb-2 sm:mb-2 truncate">
                                 <span class="text-base-content">
                                      {
                                      t().greetingPrefix
                                  }</span>
                                  <span class="ms-1" style="color:#00a7e0">
                                      {
                                      userName()
                                  }</span>
                                 <span class="text-base-content">
                                     {
                                     t().greetingSuffix
                                 }</span>
                            </h1>
                        </div>
                    </Show>

                    <div class="">
                        <div class="card overflow-visible shadow">
                            <div class="card-body relative p-0 !gap-0 overflow-visible">



                                <div class="btnshadow p-[1px] overflow-visible">
                                    <form id="taskForm" class="p-3 sm:p-4 bg-base-100 border border-base-200 rounded-box overflow-visible">
                                        <input type="hidden" name="action" id="action" value="send"/>
                                        <input type="hidden" name="taskContent" value=""/>
                                        <input type="hidden" name="taskTimestamp"
                                            value={
                                                new Date().toLocaleString()
                                            }/>
                                          <Show when={selectedTaskIdValue()}>
                                              <div class="mb-2 flex items-center gap-2 flex-wrap">
                                                  <span class="badge badge-info break-words">Selected Task: {(() => {
                                                      const task = props.tasksList?.().find(t => t.id === selectedTaskIdValue());
                                                      return task?.title || 'Unknown';
                                                  })()}</span>
                                                   <button
                                                       type="button"
                                                       class="btn btn-xs btn-ghost btn-circle min-h-[32px] w-8"
                                                       onClick={() => {
                                                           props.setSelectedTaskId && props.setSelectedTaskId(null);
                                                           props.setInstructPrompt && props.setInstructPrompt('');
                                                       }}
                                                       title="Deselect task"
                                                   >
                                                      ×
                                                  </button>
                                              </div>
                                          </Show>
                                           <textarea ref={textareaRef}
                                                rows="1"
                                                name="prompt"
                                                id="promptTextarea"
                                                class={
                                                    `text-base sm:text-lg text-base-content w-full focus:ring-0 active:ring-0 ${
                                                        uiState() === 'processing' ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`
                                                }
                                                style="resize: none; overflow: hidden; box-sizing: border-box;"
                                                 placeholder={placeholderText()}
                                               value={
                                                   selectedTaskIdValue() ? (props.instructPrompt?.() ?? '') : (props.prompt ? props.prompt() : "")
                                               }
                                               onInput={
                                                   (e) => {
                                                       if (selectedTaskIdValue() && props.setInstructPrompt) {
                                                           props.setInstructPrompt(e.target.value);
                                                       } else {
                                                           props.setPrompt(e.target.value);
                                                       }
                                                   }
                                               }
                                              onKeyDown={
                                                  (e) => {
                                                      if (e.key === "Enter" && !e.shiftKey) {
                                                          e.preventDefault();
                                                          const hasProject = props.currentProjectId && props.currentProjectId();
                                                          if (selectedTaskIdValue() && hasProject) {
                                                              props.handleInstructSubmit && props.handleInstructSubmit();
                                                          } else if (hasProject) {
                                                              // Project open but no task selected - do nothing
                                                              console.log('[AgentInterface] Project open, please select a task first');
                                                          } else {
                                                              // No project - create new one
                                                              props.handleStart && props.handleStart();
                                                          }
                                                      }
                                                  }
                                              }
                                             disabled={
                                                 uiState() === 'processing'
                                         }></textarea>

                                      <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mt-2 overflow-visible">

                                          <div class="flex gap-2 overflow-visible">
                                              <div class="flex gap-2 overflow-visible">
                                                  <button type="button" class="select text-base-content/50 pr-4 sm:pr-8 py-1 rounded-full flex items-center gap-1 flex gap-3 transition h-8 sm:h-6 cursor-pointer border-0 text-sm" popovertarget="mode-popover-1" style="anchor-name:--mode-anchor-1">
                                                      <LogoIcon fillColor={() => modeColors[selectedMode()] || 'gray'}/> {selectedMode()}
                                                  </button>
                                                  <ul class="dropdown menu w-full sm:w-52 rounded-box bg-base-100 shadow-sm max-w-[90vw]" popover id="mode-popover-1" style="position-anchor:--mode-anchor-1">
                                                       <For each={
                                                           [
                                                               'General Mode',
                                                               'Accelerator Mode',
                                                               'Services Mode',
                                                               'Venture Mode',
                                                               'Studio Mode'
                                                           ]
                                                       }>
                                                           {(mode) => (
                                                               <li>
                                                                   <button type="button" class="flex items-center flex gap-3 gap-2 px-3 py-2 hover:bg-base-200 w-full text-left text-base-content/50 cursor-pointer"
                                                                       onClick={
                                                                           (e) => {
                                                                               e.preventDefault();
                                                                               setSelectedMode(mode);
                                                                           }
                                                                   }>
                                                                       <LogoIcon fillColor={
                                                                           modeColors[mode]
                                                                       }/> {mode} </button>
                                                               </li>
                                                           )}
                                                       </For>
                                                  </ul>
                                              </div>


                                          </div>

                                              <button
                                                  type="button"
                                                  class="btn btn-ghost btn-md sm:btn-sm btn-circle min-h-[44px] sm:min-h-auto"
                                                  onClick={() => {
                                                      const hasProject = props.currentProjectId && props.currentProjectId();
                                                      if (selectedTaskIdValue() && hasProject) {
                                                          props.handleInstructSubmit && props.handleInstructSubmit();
                                                      } else if (hasProject) {
                                                          // Project open but no task selected - do nothing
                                                          console.log('[AgentInterface] Project open, please select a task first');
                                                      } else {
                                                          // No project - create new one
                                                          props.handleStart && props.handleStart();
                                                      }
                                                  }}
                                                  disabled={uiState() === 'processing' || (props.currentProjectId && props.currentProjectId() && !selectedTaskIdValue())}
                                                  title={selectedTaskIdValue() ? 'Send Instructions' : (props.currentProjectId && props.currentProjectId()) ? 'Select a task first' : 'Start'}
                                              >
                                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                  <line x1="12" y1="19" x2="12" y2="5"></line>
                                                  <polyline points="5,12 12,5 19,12"></polyline>
                                              </svg>
                                          </button>

                                     </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};

export default AgentInterface;
