import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { logger } from '@lib/core';

const LoadingOverlay = props => {
  const [show, setShow] = createSignal(false);
  const [timedOut, setTimedOut] = createSignal(false);

  let timeoutId;

  onMount(() => {
    if (props.timeout && props.onTimeout) {
      timeoutId = setTimeout(() => {
        setTimedOut(true);
        props.onTimeout();
        logger.debug('LoadingOverlay: Timeout reached');
      }, props.timeout);
    }
  });

  onCleanup(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  // Update show based on isLoading
  const updateShow = () => {
    setShow(props.isLoading);
    if (!props.isLoading && timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  // Call updateShow when isLoading changes
  // Solid will handle reactivity

  return (
    <Show when={show()}>
      <div class="loading-overlay">
        <div class="loading-container mx-4 max-w-sm rounded-lg p-6 shadow-lg">
          <div class="flex flex-col items-center space-y-4">
            <div class="loading loading-spinner loading-lg text-primary" />
            <span class="text-center text-lg">
              {props.message || 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default LoadingOverlay;
