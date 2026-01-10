 import { Show, For, createMemo, createEffect, useContext, onMount } from "solid-js";
 import { createSignal } from "solid-js";
  // import { animate as anime, stagger } from 'animejs';
  const anime = () => {}; // dummy function to avoid errors
    import { machineStore, stepOrder, modelCumul } from "../../../lib/machine";
   import ProgressAccordion from "../../ui/ProgressAccordion";
   import { getProjectById } from "../../../lib/db";
   import { LangContext } from "../../../context/LangContext";
   import { translations } from "../../../assets/translations/translations-index.js";

const getBadgeClass = () => {
  const classes = {
    idle: 'badge-neutral',
    processing: 'badge-primary',
    pause: 'badge-warning',
    completed: 'badge-success'
  };
  return classes[machineStore.state] || 'badge-neutral';
};

const getStateIcon = () => {
  const icons = {
    idle: 'clock',
    processing: 'cog',
    pause: 'pause-circle',
    completed: 'check'
  };
  return icons[machineStore.state] || 'help-circle';
};

const AgentInterface = (props) => {
      const { lang } = useContext(LangContext);
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

       // Initial animations
       onMount(() => {
         // Animate greeting fade in with letter stagger
         const greetingText = greetingRef.querySelector('h1');
         if (greetingText) {
           const letters = greetingText.innerText.split('');
           greetingText.innerHTML = letters.map(letter => `<span class="letter">${letter}</span>`).join('');
             // try {
             //   anime({
             //     targets: '.letter',
             //     opacity: [0, 1],
             //     translateY: [20, 0],
             //     duration: 600,
             //     easing: 'easeOutExpo',
             //    delay: stagger(50, { start: 200 })
             // });
             // } catch (e) {
             //   console.warn('Anime animation failed:', e);
             // }
          }

          // Animate card entrance with scale
          anime({
            targets: cardRef,
            scale: [0.95, 1],
            opacity: [0, 1],
            duration: 600,
            easing: 'easeOutExpo',
            delay: 300
          });

         // Animate buttons with stagger and rotation
         anime({
           targets: buttonsRef.children,
           translateY: [10, 0],
           rotate: [5, 0],
           opacity: [0, 1],
           duration: 500,
           easing: 'easeOutBack',
             delay: (el, i) => 800 + i * 100
         });
       });

    createEffect(() => {
      if (props.currentProjectId()) {
        getProjectById(props.currentProjectId()).then(project => {
          console.log('Fetched project in AgentInterface:', project);
          setCurrentProject(project);
        });
       }
     });

     // Animate state changes
     createEffect(() => {
       const state = props.machineStore.state;
       if (badgeRef) {
         anime({
           targets: badgeRef,
           scale: [1, 1.1, 1],
           duration: 400,
           easing: 'easeOutElastic(1, .8)'
         });

         // Continuous animations based on state
         if (state === 'processing') {
           anime({
             targets: badgeRef,
             scale: [1, 1.05, 1],
             duration: 1000,
             easing: 'easeInOutQuad',
             loop: true
           });
         } else if (state === 'completed') {
           anime({
             targets: cardRef,
             boxShadow: ['0 25px 50px -12px rgba(0, 0, 0, 0.25)', '0 35px 60px -12px rgba(34, 197, 94, 0.3)'],
             duration: 600,
             easing: 'easeOutQuad'
           });
         } else if (state === 'idle') {
           // Subtle breathing effect
           anime({
             targets: cardRef,
             scale: [1, 1.005, 1],
             duration: 4000,
             easing: 'easeInOutSine',
             loop: true
           });
         }
       }
     });

     // Button press animations
     const handleButtonPress = (buttonRef) => {
       anime({
         targets: buttonRef,
         scale: [1, 0.95, 1],
         duration: 150,
         easing: 'easeOutQuad'
       });
     };

     // Button hover animations
     const handleButtonHover = (buttonRef) => {
       anime({
         targets: buttonRef,
         scale: 1.05,
         duration: 200,
         easing: 'easeOutQuad'
       });
     };

     const handleButtonLeave = (buttonRef) => {
       anime({
         targets: buttonRef,
         scale: 1,
         duration: 200,
         easing: 'easeOutQuad'
       });
     };

     // Card hover effect
     const handleCardHover = () => {
       anime({
         targets: cardRef,
         scale: 1.02,
         boxShadow: '0 35px 60px -12px rgba(0, 0, 0, 0.35)',
         duration: 300,
         easing: 'easeOutQuad'
       });
     };

      const handleCardLeave = () => {
        anime({
          targets: cardRef,
          scale: 1,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          duration: 300,
          easing: 'easeOutQuad'
        });
      };

      const handleTextareaFocus = () => {
        // Handle textarea focus if needed
      };

      const handleTextareaBlur = () => {
        // Handle textarea blur if needed
      };

   return (
      <div id="agentBox" class={`${props.agentBoxClass()} ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
        <div id="agentContent" class={props.agentContentClass()}>
          <div class="flex flex-col gap-4">
           <div ref={greetingRef} id="greetingDiv" class={props.greetingClass()}>
              <h1 class="text-2xl sm:text-3xl md:text-4xl font-sans font-light text-base-content mb-2 sm:mb-2">
                <span innerHTML={t().greeting.replace('Ahmed', '<span class="text-primary">Ahmed</span>')}></span>
              </h1>
           </div>
           <div
             ref={cardRef}
             class="card bg-base-100 border border-base-200 shadow-2xl shadow-primary drop-shadow-md rounded-box"
             onMouseEnter={handleCardHover}
             onMouseLeave={handleCardLeave}
           >
             <div class="card-body relative p-4 !gap-0">
              <Show when={props.currentProjectId() !== null && props.tasksList().length > 0}>
                  <ProgressAccordion
                    machineStore={props.machineStore}
                    project={currentProject()}
                    isAccordionOpen={props.isAccordionOpen}
                    setIsAccordionOpen={props.setIsAccordionOpen}
                    isLoading={props.isLoading}
                    handlePause={props.handlePause}
                    handleResume={props.handleResume}
                  />
               </Show>
              {/* Form */}
              <form id="taskForm">
                <input type="hidden" name="action" id="action" value="send" />
                <input type="hidden" name="taskContent" value="" />
                <input type="hidden" name="taskTimestamp" value={new Date().toLocaleString()} />
                <input type="hidden" name="taskModel" value="Llama-3.2-3B-Free" />
                  <textarea
                    ref={textareaRef}
                    name="prompt"
                    id="promptTextarea"
                    class={`custom-textarea text-base-content text-lg sm:text-xl md:text-2xl placeholder:text-base-content placeholder:text-lg sm:placeholder:text-xl md:placeholder:text-2xl focus:ring-0 active:ring-0 ${props.machineStore.state !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style="resize: none; overflow: hidden; min-height: 3rem; box-sizing: border-box;"
                     placeholder={t().placeholder}
                    value={props.prompt()}
                     onInput={(e) => {
                       props.setPrompt(e.target.value);
                       if (props.textareaRef) {
                         anime({
                           targets: props.textareaRef,
                           height: props.textareaRef.scrollHeight + 'px',
                           duration: 200,
                           easing: 'easeOutQuad'
                         });
                       }
                     }}
                   onFocus={handleTextareaFocus}
                   onBlur={handleTextareaBlur}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       if (props.machineStore.state === 'idle') {
                         handleButtonPress(e.target.closest('form').querySelector('button[type="button"]:last-child'));
                         props.handleStart();
                       }
                     }
                   }}
                   disabled={props.machineStore.state !== 'idle'}
                 ></textarea>
                <Show when={props.machineStore.state === 'pause'}>
                  <div class="text-warning text-sm mt-2">{t().agentPaused}</div>
                </Show>
                  <div ref={buttonsRef} class="flex justify-between items-center mt-2 gap-2">
                    <div class="flex gap-2">
                     <Show when={props.machineStore.state === 'idle'}>
                         <button
                           type="button"
                           onClick={(e) => {
                             handleButtonPress(e.currentTarget);
                             props.handleImprove();
                           }}
                           onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
                           onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
                           class="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-primary/20 transition cursor-pointer"
                         >
                           <i data-lucide="sparkles" class="w-3 h-3"></i>
                           <span class="hidden sm:inline">{t().improveWithAI}</span>
                        </button>
                         <button
                           type="button"
                           onClick={(e) => {
                             handleButtonPress(e.currentTarget);
                             props.handleSuggest();
                           }}
                           onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
                           onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
                           class="bg-secondary/10 text-secondary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-secondary/20 transition cursor-pointer"
                         >
                           <i data-lucide="lightbulb" class="w-3 h-3"></i>
                           <span class="hidden sm:inline">{t().aiSuggestion}</span>
                        </button>
                         <button
                           type="button"
                           onClick={(e) => {
                             handleButtonPress(e.currentTarget);
                             props.handleReset();
                           }}
                           onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
                           onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
                           class="bg-error/10 text-error px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-error/20 transition cursor-pointer"
                         >
                           <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                           <span class="hidden sm:inline">{t().reset}</span>
                        </button>
                     </Show>

                   </div>
                   <Show when={props.machineStore.state === 'idle'}>
                      <button
                        ref={badgeRef}
                        type="button"
                        class="bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-success/20 transition cursor-pointer"
                        onClick={(e) => {
                          handleButtonPress(e.currentTarget);
                          props.handleStart();
                        }}
                        onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
                        onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
                      >
                        <i data-lucide="play" class="w-3 h-3"></i>
                         <span class="hidden sm:inline">{t().start}</span>
                      </button>
                   </Show>

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