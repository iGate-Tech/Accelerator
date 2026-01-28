import { Show, For } from 'solid-js';

const ValidationWarnings = props => {
  const warnings = () => props.warnings?.() || [];
  const missingVariables = () => props.missingVariables?.() || [];

  const allIssues = () => {
    const issues = [];
    const warningList = warnings();
    const missingList = missingVariables();

    warningList.forEach(w => {
      issues.push({ type: 'warning', message: w });
    });

    missingList.forEach(m => {
      if (typeof m === 'object' && m.variable) {
        issues.push({
          type: m.severity === 'error' ? 'error' : 'warning',
          variable: m.variable,
          message: m.message || `Missing: ${m.variable}`,
        });
      } else {
        issues.push({ type: 'warning', message: `Missing: ${m}` });
      }
    });

    return issues;
  };

  const hasIssues = () => allIssues().length > 0;
  const hasErrors = () => allIssues().some(i => i.type === 'error');

  return (
    <Show when={hasIssues()}>
      <div
        class={`alert ${hasErrors() ? 'alert-error' : 'alert-warning'} mt-2 mb-2`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <Show
            when={hasErrors()}
            fallback={
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            }
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </Show>
          <div class="flex w-full flex-col">
            <div class="font-semibold">
              <Show when={hasErrors()} fallback={'Missing Data'}>
                {'Validation Required'}
              </Show>
            </div>
            <div class="mt-1 text-xs">
              <For each={allIssues()}>
                {issue => (
                  <div class="flex items-center gap-1">
                    <span
                      class={`badge badge-xs ${issue.type === 'error' ? 'badge-error' : 'badge-warning'} shrink-0`}
                    >
                      {issue.type === 'error' ? '✕' : '!'}
                    </span>
                    <span>{issue.message}</span>
                  </div>
                )}
              </For>
            </div>
            <Show when={props.onContinue !== undefined}>
              <div class="mt-2">
                <button
                  class="btn btn-xs btn-outline"
                  onClick={props.onContinue}
                >
                  Continue Anyway
                </button>
              </div>
            </Show>
          </div>
        </svg>
      </div>
    </Show>
  );
};

export default ValidationWarnings;
