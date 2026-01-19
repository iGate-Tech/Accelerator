import { Show, createEffect, createSignal, createMemo, useContext } from "solid-js";
import { marked } from "marked";
import { renderFilledTemplate } from "../../lib/llm-template";
import { steps, stepNames } from "../../lib/machine";
import { LangContext } from "../../context/LangContext";
import { uiTranslations } from "../../assets/translations/translations-index.js";
import { Skeleton, TaskSkeleton } from "./Skeleton";


/* ---------- Helpers ---------- */

const getStepName = (task) =>
  task.step_name ||
  (task.step ? stepNames[task.step] : null) ||
  task.step ||
  "Unknown Step";



/* ---------- Component ---------- */

const ResponseSection = (props) => {
  const { lang } = useContext(LangContext) || { lang: () => 'ar' };
  const [currentLang, setCurrentLang] = createSignal(lang());

  // Reactive translation function
  const t = createMemo(() => {
    const langKey = currentLang();
    return uiTranslations[langKey] || uiTranslations.ar;
  });

  createEffect(() => {
    if (lang) {
      setCurrentLang(lang());
    }
  });

  const startPressedCondition = props.startPressed && props.startPressed();
  const tasksCondition = props.tasksList && props.tasksList().length > 0;
  const shouldShow = startPressedCondition || tasksCondition;

  const concatenatedTasksMarkdown = createMemo(() => {
    const allTasks = props.tasksList().sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
    let markdown = '';

    allTasks.forEach(task => {
      if (props.editingTaskId && props.editingTaskId() === task.id) {
        // Skip this task as it will be rendered as an editable textarea
        return;
      }
      markdown += renderFilledTemplate(task.content) + '\n\n';
    });

    if (typeof props.streamingContent === 'function' && props.streamingContent()) {
      // Format streaming content with proper markdown
      let streamingText = props.streamingContent();
      // Add typing cursor effect
      if (props.isLoading && streamingText) {
        streamingText += ' <span class="typing-cursor">|</span>';
      }
      markdown += streamingText;
    }

    return markdown;
  });

  let contentRef;
  let lastProcessedHtml = '';

  const buttonsHtml = (taskId) => `
    <div class="flex gap-2">
      <button type="button" class="text-white px-2 py-1 rounded-full flex items-center text-xs transition group" style="background-color:#9e28b5">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="rotate-ccw" class="lucide lucide-rotate-ccw w-3 h-3"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
        <span class="hidden group-hover:block ml-1">Reset</span>
      </button>
      <button type="button" class="text-white px-2 py-1 rounded-full flex items-center text-xs transition group" style="background-color:#00a7e0">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="book-open" class="lucide lucide-book-open w-3 h-3"><path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path></svg>
        <span class="hidden group-hover:block ml-1">Instruct</span>
      </button>
      <button type="button" class="text-white px-2 py-1 rounded-full flex items-center text-xs transition group" style="background-color:#ffc600">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="refresh-ccw" class="lucide lucide-refresh-ccw w-3 h-3"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>
        <span class="hidden group-hover:block ml-1">Regenerate</span>
      </button>
      <button type="button" class="text-white px-2 py-1 rounded-full flex items-center text-xs transition group" style="background-color:#6cd14d">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="check" class="lucide lucide-check w-3 h-3"><path d="M20 6 9 17l-5-5"></path></svg>
        <span class="hidden group-hover:block ml-1">Confirm</span>
      </button>
    </div>
  `;

  const createHeaderWrapper = (header, taskId) => {
    if (!header || !header.parentNode) {
      return { wrapper: null, indicator: null };
    }

    const existingWrapper = header.closest('.header-wrapper');
    if (existingWrapper) {
      return { wrapper: existingWrapper, indicator: existingWrapper.querySelector('.header-indicator') };
    }

    // Find the task to get priority
    const task = props.tasksList().find(t => t.id === taskId);
    const priority = task?.priority || 'medium';

    const wrapper = document.createElement('div');
    wrapper.className = 'header-wrapper flex items-center justify-between mb-2';
    wrapper.style.marginBottom = '0.5rem';

    const leftGroup = document.createElement('div');
    leftGroup.className = 'flex items-center gap-2';

    const indicator = document.createElement('span');
    indicator.className = 'header-indicator cursor-pointer transition-transform duration-200';
    indicator.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 18 6-6-6-6" class="chevron"></path>
      </svg>
    `;

    // Priority badge
    const priorityBadge = document.createElement('span');
    priorityBadge.className = `badge badge-sm ${
      priority === 'high' ? 'badge-error' :
      priority === 'medium' ? 'badge-warning' :
      'badge-success'
    }`;
    priorityBadge.textContent = priority.toUpperCase();
    priorityBadge.title = `Priority: ${priority}`;

    const rightGroup = document.createElement('div');
    rightGroup.className = 'header-actions';
    rightGroup.innerHTML = buttonsHtml(taskId);

    leftGroup.appendChild(indicator);
    leftGroup.appendChild(priorityBadge);

    wrapper.appendChild(leftGroup);
    wrapper.appendChild(rightGroup);

    header.parentNode.insertBefore(wrapper, header);

    leftGroup.appendChild(header);

    // Add event listener for edit button
    const editBtn = rightGroup.querySelector('.edit-task-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const task = props.tasksList().find(t => t.id === taskId);
        if (task) {
          startEditing(task);
        }
      });
    }

    return { wrapper, indicator };
  };



  // Auto-save functionality
  let saveTimeout;
  const handleEditChange = (taskId, newContent) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    if (props.setEditContent) props.setEditContent(newContent);

    saveTimeout = setTimeout(async () => {
      try {
        if (props.updateTask) await props.updateTask(taskId, { content: newContent });
        console.log('Task auto-saved:', taskId);
      } catch (error) {
        console.error('Failed to auto-save task:', error);
      }
    }, 1000); // Auto-save after 1 second of no changes
  };

  const startEditing = (task) => {
    if (props.setEditingTaskId) props.setEditingTaskId(task.id);
    if (props.setEditContent) props.setEditContent(task.content || '');
  };

  const stopEditing = () => {
    if (props.setEditingTaskId) props.setEditingTaskId(null);
    if (props.setEditContent) props.setEditContent('');
  };

  return (
    <div class="flex-1 p-2 md:p-4 max-w-full lg:max-w-6xl w-full mx-auto">
      <style>
        {`
          .typing-cursor {
            animation: blink 1s infinite;
            color: #666;
            font-weight: normal;
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          .streaming-content {
            border-left: 3px solid #3b82f6;
            padding-left: 1rem;
            margin: 1rem 0;
            background: rgba(59, 130, 246, 0.05);
            border-radius: 0 0.5rem 0.5rem 0;
          }
        `}
      </style>
      <Show when={shouldShow}>
        <div id="contentDiv" class="pb-20 px-0 md:px-2 max-w-full lg:max-w-6xl mx-auto min-h-[200px]">
           {/* Render editable task if one is being edited */}
            <Show when={props.editingTaskId && typeof props.editingTaskId === 'function' && props.editingTaskId()}>
              {(() => {
                const editingTask = props.tasksList().find(task => task.id === props.editingTaskId());
               if (!editingTask) return null;

               return (
                 <div class="mb-4 p-4 border border-primary rounded-lg bg-base-100">
                   <div class="flex justify-between items-center mb-2">
                     <h3 class="text-lg font-semibold">Editing Task: {getStepName(editingTask)}</h3>
                     <button
                       onClick={stopEditing}
                       class="btn btn-sm btn-ghost"
                     >
                       ✕
                     </button>
                   </div>
                   <div class="mb-4">
                     <label class="label">
                       <span class="label-text font-medium">Priority</span>
                     </label>
                     <select
                       class="select select-bordered w-full"
                       value={editingTask.priority || 'medium'}
                        onChange={(e) => {
                          const newPriority = e.target.value;
                          if (props.updateTask) props.updateTask(editingTask.id, { priority: newPriority });
                        }}
                     >
                       <option value="high">High</option>
                       <option value="medium">Medium</option>
                       <option value="low">Low</option>
                     </select>
                   </div>
                    <textarea
                      class="textarea textarea-bordered w-full min-h-[200px] font-mono text-sm"
                      value={props.editContent && typeof props.editContent === 'function' ? props.editContent() : ''}
                      onInput={(e) => handleEditChange(editingTask.id, e.target.value)}
                     placeholder="Enter task content..."
                   />
                   <div class="flex justify-end mt-2">
                     <button
                       onClick={stopEditing}
                       class="btn btn-primary btn-sm"
                     >
                       Done Editing
                     </button>
                   </div>
                 </div>
               );
             })()}
           </Show>

          {/* Show skeleton loading when no tasks and loading */}
          <Show when={!props.tasksList || props.tasksList().length === 0}>
            <div class="space-y-4">
              <TaskSkeleton />
              <TaskSkeleton />
              <TaskSkeleton />
            </div>
          </Show>

          {/* Render markdown content */}
          <Show when={props.tasksList && props.tasksList().length > 0}>
            <div ref={contentRef} class="prose max-w-none dark:prose-invert" innerHTML={marked.parse(concatenatedTasksMarkdown(), { breaks: true, gfm: true })} />
          </Show>

           {/* Streaming indicator overlay */}
           <Show when={props.isLoading && typeof props.streamingContent === 'function' && props.streamingContent()}>
             <div class="streaming-content">
               <div class="flex items-center gap-2 mb-2">
                 <div class="loading loading-spinner loading-sm"></div>
                 <span class="text-sm font-medium text-primary">AI is generating response...</span>
               </div>
               <div class="text-sm text-base-content/70 mb-2">
                 {props.streamingContent().length} characters generated
               </div>
               <div class="w-full bg-base-300 rounded-full h-1">
                 <div
                   class="bg-primary h-1 rounded-full transition-all duration-300"
                   style={`width: ${Math.min((props.streamingContent().length / 1000) * 100, 100)}%`}
                 ></div>
               </div>
               <div class="text-xs text-base-content/50 mt-1">
                 Progress indicator - completion may vary
               </div>
             </div>
           </Show>

           {/* Streaming error display */}
           <Show when={props.streamingError && typeof props.streamingError === 'function' && props.streamingError()}>
             <div class="alert alert-error shadow-sm mt-4">
               <i data-lucide="alert-triangle" class="w-4 h-4"></i>
               <div>
                 <h4 class="font-medium">Streaming Error</h4>
                 <p class="text-sm">{props.streamingError()}</p>
               </div>
             </div>
           </Show>

           {/* Add headers with buttons */}
           <div class="hidden">
             {(() => {
               // This effect will run after the markdown is rendered
               createEffect(() => {
                 const html = concatenatedTasksMarkdown();
                 if (contentRef && html !== lastProcessedHtml) {
                   lastProcessedHtml = html;
                   // Find all headers and add buttons
                   const headers = contentRef.querySelectorAll('h1, h2, h3, h4');
                   headers.forEach((header, index) => {
                     if (header.classList.contains('header-processed')) return; // Already processed

                     // Create indicator
                     const indicator = document.createElement('span');
                     indicator.className = 'header-indicator cursor-pointer transition-transform duration-200 mr-2';
                     const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                     svg.setAttribute('width', '16');
                     svg.setAttribute('height', '16');
                     svg.setAttribute('viewBox', '0 0 24 24');
                     svg.setAttribute('fill', 'none');
                     svg.setAttribute('stroke', 'currentColor');
                     svg.setAttribute('stroke-width', '2');
                     svg.setAttribute('stroke-linecap', 'round');
                     svg.setAttribute('stroke-linejoin', 'round');
                     const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                     path.setAttribute('d', 'm9 18 6-6-6-6');
                     path.classList.add('chevron');
                     svg.appendChild(path);
                     indicator.appendChild(svg);

                     // Create buttons
                     const buttonsDiv = document.createElement('div');
                     buttonsDiv.className = 'flex gap-2 ml-2';
                     buttonsDiv.innerHTML = buttonsHtml(`header-${index}`);

                     // Modify header to flex
                     header.style.display = 'flex';
                     header.style.alignItems = 'center';
                     header.style.justifyContent = 'space-between';
                     header.style.width = '100%';

                     // Create span for header text
                     const textSpan = document.createElement('span');
                     textSpan.innerHTML = header.innerHTML;
                     header.innerHTML = '';
                     header.classList.add('header-processed');

                     // Create left group for indicator and text
                     const leftGroup = document.createElement('div');
                     leftGroup.className = 'flex items-center';
                     leftGroup.appendChild(indicator);
                     leftGroup.appendChild(textSpan);

                     // Hide buttons by default
                     buttonsDiv.className = 'flex gap-2 ml-2 opacity-0 transition-opacity duration-200';
                     buttonsDiv.style.opacity = '0';

                     // Show buttons on hover
                     header.addEventListener('mouseenter', () => {
                       buttonsDiv.style.opacity = '1';
                     });
                     header.addEventListener('mouseleave', () => {
                       buttonsDiv.style.opacity = '0';
                     });

                     // Append groups
                     header.appendChild(leftGroup);
                     header.appendChild(buttonsDiv);

                     // Add toggle functionality for collapsible
                     let isCollapsed = false;
                     indicator.addEventListener('click', () => {
                       isCollapsed = !isCollapsed;
                       const chevron = indicator.querySelector('.chevron');
                       if (chevron) {
                         chevron.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
                       }
                       // Hide/show content until next header
                       let sibling = header.nextElementSibling;
                       while (sibling) {
                         if (sibling.tagName && /^H[1-6]$/.test(sibling.tagName)) break;
                         sibling.style.display = isCollapsed ? 'none' : '';
                         sibling = sibling.nextElementSibling;
                       }
                     });

                     // Add click to edit
                     textSpan.addEventListener('click', (e) => {
                       // Find the corresponding task
                       const allTasks = props.tasksList().sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                       const taskIndex = Array.from(headers).indexOf(header);
                       if (allTasks[taskIndex] && !(props.editingTaskId && typeof props.editingTaskId === 'function' && props.editingTaskId())) {
                         startEditing(allTasks[taskIndex]);
                       }
                     });
                   });
                 }
               });
               return null;
             })()}
           </div>
        </div>
      </Show>
    </div>
  );
};

export default ResponseSection;
