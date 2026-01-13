import { createSignal, createResource, createMemo, onMount, For, Show, createEffect, useContext } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { getPublicProjectsWithVotes } from "../../lib/db";
// Removed supabase import
import { LangContext } from "../../context/LangContext";
import { useUser } from "../../context/UserContext";
import { translations } from "../../assets/translations/translations-index.js";
import ProjectCard from "../../components/ui/ProjectCard";
import logger from '../../lib/logger.js';


const Explore = () => {
  logger.trace('Explore: Starting');
  const { lang } = useContext(LangContext);
  const { user } = useUser();
  const [currentLang, setCurrentLang] = createSignal(lang());
  const [search, setSearch] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal("all");
  const [sortBy, setSortBy] = createSignal("createdAt");

  const fetchProjects = async () => {
    const currentUserId = user()?.id || 'local-user';
    return await getPublicProjectsWithVotes(currentUserId);
  };

  const [projects, { refetch }] = createResource(fetchProjects);

  const t = () => translations[currentLang()];

  createEffect(() => {
    setCurrentLang(lang());
  });

  const filteredAndSortedProjects = createMemo(() => {
    if (!projects()) return [];

    let filtered = projects().filter(project => {
      // Search filter
      const matchesSearch = !search() ||
        (project.name && project.name.toLowerCase().includes(search().toLowerCase())) ||
        (project.description && project.description.toLowerCase().includes(search().toLowerCase()));

      // Status filter
      const matchesStatus = statusFilter() === "all" || project.uiStatus === statusFilter();

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy()) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "progress":
          const aProgress = (a.completedSteps || 0) / (a.totalSteps || 51);
          const bProgress = (b.completedSteps || 0) / (b.totalSteps || 51);
          return bProgress - aProgress;
        case "votes":
          const aScore = (a.upvotes || 0) - (a.downvotes || 0);
          const bScore = (b.upvotes || 0) - (b.downvotes || 0);
          return bScore - aScore;
        case "createdAt":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  });

  const handleProjectClick = (project) => {
    // Dispatch event to open project in main interface
    window.dispatchEvent(new CustomEvent('openProject', { detail: project.id }));
    // Navigate to home page
    navigate('/');
  };

  const handleVote = (projectId, result) => {
    // Refetch projects to update vote counts
    refetch();
  };

   onMount(() => {
     // Listen for project updates
     window.addEventListener('projectAdded', () => refetch());
     window.addEventListener('projectUpdated', () => refetch());
   });

  const statusOptions = [
    { value: "all", label: t().allStatus, icon: "layers" },
    { value: "idle", label: t().idle, icon: "circle" },
    { value: "processing", label: t().processing, icon: "loader" },
    { value: "completed", label: t().completed, icon: "check-circle" },
    { value: "paused", label: t().paused, icon: "pause-circle" }
  ];

  const sortOptions = [
    { value: "createdAt", label: t().recentlyCreated, icon: "clock" },
    { value: "name", label: t().name, icon: "sort-alpha" },
    { value: "progress", label: t().progress, icon: "trending-up" },
    { value: "votes", label: "Most Voted", icon: "thumbs-up" }
  ];

  return (
    <div class={`space-y-6  ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div class="text-center py-8">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().exploreProjects}</h1>
        <p class="text-lg text-base-content/70 max-w-2xl mx-auto">
          {t().discoverManageProjects} {t().clickContinueProject}
        </p>
      </div>

      {/* Filters and Search */}
      <div class="bg-base-100 rounded-box p-6 shadow-sm border border-base-200">
        <div class="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div class="flex-1 w-full lg:w-auto">
              <div class="relative">
               <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" viewBox="0 0 24 24"><path d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/></svg>
               <input
                 type="text"
                 placeholder={t().searchProjects}
                 class="input input-bordered w-full pl-10"
                 value={search()}
                 onInput={(e) => setSearch(e.target.value)}
               />
             </div>
          </div>

          {/* Status Filter */}
          <div class="w-full lg:w-auto">
            <select
              class="select select-bordered w-full"
              value={statusFilter()}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <For each={statusOptions}>
                {(option) => (
                  <option value={option.value}>
                    {option.label}
                  </option>
                )}
              </For>
            </select>
          </div>

          {/* Sort */}
          <div class="w-full lg:w-auto">
            <select
              class="select select-bordered w-full"
              value={sortBy()}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <For each={sortOptions}>
                {(option) => (
                  <option value={option.value}>
                    {option.label}
                  </option>
                )}
              </For>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <Show
        when={!projects.loading}
        fallback={
          <div class="flex justify-center items-center py-16">
            <div class="loading loading-spinner loading-lg"></div>
            <span class="ml-4 text-lg">{t().loadingProjects}</span>
          </div>
        }
      >
        <Show
          when={filteredAndSortedProjects().length > 0}
          fallback={
             <div class="text-center py-16">
               <svg class="w-16 h-16 mx-auto mb-4 text-base-content/30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="64" height="64" viewBox="0 0 24 24"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="m9.5 10.5 5 5"/><path d="m14.5 10.5-5 5"/></svg>
               <h3 class="text-xl font-semibold text-base-content mb-2">{t().noProjectsFound}</h3>
              <p class="text-base-content/70 mb-6">
                {search() || statusFilter() !== "all"
                  ? t().tryAdjustingSearch
                  : t().getStartedCreateProject}
              </p>
              {!search() && statusFilter() === "all" && (
                 <A
                   href="/"
                   class="btn btn-primary"
                 >
                   <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                   {t().createNewProject}
                 </A>
              )}
            </div>
          }
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <For each={filteredAndSortedProjects()}>
              {(project) => (
                <ProjectCard
                  project={project}
                  onClick={handleProjectClick}
                  showVotes={true}
                  onVote={handleVote}
                  className="h-full"
                />
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* Stats Footer */}
      <Show when={projects() && projects().length > 0}>
        <div class="bg-base-100 rounded-box p-4 shadow-sm border border-base-200">
          <div class="flex justify-center items-center gap-6 text-sm text-base-content/60">
             <div class="flex items-center gap-2">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" viewBox="0 0 24 24"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
               <span>{projects().length} {t().totalProjects}</span>
             </div>
             <div class="flex items-center gap-2">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
               <span>{projects().filter(p => p.uiStatus === 'completed').length} {t().completed}</span>
             </div>
             <div class="flex items-center gap-2">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" viewBox="0 0 24 24"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
               <span>{projects().filter(p => p.uiStatus === 'processing').length} {t().inProgress}</span>
             </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Explore;