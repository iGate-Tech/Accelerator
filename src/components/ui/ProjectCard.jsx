import { createSignal, onMount } from "solid-js";
import { voteOnProject, toggleProjectPublic } from "../../lib/db";
import { getCurrentUser } from "../../lib/supabase";
import { toastManager } from "../../lib/feedback";
import logger from '../../lib/logger.js';



const ProjectCard = (props) => {
  logger.trace('ProjectCard: Starting');
  const {
    project,
    onClick,
    showProgress = true,
    showStatus = true,
    showVotes = false,
    showVisibilityToggle = false,
    onVote,
    onVisibilityChange,
    compact = false,
    className = ""
  } = props;

  const [isHovered, setIsHovered] = createSignal(false);
  const [userVote, setUserVote] = createSignal(project.user_vote);
  const [upvotes, setUpvotes] = createSignal(project.upvotes || 0);
  const [downvotes, setDownvotes] = createSignal(project.downvotes || 0);
  const [isPublic, setIsPublic] = createSignal(project.public || false);

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const handleVote = async (voteType) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const result = await voteOnProject(project.id, user.id, voteType);

      if (result.success === false) return;

      // Update local state based on the result
      if (result.action === 'added') {
        if (voteType === 'upvote') {
          setUpvotes(upvotes() + 1);
          setUserVote('upvote');
        } else {
          setDownvotes(downvotes() + 1);
          setUserVote('downvote');
        }
      } else if (result.action === 'removed') {
        if (userVote() === 'upvote') {
          setUpvotes(upvotes() - 1);
        } else {
          setDownvotes(downvotes() - 1);
        }
        setUserVote(null);
      } else if (result.action === 'changed') {
        if (voteType === 'upvote') {
          setUpvotes(upvotes() + 1);
          setDownvotes(downvotes() - 1);
          setUserVote('upvote');
        } else {
          setUpvotes(upvotes() - 1);
          setDownvotes(downvotes() + 1);
          setUserVote('downvote');
        }
      }

      // Call the onVote callback if provided
      if (onVote) {
        onVote(project.id, result);
      }
    } catch (error) {
      logger.error('Error voting:', error);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      const newVisibility = !isPublic();
      const result = await toggleProjectPublic(project.id, newVisibility);
      if (result.success) {
        setIsPublic(newVisibility);
        toastManager.success(`Project is now ${newVisibility ? 'public' : 'private'}`);
        if (onVisibilityChange) {
          onVisibilityChange(project.id, newVisibility);
        }
      }
    } catch (error) {
      logger.error('Error toggling visibility:', error);
      toastManager.error('Failed to update project visibility');
    }
  }
  logger.trace('getStatusColor: Starting');
  logger.trace('getStatusColor: Starting');;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'processing': return 'badge-warning';
      case 'idle': return 'badge-neutral';
      case 'paused': return 'badge-error';
   
  logger.trace('getStatusIcon: Starting');
  logger.trace('getStatusIcon: Starting');   default: return 'badge-neutral';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'processing': return 'loader';
      case 'idle': return 'circle'
  logger.trace('formatDate: Starting');
  logger.trace('formatDate: Starting');;
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

        {/* Voting section */}
        {showVotes && (
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-base-200">
            <div class="flex items-center gap-2">
              <button
                class={`btn btn-sm btn-ghost ${userVote() === 'upvote' ? 'text-success' : 'text-base-content/50'}`}
                onClick={(e) => { e.stopPropagation(); handleVote('upvote'); }}
              >
                <i data-lucide="thumbs-up" class="w-4 h-4"></i>
              </button>
              <span class="text-sm font-medium">{upvotes() - downvotes()}</span>
              <button
                class={`btn btn-sm btn-ghost ${userVote() === 'downvote' ? 'text-error' : 'text-base-content/50'}`}
                onClick={(e) => { e.stopPropagation(); handleVote('downvote'); }}
              >
                <i data-lucide="thumbs-down" class="w-4 h-4"></i>
              </button>
            </div>
            <div class="text-xs text-base-content/50">
              {upvotes()} ↑ {downvotes()} ↓
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
            <div class="flex flex-col gap-2">
              <div class="bg-primary text-base-100 px-3 py-1 rounded-full text-sm font-medium">
                <i data-lucide="eye" class="w-4 h-4 mr-1 inline"></i>
                View Project
              </div>
              {showVisibilityToggle && (
                <button
                  class={`btn btn-sm ${isPublic() ? 'btn-success' : 'btn-outline'} px-3 py-1 rounded-full text-xs font-medium`}
                  onClick={(e) => { e.stopPropagation(); handleToggleVisibility(); }}
                >
                  <i data-lucide={isPublic() ? 'eye' : 'eye-off'} class="w-3 h-3 mr-1 inline"></i>
                  {isPublic() ? 'Public' : 'Private'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;