import { createSignal, Show, For } from "solid-js";
import UnifiedTaskCard from "./UnifiedTaskCard";

const ResponseSection = (props) => {
  const groupedTasks = () => {
    const tasks = props.tasksList?.() || [];
    const groups = {};
    
    tasks.forEach(task => {
      const modelName = task.model || 'General';
      if (!groups[modelName]) {
        groups[modelName] = [];
      }
      groups[modelName].push(task);
    });
    
    return groups;
  };

  const modelOrder = [
    'System',
    'Idea Model',
    'Business Model',
    'Technical Model',
    'Marketing Model',
    'Financial Model',
    'Funding Model',
    'Team Model',
    'Legal Model',
    'Reports',
    'General'
  ];

  const sortedModelNames = () => {
    const groups = groupedTasks();
    return Object.keys(groups).sort((a, b) => {
      const idxA = modelOrder.indexOf(a);
      const idxB = modelOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  };

  const allTasks = () => props.tasksList?.() || [];
  const lastTaskId = () => {
    const tasks = allTasks();
    return tasks.length > 0 ? tasks[tasks.length - 1].id : null;
  };

  return (
    <div class="flex-1 max-w-full max-w-3xl w-full mx-auto">
      {(props.startPressed?.() || (props.tasksList && props.tasksList().length > 0)) ? (
        <div id="contentDiv" class="pb-40 pt-10 px-4 max-w-full lg:max-w-6xl mx-auto min-h-[200px]">
          {props.projectName && (
            <div class="mb-6">
              <h1 class="text-2xl font-bold text-base-content">{props.projectName}</h1>
            </div>
          )}
          <Show when={props.tasksList && props.tasksList().length > 0}>
            <For each={sortedModelNames()}>
              {(modelName) => {
                const tasksForModel = groupedTasks()[modelName] || [];
                const taskCount = tasksForModel.length;
                const taskCountLabel = `${taskCount} ${taskCount === 1 ? 'step' : 'steps'}`;

                return (
                  <section class="mb-8">
                    <div class="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
                      <div class="card-header bg-base-200/60 px-4 py-3 border-b border-base-300 flex items-center justify-between gap-2">
                        <div class="flex items-center gap-3">
                          <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20"></path>
                              <path d="M20 6H10"></path>
                              <path d="M6.5 2A2.5 2.5 0 0 0 4 4.5V19.5"></path>
                              <path d="m10 2-1.42 1.42"></path>
                              <path d="M18 2l-1.42 1.42"></path>
                              <path d="m10 6-1.42-1.42"></path>
                              <path d="M18 6l-1.42-1.42"></path>
                            </svg>
                          </span>
                          <div class="flex flex-col">
                            <span class="text-sm font-semibold text-base-content">
                              {modelName}
                            </span>
                            <span class="text-xs text-base-content/60 uppercase tracking-wide">
                              Model Group
                            </span>
                          </div>
                        </div>
                        <span class="badge badge-outline badge-sm">
                          {taskCountLabel}
                        </span>
                      </div>

                      <div class="card-body p-4 space-y-4">
                        <For each={tasksForModel}>
                          {(task) => (
                            <UnifiedTaskCard
                              task={task}
                              taskContent={task.content}
                              editingTaskId={props.editingTaskId}
                              editContent={props.editContent}
                              setEditingTaskId={props.setEditingTaskId}
                              setEditContent={props.setEditContent}
                              selectedTaskId={props.selectedTaskId}
                              callLLMForStep={props.callLLMForStep}
                              setSelectedTaskId={props.setSelectedTaskId}
                              handleConfirm={props.handleConfirm}
                              updateTask={props.updateTask}
                              refreshTasks={props.refreshTasks}
                              streamingTaskId={props.streamingTaskId}
                              setStreamingTaskId={props.setStreamingTaskId}
                              isLastTask={task.id === lastTaskId()}
                              onDelete={props.onDelete}
                            />
                          )}
                        </For>
                      </div>

                      <div class="card-footer bg-base-200/40 px-4 py-2 border-t border-base-300 text-xs text-base-content/70 flex items-center justify-between">
                        <span class="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 5h12"></path>
                            <path d="M9 3v2"></path>
                            <path d="M7 11h2"></path>
                            <path d="M17 9l3 3-3 3"></path>
                            <path d="M3 19h12"></path>
                          </svg>
                          {taskCount > 0 ? `${modelName} tasks are listed below.` : 'No tasks generated yet.'}
                        </span>
                        <span class="text-base-content/50">
                          {taskCountLabel}
                        </span>
                      </div>
                    </div>
                  </section>
                );
              }}
            </For>
          </Show>
        </div>
      ) : null}
    </div>
  );
};

export default ResponseSection;
