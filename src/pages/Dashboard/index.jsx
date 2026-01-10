import { createSignal, createResource, createMemo, onMount, For, Show, useContext, createEffect } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { getProjects } from "../../lib/db";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { dashboardTranslations } from "../../assets/translations/translations-index.js";
import { formatRelativeTime } from "../../lib/utils";
import ProjectCard from "../../components/ui/ProjectCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAuthenticated } = useUser();
  const [projects, { refetch }] = createResource(getProjects);

  // Redirect if not authenticated
  createEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  });

  const stats = createMemo(() => {
    if (!projects()) return {};

    const totalProjects = projects().length;
    const completedProjects = projects().filter(p => p.uiStatus === 'completed').length;
    const inProgressProjects = projects().filter(p => p.uiStatus === 'processing').length;
    const idleProjects = projects().filter(p => p.uiStatus === 'idle').length;
    const pausedProjects = projects().filter(p => p.uiStatus === 'paused').length;

    const totalCompletedSteps = projects().reduce((sum, p) => sum + (p.completedSteps || 0), 0);
    const totalSteps = projects().reduce((sum, p) => sum + (p.totalSteps || 51), 0);
    const overallProgress = totalSteps > 0 ? (totalCompletedSteps / totalSteps) * 100 : 0;

    const totalCreditsConsumed = projects().reduce((sum, p) => sum + (p.consumedCredits || 0), 0);
    const totalCreditsAvailable = projects().reduce((sum, p) => sum + (p.totalCredits || 0), 0);
    const totalTimeConsumed = projects().reduce((sum, p) => sum + (p.consumedTime || 0), 0);

    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      idleProjects,
      pausedProjects,
      overallProgress,
      totalCreditsConsumed,
      totalCreditsAvailable,
      totalTimeConsumed
    };
  });

  const recentProjects = createMemo(() => {
    if (!projects()) return [];
    return projects()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  });

  const recentActivity = createMemo(() => {
    if (!projects()) return [];

    // Mock activity data - in a real app, you'd have an activity log table
    const activities = [];

    // Add creation activities
    projects().forEach(project => {
      activities.push({
        type: 'created',
        message: `Project "${project.name || t().unnamedProject}" ${t().wasCreated}`,
        timestamp: project.createdAt,
        projectId: project.id
      });
    });

    // Add completion activities
    projects().filter(p => p.uiStatus === 'completed').forEach(project => {
      activities.push({
        type: 'completed',
        message: `Project "${project.name || 'Unnamed'}" was completed`,
        timestamp: new Date(), // Mock completion date
        projectId: project.id
      });
    });

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  });

  const handleProjectClick = (project) => {
    window.dispatchEvent(new CustomEvent('openProject', { detail: project.id }));
    navigate('/');
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString) => formatRelativeTime(dateString, t());

  onMount(async () => {
    if (window.lucide) window.lucide.createIcons();

    // Listen for project updates
    window.addEventListener('projectAdded', () => refetch());
    window.addEventListener('projectUpdated', () => refetch());
  });

  return (
    <div class="space-y-8 ">
      {/* Header */}
      <div class="text-center py-6">
        <h1 class="text-4xl font-bold text-base-content mb-2">{t().dashboard}</h1>
        <p class="text-lg text-base-content/70">
          {t().overview} {t().projectsLower} {t().progressLower}.
        </p>
      </div>

      <Show
        when={!projects.loading}
        fallback={
          <div class="flex justify-center items-center py-16">
            <div class="loading loading-spinner loading-lg"></div>
            <span class="ml-4 text-lg">{t().loadingDashboard}</span>
          </div>
        }
      >
        {/* Stats Cards */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="card bg-gradient-to-br from-primary to-primary/80 text-primary-content shadow-lg">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">{t().totalProjects}</h3>
                  <p class="text-3xl font-bold">{stats().totalProjects}</p>
                </div>
                <i data-lucide="folder" class="w-8 h-8 opacity-80"></i>
              </div>
            </div>
          </div>

          <div class="card bg-gradient-to-br from-success to-success/80 text-success-content shadow-lg">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">{t().completed}</h3>
                  <p class="text-3xl font-bold">{stats().completedProjects}</p>
                </div>
                <i data-lucide="check-circle" class="w-8 h-8 opacity-80"></i>
              </div>
            </div>
          </div>

          <div class="card bg-gradient-to-br from-warning to-warning/80 text-warning-content shadow-lg">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">{t().inProgress}</h3>
                  <p class="text-3xl font-bold">{stats().inProgressProjects}</p>
                </div>
                <i data-lucide="loader" class="w-8 h-8 opacity-80"></i>
              </div>
            </div>
          </div>

          <div class="card bg-gradient-to-br from-secondary to-secondary/80 text-secondary-content shadow-lg">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">{t().overallProgress}</h3>
                  <p class="text-3xl font-bold">{Math.round(stats().overallProgress)}%</p>
                </div>
                <i data-lucide="trending-up" class="w-8 h-8 opacity-80"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div class="lg:col-span-2">
            <div class="bg-base-100 rounded-box p-6 shadow-sm border border-base-200">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">{t().recentProjects}</h2>
                <A href="/explore" class="btn btn-ghost btn-sm">
                  {t().viewAll}
                  <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                </A>
              </div>

              <Show
                when={recentProjects().length > 0}
                fallback={
                  <div class="text-center py-8 text-base-content/50">
                    <i data-lucide="folder-x" class="w-12 h-12 mx-auto mb-2"></i>
                    <p>{t().noProjectsYet || 'No projects yet.'} {t().createFirstProject || 'Create your first project to get started!'}</p>
                    <button
                      class="btn btn-primary mt-4"
                      onClick={() => navigate('/')}
                    >
                      {t().createProject || 'Create Project'}
                    </button>
                  </div>
                }
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <For each={recentProjects()}>
                     {(project) => (
                       <ProjectCard
                         project={project}
                         onClick={handleProjectClick}
                         showVisibilityToggle={true}
                         onVisibilityChange={() => refetch()}
                         compact={true}
                       />
                     )}
                   </For>
                </div>
              </Show>
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <div class="bg-base-100 rounded-box p-6 shadow-sm border border-base-200">
              <h2 class="text-2xl font-bold mb-6">{t().recentActivity}</h2>

              <Show
                when={recentActivity().length > 0}
                fallback={
                  <div class="text-center py-8 text-base-content/50">
                    <i data-lucide="activity" class="w-12 h-12 mx-auto mb-2"></i>
                    <p>{t().noRecentActivity}</p>
                  </div>
                }
              >
                <div class="space-y-4">
                  <For each={recentActivity()}>
                    {(activity) => (
                      <div class="flex items-start gap-3">
                        <div class={`p-2 rounded-full ${
                          activity.type === 'created' ? 'bg-info/10 text-info' :
                          activity.type === 'completed' ? 'bg-success/10 text-success' :
                          'bg-base-200 text-base-content/70'
                        }`}>
                          <i
                            data-lucide={
                              activity.type === 'created' ? 'plus' :
                              activity.type === 'completed' ? 'check' :
                              'activity'
                            }
                            class="w-4 h-4"
                          ></i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm text-base-content">{activity.message}</p>
                          <p class="text-xs text-base-content/60">{formatDate(activity.timestamp)}</p>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            {/* Resource Usage */}
            <div class="bg-base-100 rounded-box p-6 shadow-sm border border-base-200 mt-6">
              <h3 class="text-lg font-semibold mb-4">{t().resourceUsage}</h3>

              <div class="space-y-4">
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span>{t().creditsUsed}</span>
                    <span>{stats().totalCreditsConsumed} / {stats().totalCreditsAvailable}</span>
                  </div>
                  <progress
                    class="progress progress-primary w-full"
                    value={stats().totalCreditsConsumed}
                    max={stats().totalCreditsAvailable || 1}
                  ></progress>
                </div>

                <div class="flex items-center justify-between text-sm">
                  <span class="flex items-center gap-1">
                    <i data-lucide="clock" class="w-4 h-4"></i>
                    Time Invested
                  </span>
                  <span>{formatTime(stats().totalTimeConsumed)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Dashboard;