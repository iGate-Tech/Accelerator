import { createSignal, Show } from "solid-js";
import UnifiedTaskCard from "./UnifiedTaskCard";

const ResponseSection = (props) => {
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
            {props.tasksList().map((task) => {
              return (
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
              />
              );
            })}
          </Show>
        </div>
      ) : null}
    </div>
  );
};

export default ResponseSection;
