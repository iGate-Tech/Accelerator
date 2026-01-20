import { createSignal, onMount, onCleanup } from "solid-js";

// Skeleton loading component for various content types
export const Skeleton = (props) => {
  const { type = 'text', lines = 1, class: className = '', width = '100%', height = '1rem' } = props;

  const getSkeletonClass = () => {
    switch (type) {
      case 'text':
        return 'skeleton-text';
      case 'title':
        return 'skeleton-title';
      case 'avatar':
        return 'skeleton-avatar';
      case 'card':
        return 'skeleton-card';
      case 'button':
        return 'skeleton-button';
      default:
        return 'skeleton-text';
    }
  };

  if (type === 'card') {
    return (
      <div class={`skeleton-card ${className}`}>
        <div class="skeleton-header"></div>
        <div class="skeleton-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    );
  }

  if (type === 'avatar') {
    return (
      <div
        class={`skeleton-avatar ${className}`}
        style={{ width: width, height: height }}
      ></div>
    );
  }

  if (lines > 1) {
    return (
      <div class={`skeleton-lines ${className}`}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            class="skeleton-line"
            style={{
              width: i === lines - 1 ? '60%' : width,
              height: height,
              marginBottom: i < lines - 1 ? '0.5rem' : '0'
            }}
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div
      class={`${getSkeletonClass()} ${className}`}
      style={{ width: width, height: height }}
    ></div>
  );
};

// Project card skeleton
export const ProjectCardSkeleton = () => (
  <div class="card bg-base-100 shadow-sm border border-base-200">
    <div class="card-body">
      <Skeleton type="title" width="70%" class="mb-3" />
      <Skeleton lines={2} class="mb-4" />
      <div class="flex justify-between items-center">
        <Skeleton width="40%" height="0.75rem" />
        <Skeleton width="30%" height="0.75rem" />
      </div>
    </div>
  </div>
);

// Task item skeleton
export const TaskSkeleton = () => (
  <div class="mb-4">
    <Skeleton type="title" width="80%" class="mb-2" />
    <Skeleton lines={3} />
  </div>
);

// Sidebar project list skeleton
export const SidebarSkeleton = () => (
  <div class="space-y-3">
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} class="flex items-center gap-3 p-2">
        <Skeleton type="avatar" width="2rem" height="2rem" />
        <div class="flex-1">
          <Skeleton width="70%" height="0.875rem" class="mb-1" />
          <Skeleton width="50%" height="0.75rem" />
        </div>
      </div>
    ))}
  </div>
);

// Loading overlay component with timeout
export const LoadingOverlay = (props) => {
  const {
    isLoading,
    message = 'Loading...',
    timeout = 30000, // 30 seconds default timeout
    onTimeout,
    class: className = ''
  } = props;

  const [showTimeout, setShowTimeout] = createSignal(false);
  let timeoutId;

  onMount(() => {
    if (isLoading && timeout > 0) {
      timeoutId = setTimeout(() => {
        setShowTimeout(true);
        onTimeout?.();
      }, timeout);
    }
  });

  onCleanup(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  return (
    <Show when={isLoading()}>
      <div class={`loading-overlay ${className}`}>
        <div class="loading-container">
          <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p class="text-base-content/70 mb-2">{message}</p>
          <Show when={showTimeout()}>
            <div class="alert alert-warning shadow-sm mt-4">
              <i data-lucide="clock" class="w-4 h-4"></i>
              <div>
                <h4 class="font-medium">Taking longer than expected</h4>
                <p class="text-sm">This operation is taking longer than usual. Please check your connection and try again.</p>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
};

// Progress loading component
export const ProgressLoader = (props) => {
  const {
    progress,
    message = 'Processing...',
    showPercentage = true,
    class: className = ''
  } = props;

  return (
    <div class={`progress-loader ${className}`}>
      <div class="mb-3">
        <span class="text-sm text-base-content/70">{message}</span>
        <Show when={showPercentage()}>
          <span class="text-sm font-medium ml-2">{Math.round(progress())}%</span>
        </Show>
      </div>
      <progress
        class="progress progress-primary w-full"
        value={progress()}
        max="100"
      ></progress>
    </div>
  );
};

// Global loading state manager
class LoadingManager {
  constructor() {
    this.states = new Map();
    this.listeners = new Set();
  }

  // Set loading state for a specific key
  setLoading(key, loading, options = {}) {
    this.states.set(key, { loading, ...options });
    this.notifyListeners();
  }

  // Get loading state for a specific key
  getLoading(key) {
    return this.states.get(key) || { loading: false };
  }

  // Check if any loading state is active
  isAnyLoading() {
    return Array.from(this.states.values()).some(state => state.loading);
  }

  // Subscribe to loading state changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.states));
  }
}

export const loadingManager = new LoadingManager();