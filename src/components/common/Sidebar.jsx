import { A, useLocation, useNavigate } from "@solidjs/router";
import { useContext, onMount, createSignal, createEffect, For, Show, createMemo } from "solid-js";
import { LangContext } from "../../context/LangContext";
import { useUser } from "../../context/UserContext";
import { translations } from "../../assets/translations/translations-index.js";
import { getProjects, updateProject, deleteProject, deleteAllProjects, exportAllProjects, exportAllData, exportProject, exportReports } from "../../lib/db";
// Removed sync imports
import { toastManager } from "../../lib/feedback";
import logger from "../../lib/logger.js";


const Sidebar = () => {
  logger.trace('Sidebar: Starting');
  const { lang } = useContext(LangContext);
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = createSignal([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [editingProjectId, setEditingProjectId] = createSignal(null);
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  // Removed sync status

  const [currentLang, setCurrentLang] = createSignal(lang());

  const t = () => translations[currentLang()];

  // Computed values with debounced search
  const filteredProjects = createMemo(() => {
    const projs = projects();
    if (!Array.isArray(projs)) return [];
    const query = searchQuery().toLowerCase().trim();
    if (!query) return projs;
    return projs.filter(project =>
      project && typeof project === 'object' && project.name && typeof project.name === 'string' && project.name.toLowerCase().includes(query)
    );
  });

  const loadProjects = async () => {
    try {
      const currentUser = user();
      logger.debug('Sidebar loadProjects: currentUser:', currentUser);
      if (!currentUser || typeof currentUser !== 'object' || !currentUser.id || typeof currentUser.id !== 'string') {
        logger.debug('Sidebar loadProjects: no valid user, skipping');
        return;
      }
      logger.debug('Sidebar loadProjects: loading projects for user:', currentUser.id);
      const projs = await getProjects(currentUser.id) || [];
      logger.debug('Sidebar loadProjects: loaded projects:', projs.length);
      setProjects(projs);
    } catch (error) {
      logger.error('Failed to load projects:', error);
      setProjects([]);
    }
  };

  const handleProjectAction = async (action, projectId, newName = null) => {
    const project = projects().find(p => p.id === projectId);
    if (!project) return;

    switch (action) {
      case 'rename':
        if (newName && newName.trim()) {
          await updateProject(projectId, { name: newName.trim() });
          window.dispatchEvent(new CustomEvent('projectUpdated'));
          toastManager.success(t().rename + ' ' + t().successful);
          await loadProjects();
        }
        break;

      case 'delete':
        if (window.confirm(t().delete + ' "' + project.name + '"?')) {
          await deleteProject(projectId);
          window.dispatchEvent(new CustomEvent('projectDeleted', { detail: { projectId } }));
          toastManager.success(t().delete + ' ' + t().successful);
          await loadProjects();
        }
        break;

      case 'open':
        window.dispatchEvent(new CustomEvent('openProject', { detail: projectId }));
        break;

      default:
        logger.debug('Unknown action:', action);
    }
  };

  const handleDeleteAllProjects = async () => {
    if (window.confirm(t().deleteAllProjects + '?')) {
      await deleteAllProjects();
      toastManager.success(t().deleteAllProjects + ' ' + t().successful);
      await loadProjects();
    }
  };

  const handleExportAllProjects = async () => {
    const currentUser = user();
    const data = await exportAllProjects(currentUser?.id);
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = t().allProjectsFilename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toastManager.error(t().exportAllProjects + ' ' + t().failed);
    }
  };



  onMount(async () => {
    await loadProjects();
     // Listen for project added events
     window.addEventListener('projectAdded', async () => {
       await loadProjects();
     });
     // Listen for project updated events
     window.addEventListener('projectUpdated', async () => {
       await loadProjects();
     });
    // Create Lucide icons
    if (window.lucide) window.lucide.createIcons();
  });

  createEffect(() => {
    const newLang = lang();
    setCurrentLang(newLang);
    logger.debug('Sidebar language changed to:', newLang);
  });

  createEffect(() => {
    const currentUser = user();
    if (currentUser && currentUser.id) {
      loadProjects();
    }
  });

  createEffect(() => {
    projects();
    searchQuery();
    currentLang(); // React to language changes
    isCollapsed(); // React to collapse changes
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <aside
      class="sidebar h-screen bg-base-100 border-base-200 overflow-y-auto w-[56] hidden lg:block z-[55]"
      classList={{
        'border-e': currentLang() === 'en',
        'border-s': currentLang() === 'ar'
      }}
     >
              <div class="relative mb-4">
                <A href="/" onClick={(e) => { e.preventDefault(); setIsCollapsed(!isCollapsed()); }} class="cursor-pointer flex w-full">
                     <img src={isCollapsed() ? "/src/assets/favicon.svg" : "/src/assets/iGate-tech-logo.svg"} alt="Logo" class={isCollapsed() ? "h-8 mt-4 mx-auto" : "h-8 mt-4 ml-8"} />
                   </A>
                <Show when={!isCollapsed()}>
                  <button
                    onClick={() => setIsCollapsed(true)}
                    class="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
                    aria-label="Collapse sidebar"
                  >
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                  </button>
                </Show>
              </div>
      <div class="p-4 ">
        <ul class="menu border border-base-200 rounded-box w-full mb-5">
              <li classList={{ "menu-active": location.pathname === "/" }}>
                <A href="/" onClick={() => window.dispatchEvent(new CustomEvent('resetAgent'))} class="flex items-center gap-3 px-4 py-3 hover:bg-base-300 transition-colors" classList={{ 'justify-center': isCollapsed(), 'justify-start': !isCollapsed() }} aria-label={`Create new project - ${t().newProject}`}>
                 <div class="p-1 bg-primary/10 rounded">
                   <i data-lucide="plus" class="w-4 h-4 text-primary" aria-hidden="true"></i>
                 </div>
                  <span class="font-medium" classList={{ 'lg:hidden': isCollapsed() }}>{t().newProject}</span>
               </A>
             </li>
             <li classList={{ "menu-active": location.pathname === "/apps" }}>
               <A href="/apps" class="flex items-center gap-3 px-4 py-3 hover:bg-base-300 transition-colors" classList={{ 'justify-center': isCollapsed(), 'justify-start': !isCollapsed() }} aria-label="Apps">
                 <div class="p-1 bg-secondary/10 rounded">
                   <i data-lucide="grid" class="w-4 h-4 text-secondary" aria-hidden="true"></i>
                 </div>
                 <span class="font-medium" classList={{ 'lg:hidden': isCollapsed() }}>Apps</span>
               </A>
             </li>
              <li classList={{ "menu-active": location.pathname === "/dashboard" }}>
               <A href="/dashboard" class="flex items-center gap-3 px-4 py-3 hover:bg-base-300 transition-colors" classList={{ 'justify-center': isCollapsed(), 'justify-start': !isCollapsed() }} aria-label={`Dashboard - ${t().dashboard}`}>
                <div class="p-1 bg-warning/10 rounded">
                  <i data-lucide="bar-chart" class="w-4 h-4 text-warning" aria-hidden="true"></i>
                </div>
                 <span class="font-medium" classList={{ 'lg:hidden': isCollapsed() }}>{t().dashboard}</span>
              </A>
            </li>
              <li classList={{ "menu-active": location.pathname === "/portfolio" }}>
                <A href="/portfolio" class="flex items-center gap-3 px-4 py-3 hover:bg-base-300 transition-colors" classList={{ 'justify-center': isCollapsed(), 'justify-start': !isCollapsed() }} aria-label={`Portfolio - ${t().portfolio}`}>
                 <div class="p-1 bg-accent/10 rounded">
                   <i data-lucide="briefcase" class="w-4 h-4 text-accent" aria-hidden="true"></i>
                 </div>
                  <span class="font-medium" classList={{ 'lg:hidden': isCollapsed() }}>{t().portfolio}</span>
               </A>
             </li>
             <li classList={{ "menu-active": location.pathname === "/invitations" }}>
               <A href="/invitations" class="flex items-center gap-3 px-4 py-3 hover:bg-base-300 transition-colors" classList={{ 'justify-center': isCollapsed(), 'justify-start': !isCollapsed() }} aria-label={`Collaborate - Invitations`}>
                 <div class="p-1 bg-info/10 rounded">
                   <i data-lucide="users" class="w-4 h-4 text-info" aria-hidden="true"></i>
                 </div>
                 <span class="font-medium" classList={{ 'lg:hidden': isCollapsed() }}>Collaborate</span>
               </A>
             </li>
             <li classList={{ "menu-active": location.pathname === "/explore" }}>
              <A href="/explore" class="flex items-center gap-3 px-4 py-3 hover:bg-base-300 transition-colors" classList={{ 'justify-center': isCollapsed(), 'justify-start': !isCollapsed() }} aria-label={`Explore project ideas - ${t().exploreIdeas}`}>
               <div class="p-1 bg-secondary/10 rounded">
                 <i data-lucide="compass" class="w-4 h-4 text-secondary" aria-hidden="true"></i>
               </div>
                <span class="font-medium" classList={{ 'lg:hidden': isCollapsed() }}>{t().exploreIdeas}</span>
             </A>
           </li>
            <li classList={{ "menu-active": location.pathname === "/help" }}>
              <A href="/help" class="flex items-center gap-3 px-4 py-3 hover:bg-base-300 transition-colors" classList={{ 'justify-center': isCollapsed(), 'justify-start': !isCollapsed() }} aria-label={`Get help and support - ${t().help}`}>
               <div class="p-1 bg-info/10 rounded">
                 <i data-lucide="help-circle" class="w-4 h-4 text-info" aria-hidden="true"></i>
               </div>
                <span class="font-medium" classList={{ 'lg:hidden': isCollapsed() }}>{t().help}</span>
             </A>
            </li>

        </ul>
         <section class="menu border border-base-200 rounded-box w-full" classList={{ 'lg:hidden': isCollapsed() }}>
          <li>
            <details open>
               <summary class="flex items-center justify-between px-4 py-3 hover:bg-base-300 transition-colors cursor-pointer" classList={{ 'justify-center': isCollapsed(), 'justify-between': !isCollapsed() }}>
                <div class="flex items-center gap-3  w-full">
                  <div class="p-1 bg-accent/10 rounded">
                    <i data-lucide="folder" class="w-4 h-4 text-accent"></i>
                  </div>
                   <span class="font-medium" classList={{ 'lg:hidden': isCollapsed() }}>{t().allProjects}</span>
                   <span class="badge badge-sm badge-accent" classList={{ 'lg:hidden': isCollapsed() }}>{filteredProjects().length}</span>
                </div>
                <button
                  class="btn btn-ghost btn-xs opacity-60 hover:opacity-100"
                  popovertarget="popover-all-projects"
                  style="anchor-name:--anchor-all-projects"
                >
                  <i data-lucide="more-vertical" class="w-4 h-4"></i>
                </button>
              </summary>

              <div
                class={`dropdown menu w-56 rounded-box bg-base-100 shadow-lg border border-base-200 ${
                  currentLang() === 'ar' ? 'dropdown-start' : 'dropdown-end'
                }`}
                popover
                id="popover-all-projects"
                style="position-anchor:--anchor-all-projects"
              >
                <li>
                  <A
                    href="/"
                    onClick={() => window.dispatchEvent(new CustomEvent('resetAgent'))}
                    class="flex items-center gap-2"
                  >
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    {t().newProject}
                  </A>
                </li>
                <li>
                  <a onclick={handleExportAllProjects} class="flex items-center gap-2">
                    <i data-lucide="download" class="w-4 h-4"></i>
                    {t().exportAllProjects}
                  </a>
                </li>
                <li>
                  <a onclick={async () => { try { const data = await exportAllData(currentUser?.id); downloadJSON(data, 'all_data_backup.json'); toastManager.success(t().backupAllData + ' ' + t().successful); } catch (error) { toastManager.error(t().backupAllData + ' ' + t().failed); } }} class="flex items-center gap-2">
                    <i data-lucide="archive" class="w-4 h-4"></i>
                    {t().backupAllData}
                  </a>
                </li>
                <div class="divider my-1"></div>
                <li>
                  <a onclick={handleDeleteAllProjects} class="flex items-center gap-2 text-error">
                    <i data-lucide="trash" class="w-4 h-4"></i>
                    {t().deleteAllProjects}
                  </a>
                </li>
              </div>

               <div class="px-4 pb-3" classList={{ 'lg:hidden': isCollapsed() }}>
                 <div class="relative">
                  <input
                    type="text"
                    placeholder={t().sidebarSearch}
                    class="input input-bordered input-sm w-full pr-8"
                    value={searchQuery()}
                    onInput={(e) => setSearchQuery(e.target.value)}
                  />
                  <i data-lucide="search" class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40"></i>
                </div>
               </div>
               <ul class="menu bg-base-100 rounded-box w-full">
                 <For each={filteredProjects()}>
                  {(project) => (
                     <li>
                       <details>
                          <summary class="flex justify-between items-center px-4 py-2 hover:bg-base-300 rounded-lg transition-colors cursor-pointer" classList={{ 'justify-center': isCollapsed() }}>
                            <span class="flex items-center w-full">
                              <div class="p-1 bg-base-300 rounded mr-2">
                                <i data-lucide="folder" class="w-3 h-3 text-base-content/60"></i>
                              </div>
                               <span
                                 class="ml-2"
                                 classList={{ 'lg:hidden': isCollapsed() }}
                                 data-project-id={project.id}
                                 contentEditable={editingProjectId() === project.id}
                                 onBlur={(e) => {
                                  if (editingProjectId() === project.id) {
                                    const newName = e.target.textContent.trim();
                                   if (newName && newName !== project.name) {
                                     handleProjectAction('rename', project.id, newName.trim());
                                   }
                                    setEditingProjectId(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.target.blur();
                                  }
                                  if (e.key === 'Escape') {
                                    e.target.textContent = project.name;
                                    setEditingProjectId(null);
                                  }
                                }}
                              >
                                {project.name}
                              </span>
                            </span>
                           <button class="btn btn-ghost btn-xs" popovertarget={`popover-project-${project.id}`} style={`anchor-name:--anchor-project-${project.id}`}>
                             <i data-lucide="more-vertical" class="w-4 h-4"></i>
                           </button>
                         </summary>
                          <ul class="menu menu-xs bg-base-200 rounded-box max-w-xs w-full mt-2">
                            <li class="px-2">
                              <details open>
                                 <summary class="flex items-center gap-2">
                                   <i data-lucide="layers" class="w-4 h-4"></i>
                                   <span class="w-full" classList={{ 'lg:hidden': isCollapsed() }}>{t().models}</span>
                                 </summary>
                               <ul>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="lightbulb" class="w-4 h-4 mr-1"></i>
                                       {t().ideaModel}
                                     </a>
                                     <button class="btn btn-ghost btn-xs" popovertarget="popover-idea-model">
                                       <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                     </button>
                                   </div>
                                 </li>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="briefcase" class="w-4 h-4 mr-1"></i>
                                       {t().businessModel}
                                     </a>
                                     <button class="btn btn-ghost btn-xs" popovertarget="popover-business-model">
                                       <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                     </button>
                                   </div>
                                 </li>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="trending-up" class="w-4 h-4 mr-1"></i>
                                       {t().financialModel}
                                     </a>
                                     <button class="btn btn-ghost btn-xs" popovertarget="popover-financial-model">
                                       <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                     </button>
                                   </div>
                                 </li>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="piggy-bank" class="w-4 h-4 mr-1"></i>
                                       {t().fundingModel}
                                     </a>
                                     <button class="btn btn-ghost btn-xs" popovertarget="popover-funding-model">
                                       <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                     </button>
                                   </div>
                                 </li>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="megaphone" class="w-4 h-4 mr-1"></i>
                                       {t().marketingModel}
                                     </a>
                                     <button class="btn btn-ghost btn-xs" popovertarget="popover-marketing-model">
                                       <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                     </button>
                                   </div>
                                 </li>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="users" class="w-4 h-4 mr-1"></i>
                                       {t().teamModel}
                                     </a>
                                     <button class="btn btn-ghost btn-xs" popovertarget="popover-team-model">
                                       <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                     </button>
                                   </div>
                                 </li>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="scale" class="w-4 h-4 mr-1"></i>
                                       {t().legalModel}
                                     </a>
                                     <button class="btn btn-ghost btn-xs" popovertarget="popover-legal-model">
                                       <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                     </button>
                                   </div>
                                 </li>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="cpu" class="w-4 h-4 mr-1"></i>
                                       {t().technicalModel}
                                     </a>
                                     <button class="btn btn-ghost btn-xs" popovertarget="popover-technical-model">
                                       <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                     </button>
                                   </div>
                                 </li>
                               </ul>
                             </details>
                           </li>
                            <li class="px-2">
                               <details open>
                                 <summary class="flex items-center gap-2">
                                   <i data-lucide="file-text" class="w-4 h-4"></i>
                                   <span class="w-full" classList={{ 'lg:hidden': isCollapsed() }}>{t().reports}</span>
                                 </summary>
                               <ul>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="presentation" class="w-4 h-4 mr-1"></i>
                                       {t().pitchDeck}
                                     </a>
                                     <button class="btn btn-ghost btn-xs" popovertarget="popover-pitch-deck">
                                       <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                     </button>
                                   </div>
                                 </li>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="clipboard-list" class="w-4 h-4 mr-1"></i>
                                       {t().businessPlan}
                                     </a>
                                     <button class="btn btn-ghost btn-xs" popovertarget="popover-business-plan-report">
                                       <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                     </button>
                                   </div>
                                 </li>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="calculator" class="w-4 h-4 mr-1"></i>
                                       {t().valuation}
                                     </a>
                                     <button class="btn btn-ghost btn-xs" popovertarget="popover-valuation-report">
                                       <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                     </button>
                                   </div>
                                 </li>
                               </ul>
                             </details>
                           </li>
                         </ul>
                       </details>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-idea-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>{t().view || 'View'}</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>{t().edit || 'Edit'}</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>{t().export || 'Export'}</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-business-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>{t().view || 'View'}</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>{t().edit || 'Edit'}</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>{t().export || 'Export'}</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-financial-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>{t().view || 'View'}</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>{t().edit || 'Edit'}</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>{t().export || 'Export'}</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-funding-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>{t().view || 'View'}</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>{t().edit || 'Edit'}</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>{t().export || 'Export'}</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-marketing-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>{t().view || 'View'}</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>{t().edit || 'Edit'}</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>{t().export || 'Export'}</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-team-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>{t().view || 'View'}</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>{t().edit || 'Edit'}</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>{t().export || 'Export'}</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-legal-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>{t().view || 'View'}</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>{t().edit || 'Edit'}</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>{t().export || 'Export'}</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-technical-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>{t().view || 'View'}</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>{t().edit || 'Edit'}</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>{t().export || 'Export'}</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-pitch-deck">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>{t().view || 'View'}</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>{t().edit || 'Edit'}</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>{t().export || 'Export'}</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-business-plan-report">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>{t().view || 'View'}</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>{t().edit || 'Edit'}</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>{t().export || 'Export'}</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-valuation-report">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>{t().view || 'View'}</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>{t().edit || 'Edit'}</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>{t().export || 'Export'}</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id={`popover-project-${project.id}`} style={`position-anchor:--anchor-project-${project.id}`}>
                        <li><a onclick={() => { setEditingProjectId(project.id); setTimeout(() => { const span = document.querySelector(`[data-project-id="${project.id}"]`); if (span) { span.focus(); const range = document.createRange(); range.selectNodeContents(span); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); } }, 0); }}><i data-lucide="edit" class="w-4 h-4"></i>{t().rename}</a></li>
                        <li><a onclick={() => handleProjectAction('delete', project.id)}><i data-lucide="trash" class="w-4 h-4"></i>{t().delete}</a></li>
                          <li><a onclick={() => { logger.debug('Opening project:', project.id); window.dispatchEvent(new CustomEvent('openProject', { detail: project.id })); }}><i data-lucide="folder-open" class="w-4 h-4"></i>{t().open}</a></li>
                         <li><a onclick={async () => { try { const data = await exportProject(project.id); downloadJSON(data, `${project.name}-project.json`); toastManager.success(t().exportProject + ' ' + t().successful); } catch (error) { toastManager.error(t().exportProject + ' ' + t().failed); } }}><i data-lucide="download" class="w-4 h-4"></i>{t().exportProject}</a></li>
                         <li><a onclick={async () => { try { const data = await exportReports(project.id); downloadJSON(data, `${project.name}-report.json`); toastManager.success(t().exportReports + ' ' + t().successful); } catch (error) { toastManager.error(t().exportReports + ' ' + t().failed); } }}><i data-lucide="file-text" class="w-4 h-4"></i>{t().exportReports}</a></li>
                      </ul>
                    </li>
                  )}
                </For>
                 <Show when={filteredProjects().length === 0}>
                   <li class="flex flex-col items-center justify-center py-8 px-4">
                     <i data-lucide="folder-x" class="w-16 h-16 mb-4 text-base-content/40"></i>
                      <div class="text-lg font-semibold mb-2 text-center" classList={{ 'lg:hidden': isCollapsed() }}>
                        {searchQuery() ? t().noProjectsMatch : t().noProjectsYet}
                      </div>
                      <div class="text-sm text-base-content/60 mb-4 text-center" classList={{ 'lg:hidden': isCollapsed() }}>
                        {searchQuery() ? t().tryAdjustingSearch : t().createFirstProject}
                      </div>
                      <button class="btn btn-primary btn-sm" onClick={() => window.dispatchEvent(new CustomEvent('resetAgent'))} classList={{ 'lg:hidden': isCollapsed() }}>Create Task</button>
                   </li>
                 </Show>
              </ul>
            </details>
          </li>
        </section>
      </div>
    </aside>
  );
};

export default Sidebar;