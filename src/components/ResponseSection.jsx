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
              {(modelName) => (
                <div class="mb-8">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="h-px bg-base-300 flex-1"></div>
                    <h2 class="text-sm font-semibold text-base-content/70 uppercase tracking-wider px-2">
                      {modelName}
                    </h2>
                    <div class="h-px bg-base-300 flex-1"></div>
                  </div>
                  <div class="space-y-4">
                    <For each={groupedTasks()[modelName]}>
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
                        />
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
      ) : null}
    </div>
  );
};

export default ResponseSection;
