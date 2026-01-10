import { createSignal, onMount } from "solid-js";

const ProjectCard = (props) => {
  const {
    project,
    onClick,
    showProgress = true,
    showStatus = true,
    compact = false,
    className = ""
  } = props;

  const [isHovered, setIsHovered] = createSignal(false);

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'processing': return 'badge-warning';
      case 'idle': return 'badge-neutral';
      case 'paused': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'processing': return 'loader';
      case 'idle': return 'circle';
      case 'paused': return 'pause-circle';
      default: return 'circle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      class={`card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-base-200 ${compact ? 'card-compact' : ''} ${className}`}
      onClick={() => onClick && onClick(project)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered() ? 'translateY(-2px)' : 'translateY(0)',
        'box-shadow': isHovered()
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div class="card-body">
        {/* Header with title and status */}
        <div class="flex justify-between items-start mb-3">
          <h3 class="card-title text-base font-semibold line-clamp-2 flex-1 mr-2">
            {project.name || 'Unnamed Project'}
          </h3>
          {showStatus && (
            <div class={`badge ${getStatusColor(project.uiStatus)} badge-sm gap-1`}>
              <i data-lucide={getStatusIcon(project.uiStatus)} class="w-3 h-3"></i>
              {project.uiStatus || 'idle'}
            </div>
          )}
        </div>

        {/* Description */}
        {!compact && project.description && (
          <p class="text-sm text-base-content/70 line-clamp-2 mb-3">
            {project.description.length > 100
              ? `${project.description.substring(0, 100)}...`
              : project.description}
          </p>
        )}

        {/* Progress Bar */}
        {showProgress && project.totalSteps && (
          <div class="mb-3">
            <div class="flex justify-between text-xs text-base-content/60 mb-1">
              <span>Progress</span>
              <span>{project.completedSteps || 0}/{project.totalSteps || 51}</span>
            </div>
            <progress
              class="progress progress-primary w-full h-2"
              value={project.completedSteps || 0}
              max={project.totalSteps || 51}
            ></progress>
            <div class="text-xs text-base-content/60 mt-1">
              {Math.round(((project.completedSteps || 0) / (project.totalSteps || 51)) * 100)}% complete
            </div>
          </div>
        )}

        {/* Footer with metadata */}
        <div class="flex justify-between items-center text-xs text-base-content/50">
          <div class="flex items-center gap-1">
            <i data-lucide="clock" class="w-3 h-3"></i>
            <span>{formatDate(project.createdAt)}</span>
          </div>
          {project.currentModel && (
            <div class="flex items-center gap-1">
              <i data-lucide="cpu" class="w-3 h-3"></i>
              <span>{project.currentModel}</span>
            </div>
          )}
        </div>

        {/* Hover overlay for actions */}
        {isHovered() && onClick && (
          <div class="absolute inset-0 bg-primary/5 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <div class="bg-primary text-base-100 px-3 py-1 rounded-full text-sm font-medium">
              <i data-lucide="eye" class="w-4 h-4 mr-1 inline"></i>
              View Project
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;