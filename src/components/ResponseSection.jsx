import { createMemo, createSignal, Show, createEffect } from "solid-js";
import UnifiedTaskCard from "./UnifiedTaskCard";

const ResponseSection = (props) => {

  const tasksListValue = createMemo(() => props.tasksList?.() || []);
  
  createEffect(() => {
    console.log('[ResponseSection] startPressed:', props.startPressed?.());
    console.log('[ResponseSection] tasksList.length:', tasksListValue().length);
    console.log('[ResponseSection] First task content length:', tasksListValue()[0]?.content?.length || 0);
  });

  return (
    <div class="flex-1 max-w-full max-w-3xl w-full mx-auto">
      {(props.startPressed?.() || tasksListValue().length > 0) ? (
        <div id="contentDiv" class="pb-40 pt-10 max-w-full lg:max-w-6xl mx-auto min-h-[200px]">
          {props.projectName && (
            <div class="mb-6">
              <h1 class="text-2xl font-bold text-base-content">{props.projectName}</h1>
            </div>
          )}
          <Show when={tasksListValue().length > 0}>
            {tasksListValue().map((task) => (
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
              />
            ))}
          </Show>
        </div>
      ) : null}
    </div>
  );
};

export default ResponseSection;
