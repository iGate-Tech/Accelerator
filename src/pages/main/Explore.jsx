import {
  createSignal,
  createResource,
  createMemo,
  onMount,
  onCleanup,
  For,
  Show,
  createEffect,
  useContext,
} from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
// import { getPublicProjectsWithVotes } from "../lib/database";
// Removed supabase import
import { LangContext } from '@context/LangContext';
import { useUser } from '@context/UserContext';
import { translations } from '@assets/translations/translations-index.js';
import ProjectCard from '@components/ui/ProjectCard';
import { logger } from '@lib/core';
import { setPendingProjectId } from '@stores/projectsStore';
import { useDocumentTitle } from '@hooks/useDocumentTitle';

const Explore = () => {
  logger.trace('Explore: Starting');
  const { lang } = useContext(LangContext);
  const { user } = useUser();

  // Set document title
  useDocumentTitle('Explore');
  const [currentLang, setCurrentLang] = createSignal(lang());
  const [search, setSearch] = createSignal('');
  const [statusFilter, setStatusFilter] = createSignal('all');
  const [sortBy, setSortBy] = createSignal('createdAt');

  const fetchProjects = async () => {
    const currentUserId = user()?.id || 'local-user';
    // return await getPublicProjectsWithVotes(currentUserId);
    return [];
  };

  const [projects, { refetch }] = createResource(fetchProjects);

  const t = createMemo(() => translations[currentLang()]);

  createEffect(() => {
    setCurrentLang(lang());
  });

  const filteredAndSortedProjects = createMemo(() => {
    if (!projects()) return [];

    let filtered = projects().filter(project => {
      // Search filter
      const matchesSearch =
        !search() ||
        (project.name &&
          project.name.toLowerCase().includes(search().toLowerCase())) ||
        (project.description &&
          project.description.toLowerCase().includes(search().toLowerCase()));

      // Status filter
      const matchesStatus =
        statusFilter() === 'all' || project.ui_status === statusFilter();

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy()) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'progress':
          const aProgress = (a.completedSteps || 0) / (a.totalSteps || 51);
          const bProgress = (b.completedSteps || 0) / (b.totalSteps || 51);
          return bProgress - aProgress;
        case 'votes':
          const aScore = (a.upvotes || 0) - (a.downvotes || 0);
          const bScore = (b.upvotes || 0) - (b.downvotes || 0);
          return bScore - aScore;
        case 'createdAt':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  });

  const handleProjectClick = project => {
    setPendingProjectId(project.id);
    navigate('/');
  };

  const handleVote = (projectId, result) => {
    // Refetch projects to update vote counts
    refetch();
  };

  onMount(() => {
    // Mount any necessary initialization here
  });

  onCleanup(() => {
    // Cleanup any resources if needed
  });

  const statusOptions = [
    { value: 'all', label: t().allStatus, icon: 'layers' },
    { value: 'idle', label: t().idle, icon: 'circle' },
    { value: 'processing', label: t().processing, icon: 'loader' },
    { value: 'completed', label: t().completed, icon: 'check-circle' },
    { value: 'paused', label: t().paused, icon: 'pause-circle' },
  ];

  const sortOptions = [
    { value: 'createdAt', label: t().recentlyCreated, icon: 'clock' },
    { value: 'name', label: t().name, icon: 'sort-alpha' },
    { value: 'progress', label: t().progress, icon: 'trending-up' },
    { value: 'votes', label: 'Most Voted', icon: 'thumbs-up' },
  ];

  return (
    <div class="mx-auto max-w-6xl space-y-8 overflow-visible px-4 py-6 sm:px-6 sm:py-8">
      {/* Back Button */}
      <div class="mb-4 flex justify-start">
        <button
          onClick={() => window.history.back()}
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

      {/* Header */}
      <div class="px-2 py-6 text-center md:px-4 md:py-8">
        <h1 class="text-base-content mb-3 text-2xl font-bold sm:text-3xl md:mb-4 md:text-4xl">
          {t().exploreProjects}
        </h1>
        <p class="text-base-content/70 mx-auto max-w-2xl px-2 text-sm sm:text-base">
          {t().discoverManageProjects} {t().clickContinueProject}
        </p>
      </div>

      {/* Filters and Search */}
      <div class="bg-base-100 rounded-box border-base-200 mx-2 border p-4 shadow-sm md:mx-0 md:p-6">
        <div class="flex flex-col items-center gap-3 sm:flex-row md:gap-4">
          {/* Search */}
          <div class="w-full flex-1 sm:w-auto">
            <div class="relative">
              <svg
                class="text-base-content/50 absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 transform"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                width="16"
                height="16"
                viewBox="0 0 24 24"
              >
                <path d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
              </svg>
              <input
                type="text"
                placeholder={t().searchProjects}
                class="input input-bordered w-full ps-10 text-sm md:text-base"
                value={search()}
                onInput={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div class="w-full sm:w-auto">
            <select
              class="select select-bordered w-full text-sm md:text-base"
              value={statusFilter()}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <For each={statusOptions}>
                {option => <option value={option.value}>{option.label}</option>}
              </For>
            </select>
          </div>

          {/* Sort */}
          <div class="w-full sm:w-auto">
            <select
              class="select select-bordered w-full text-sm md:text-base"
              value={sortBy()}
              onChange={e => setSortBy(e.target.value)}
            >
              <For each={sortOptions}>
                {option => <option value={option.value}>{option.label}</option>}
              </For>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <Show
        when={!projects.loading}
        fallback={
          <div class="flex items-center justify-center px-2 py-16">
            <div class="loading loading-spinner loading-lg" />
            <span class="ms-4 text-sm md:text-lg">{t().loadingProjects}</span>
          </div>
        }
      >
        <Show
          when={filteredAndSortedProjects().length > 0}
          fallback={
            <div class="px-2 py-16 text-center">
              <svg
                class="text-base-content/30 mx-auto mb-4 h-12 w-12 md:h-16 md:w-16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                width="64"
                height="64"
                viewBox="0 0 24 24"
              >
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                <path d="m9.5 10.5 5 5" />
                <path d="m14.5 10.5-5 5" />
              </svg>
              <h3 class="text-base-content mb-2 text-lg font-semibold md:text-xl">
                {t().noProjectsFound}
              </h3>
              <p class="text-base-content/70 mb-6 text-sm md:text-base">
                {search() || statusFilter() !== 'all'
                  ? t().tryAdjustingSearch
                  : t().getStartedCreateProject}
              </p>
              {!search() && statusFilter() === 'all' && (
                <A href="/" class="btn btn-primary">
                  <svg
                    class="me-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  {t().createNewProject}
                </A>
              )}
            </div>
          }
        >
          <div class="xs:grid-cols-2 grid grid-cols-1 gap-3 px-2 sm:grid-cols-2 md:grid-cols-3 md:gap-6 md:px-0 lg:grid-cols-3 xl:grid-cols-4">
            <For each={filteredAndSortedProjects()}>
              {project => (
                <ProjectCard
                  project={project}
                  onClick={handleProjectClick}
                  showVotes={true}
                  onVote={handleVote}
                  class="h-full"
                />
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* Stats Footer */}
      <Show when={projects() && projects().length > 0}>
        <div class="bg-base-100 rounded-box border-base-200 mx-2 border p-4 shadow-sm md:mx-0">
          <div class="text-base-content/60 flex flex-wrap items-center justify-center gap-3 px-2 text-xs md:gap-6 md:text-sm">
            <div class="flex items-center gap-1 md:gap-2">
              <svg
                class="h-3 w-3 md:h-4 md:w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                width="16"
                height="16"
                viewBox="0 0 24 24"
              >
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
              <span>
                {projects().length} {t().totalProjects}
              </span>
            </div>
            <div class="flex items-center gap-1 md:gap-2">
              <svg
                class="h-3 w-3 md:h-4 md:w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                width="16"
                height="16"
                viewBox="0 0 24 24"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
              <span>
                {projects().filter(p => p.ui_status === 'completed').length}{' '}
                {t().completed}
              </span>
            </div>
            <div class="flex items-center gap-1 md:gap-2">
              <svg
                class="h-3 w-3 md:h-4 md:w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                width="16"
                height="16"
                viewBox="0 0 24 24"
              >
                <path d="M12 2v4" />
                <path d="m16.2 7.8 2.9-2.9" />
                <path d="M18 12h4" />
                <path d="m16.2 16.2 2.9 2.9" />
                <path d="M12 18v4" />
                <path d="m4.9 19.1 2.9-2.9" />
                <path d="M2 12h4" />
                <path d="m4.9 4.9 2.9 2.9" />
              </svg>
              <span>
                {projects().filter(p => p.ui_status === 'processing').length}{' '}
                {t().inProgress}
              </span>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Explore;
