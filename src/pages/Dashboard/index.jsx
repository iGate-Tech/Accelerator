import { createSignal, createResource, createMemo, onMount, For, Show, useContext, createEffect } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { getProjects, getUserActivities } from "../../lib/db";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { dashboardTranslations } from "../../assets/translations/translations-index.js";
import { formatRelativeTime } from "../../lib/utils";
import ProjectCard from "../../components/ui/ProjectCard";
import logger from '../../lib/logger.js';



const Dashboard = () => {
  logger.info('Dashboard: Component mounting');
  logger.debug('Dashboard: Initializing signals and resources');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAuthenticated, user } = useUser();
  logger.debug('Dashboard: Hooks initialized, user authenticated:', !!user());
  const [projects, { refetch }] = createResource(() => {
    logger.debug('Dashboard: Fetching projects');
    return getProjects();
  });

  const [activities, { refetch: refetchActivities }] = createResource(
    () => {
      const userId = user()?.id;
      logger.debug('Dashboard: Activities resource triggered, userId:', userId);
      return userId;
    },
    async (userId) => {
      logger.debug('Dashboard: Fetching activities for user:', userId);
      if (!userId) {
        logger.debug('Dashboard: No userId, returning empty activities');
        return [];
      }
      try {
        const result = await getUserActivities(userId, 20, 0);
        logger.debug('Dashboard: Activities fetched, count:', result?.length || 0);
        return result;
      } catch (e) {
        logger.error('Dashboard: Error fetching activities:', e.message, e.stack);
        return [];
      }
    }
  );

  // Redirect if not authenticated
  createEffect(() => {
    const auth = isAuthenticated();
    logger.trace('Dashboard: Auth check effect triggered, isAuthenticated:', auth);
    if (!auth) {
      logger.info('Dashboard: User not authenticated, redirecting to login');
      navigate('/auth/login', { replace: true });
    } else {
      logger.debug('Dashboard: User authenticated, staying on dashboard');
    }
  });

  const stats = createMemo(() => {
    logger.trace('Dashboard: Stats memo triggered');
    if (!projects()) {
      logger.debug('Dashboard: No projects data yet');
      return {};
    }

    const projectsData = projects();
    const totalProjects = projectsData.length;
    const completedProjects = projectsData.filter(p => p.uiStatus === 'completed').length;
    const inProgressProjects = projectsData.filter(p => p.uiStatus === 'processing').length;
    const idleProjects = projectsData.filter(p => p.uiStatus === 'idle').length;
    const pausedProjects = projectsData.filter(p => p.uiStatus === 'paused').length;

    const totalCompletedSteps = projectsData.reduce((sum, p) => sum + (p.completedSteps || 0), 0);
    const totalSteps = projectsData.reduce((sum, p) => sum + (p.totalSteps || 51), 0);

    const overallProgress = totalSteps > 0 ? (totalCompletedSteps / totalSteps) * 100 : 0;

    const totalCreditsAvailable = user()?.subscription?.maxCredits || 100;
    const totalCreditsConsumed = totalCreditsAvailable - (user()?.credits?.balance || 0);

    const statsResult = {
      totalProjects,
      completedProjects,
      inProgressProjects,
      idleProjects,
      pausedProjects,
      totalCompletedSteps,
      totalSteps,
      overallProgress,
      totalCreditsAvailable,
      totalCreditsConsumed
    };
    logger.debug('Dashboard: Stats calculated:', statsResult);
    return statsResult;
  });

  const recentProjects = createMemo(() => {
    if (!projects()) return [];
    return projects()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  });

  const recentActivity = createMemo(() => {
    if (!activities()) return [];

    return activities().map(activity => ({
      type: activity.action_type,
      message: activity.description,
      timestamp: activity.timestamp,
      projectId: activity.entity_id,
      entityType: activity.entity_type
    }));
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

     const onProjectAdded = () => refetch();
     const onProjectUpdated = () => refetch();
     window.addEventListener('projectAdded', onProjectAdded);
     window.addEventListener('projectUpdated', onProjectUpdated);

     onCleanup(() => {
       window.removeEventListener('projectAdded', onProjectAdded);
       window.removeEventListener('projectUpdated', onProjectUpdated);
     });
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
                  <div class="space-y-4 max-h-96 overflow-y-auto">
                    <For each={recentActivity()}>
                     {(activity) => (
                       <div class="flex items-start gap-3">
                         <div class={`p-2 rounded-full ${
                           activity.type.includes('created') ? 'bg-info/10 text-info' :
                           activity.type.includes('completed') || activity.type.includes('credit') ? 'bg-success/10 text-success' :
                           activity.type.includes('deleted') ? 'bg-error/10 text-error' :
                           'bg-base-200 text-base-content/70'
                         }`}>
                           <i
                             data-lucide={
                               activity.type.includes('created') ? 'plus' :
                               activity.type.includes('completed') || activity.type.includes('credit') ? 'check' :
                               activity.type.includes('updated') ? 'edit' :
                               activity.type.includes('deleted') ? 'trash' :
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
                     value={stats().totalCreditsConsumed || 0}
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