import {
  createSignal,
  createResource,
  createMemo,
  onMount,
  onCleanup,
  For,
  Show,
  useContext,
  createEffect,
} from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { _getProjects } from '@lib/database/projects.js';
import { _getUserActivities } from '@lib/database/activities.js';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../hooks/useLanguage';
import { dashboardTranslations } from '../assets/translations/translations-index.js';
import { formatRelativeTime } from '@lib/generalUtils.js';
import ProjectCard from '../components/ProjectCard.jsx';
import { logger } from '@lib/core';
import { setPendingProjectId } from '../stores/projectsStore';

const Dashboard = () => {
  logger.info('Dashboard: Component mounting');
  logger.debug('Dashboard: Initializing signals and resources');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAuthenticated, user } = useUser();
  logger.debug('Dashboard: Hooks initialized, user authenticated:', !!user());
  const [projects, { refetch }] = createResource(() => {
    logger.debug('Dashboard: Fetching projects');
    return _getProjects({ userId: user()?.id });
  });

  const [activities, { refetch: refetchActivities }] = createResource(
    () => {
      const userId = user()?.id;
      logger.debug('Dashboard: Activities resource triggered, userId:', userId);
      return userId;
    },
    async userId => {
      logger.debug('Dashboard: Fetching activities for user:', userId);
      if (!userId) {
        logger.debug('Dashboard: No userId, returning empty activities');
        return [];
      }
      try {
        const result = await _getUserActivities({
          userId,
          limit: 20,
          offset: 0,
        });
        logger.debug(
          'Dashboard: Activities fetched, count:',
          result?.length || 0
        );
        return result;
      } catch (e) {
        logger.error(
          'Dashboard: Error fetching activities:',
          e.message,
          e.stack
        );
        return [];
      }
    }
  );

  // Redirect if not authenticated
  createEffect(() => {
    const auth = isAuthenticated();
    logger.trace(
      'Dashboard: Auth check effect triggered, isAuthenticated:',
      auth
    );
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
    const completedProjects = projectsData.filter(
      p => p.ui_status === 'completed'
    ).length;
    const inProgressProjects = projectsData.filter(
      p => p.ui_status === 'processing'
    ).length;
    const idleProjects = projectsData.filter(
      p => p.ui_status === 'idle'
    ).length;
    const pausedProjects = projectsData.filter(
      p => p.ui_status === 'paused'
    ).length;

    const totalCompletedSteps = projectsData.reduce(
      (sum, p) => sum + (p.completedSteps || 0),
      0
    );
    const totalSteps = projectsData.reduce(
      (sum, p) => sum + (p.totalSteps || 51),
      0
    );

    const overallProgress =
      totalSteps > 0 ? (totalCompletedSteps / totalSteps) * 100 : 0;

    const totalCreditsAvailable = user()?.subscription?.maxCredits || 100;
    const totalCreditsConsumed =
      totalCreditsAvailable - (user()?.credits?.balance || 0);

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
      totalCreditsConsumed,
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
      entityType: activity.entity_type,
    }));
  });

  const handleProjectClick = project => {
    setPendingProjectId(project.id);
    navigate('/');
  };

  const formatTime = minutes => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = dateString => formatRelativeTime(dateString, t());

  onMount(async () => {
    if (window.lucide) window.lucide.createIcons();
  });

  onCleanup(() => {
    // Cleanup any resources if needed
  });

  return (
    <div class="mx-auto max-w-6xl space-y-8 overflow-visible px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div class="py-6">
        <div class="mb-4 flex justify-start">
          <button
            onClick={() => navigate('/')}
            class="btn btn-ghost btn-sm gap-2"
          >
            <svg
              class="h-4 w-4 rtl:scale-x-[-1] rtl:transform"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span class="hidden sm:inline">Back</span>
          </button>
        </div>

        <div class="text-center">
          <h1 class="text-base-content mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">
            {t().dashboard}
          </h1>
          <p class="text-base-content/70 mx-auto mb-6 max-w-2xl text-sm sm:text-base">
            {t().overview} {t().projectsLower} {t().progressLower}.
          </p>
        </div>
      </div>

      {/* Content */}
      <div class="bg-base-100 rounded-box border-base-200 border p-4 shadow-sm sm:p-6 md:p-8">
        <Show
          when={!projects.loading}
          fallback={
            <div class="flex items-center justify-center py-16">
              <div class="loading loading-spinner loading-lg" />
              <span class="ms-4 text-lg">{t().loadingDashboard}</span>
            </div>
          }
        >
          {/* Stats Cards */}
          <div class="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
            <div class="card from-primary to-primary/80 text-primary-content bg-gradient-to-br shadow-lg">
              <div class="card-body">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold">{t().totalProjects}</h3>
                    <p class="text-3xl font-bold">{stats().totalProjects}</p>
                  </div>
                  <i data-lucide="folder" class="h-8 w-8 opacity-80" />
                </div>
              </div>
            </div>

            <div class="card from-success to-success/80 text-success-content bg-gradient-to-br shadow-lg">
              <div class="card-body">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold">{t().completed}</h3>
                    <p class="text-3xl font-bold">
                      {stats().completedProjects}
                    </p>
                  </div>
                  <i data-lucide="check-circle" class="h-8 w-8 opacity-80" />
                </div>
              </div>
            </div>

            <div class="card from-warning to-warning/80 text-warning-content bg-gradient-to-br shadow-lg">
              <div class="card-body">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold">{t().inProgress}</h3>
                    <p class="text-3xl font-bold">
                      {stats().inProgressProjects}
                    </p>
                  </div>
                  <i data-lucide="loader" class="h-8 w-8 opacity-80" />
                </div>
              </div>
            </div>

            <div class="card from-secondary to-secondary/80 text-secondary-content bg-gradient-to-br shadow-lg">
              <div class="card-body">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold">{t().overallProgress}</h3>
                    <p class="text-3xl font-bold">
                      {Math.round(stats().overallProgress)}%
                    </p>
                  </div>
                  <i data-lucide="trending-up" class="h-8 w-8 opacity-80" />
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3 lg:gap-8">
            {/* Recent Projects */}
            <div class="order-2 lg:order-1 lg:col-span-2">
              <div class="bg-base-100 rounded-box border-base-200 border p-4 shadow-sm md:p-6">
                <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center md:mb-6">
                  <h2 class="text-lg font-bold md:text-xl">
                    {t().recentProjects}
                  </h2>
                  <A href="/explore" class="btn btn-ghost btn-sm">
                    {t().viewAll}
                    <i data-lucide="arrow-right" class="ms-1 h-4 w-4" />
                  </A>
                </div>

                <Show
                  when={recentProjects().length > 0}
                  fallback={
                    <div class="text-base-content/50 py-8 text-center">
                      <i
                        data-lucide="folder-x"
                        class="mx-auto mb-2 h-12 w-12"
                      />
                      <p>
                        {t().noProjectsYet || 'No projects yet.'}{' '}
                        {t().createFirstProject ||
                          'Create your first project to get started!'}
                      </p>
                      <button
                        class="btn btn-primary mt-4"
                        onClick={() => navigate('/')}
                      >
                        {t().createProject || 'Create Project'}
                      </button>
                    </div>
                  }
                >
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
                    <For each={recentProjects()}>
                      {project => (
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
            <div class="order-1 lg:order-2">
              <div class="bg-base-100 rounded-box border-base-200 border p-4 shadow-sm md:p-6">
                <h2 class="mb-4 text-lg font-bold md:mb-6 md:text-xl">
                  {t().recentActivity}
                </h2>

                <Show
                  when={recentActivity().length > 0}
                  fallback={
                    <div class="text-base-content/50 py-8 text-center">
                      <i
                        data-lucide="activity"
                        class="mx-auto mb-2 h-12 w-12"
                      />
                      <p>{t().noRecentActivity}</p>
                    </div>
                  }
                >
                  <div class="max-h-64 space-y-3 overflow-y-auto md:max-h-96">
                    <For each={recentActivity()}>
                      {activity => (
                        <div class="flex items-start gap-2 md:gap-3">
                          <div
                            class={`shrink-0 rounded-full p-1.5 md:p-2 ${
                              activity.type.includes('created')
                                ? 'bg-info/10 text-info'
                                : activity.type.includes('completed') ||
                                    activity.type.includes('credit')
                                  ? 'bg-success/10 text-success'
                                  : activity.type.includes('deleted')
                                    ? 'bg-error/10 text-error'
                                    : 'bg-base-200 text-base-content/70'
                            }`}
                          >
                            <i
                              data-lucide={
                                activity.type.includes('created')
                                  ? 'plus'
                                  : activity.type.includes('completed') ||
                                      activity.type.includes('credit')
                                    ? 'check'
                                    : activity.type.includes('updated')
                                      ? 'edit'
                                      : activity.type.includes('deleted')
                                        ? 'trash'
                                        : 'activity'
                              }
                              class="h-3 w-3 md:h-4 md:w-4"
                            />
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="text-base-content truncate text-xs md:text-sm">
                              {activity.message}
                            </p>
                            <p class="text-base-content/60 text-xs">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              {/* Resource Usage */}
              <div class="bg-base-100 rounded-box border-base-200 mt-4 border p-4 shadow-sm md:mt-6 md:p-6">
                <h3 class="mb-3 text-base font-semibold md:mb-4 md:text-lg">
                  {t().resourceUsage}
                </h3>

                <div class="space-y-3 md:space-y-4">
                  <div>
                    <div class="mb-1 flex justify-between text-xs md:text-sm">
                      <span>{t().creditsUsed}</span>
                      <span>
                        {stats().totalCreditsConsumed} /{' '}
                        {stats().totalCreditsAvailable}
                      </span>
                    </div>
                    <progress
                      class="progress progress-primary w-full"
                      value={stats().totalCreditsConsumed || 0}
                      max={stats().totalCreditsAvailable || 1}
                    />
                  </div>

                  <div class="flex items-center justify-between text-xs md:text-sm">
                    <span class="flex items-center gap-1">
                      <i data-lucide="clock" class="h-3 w-3 md:h-4 md:w-4" />
                      {t().timeInvested}
                    </span>
                    <span>{formatTime(stats().totalTimeConsumed)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Dashboard;
