import { A, useLocation, useNavigate } from "@solidjs/router";
import { useContext, onMount, createSignal, createEffect, For, Show, createMemo } from "solid-js";
import { LangContext } from "../context/LangContext";
import { useUser } from "../context/UserContext";
import { translations } from "../assets/translations/translations-index.js";
import { getProjects, updateProject, deleteProject, deleteAllProjects, exportAllProjects } from "../lib/db";

const Sidebar = () => {
  const { lang } = useContext(LangContext);
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = createSignal([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [editingProjectId, setEditingProjectId] = createSignal(null);

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
      const projs = await getProjects() || [];
      setProjects(projs);
    } catch (error) {
      console.error('Failed to load projects:', error);
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
          await loadProjects();
        }
        break;

      case 'delete':
        if (confirm(t().delete + ' "' + project.name + '"? ' + t().confirm.toLowerCase())) {
          await deleteProject(projectId);
          await loadProjects();
        }
        break;

      case 'open':
        window.dispatchEvent(new CustomEvent('openProject', { detail: projectId }));
        break;

      default:
        console.log('Unknown action:', action);
    }
  };

  const handleDeleteAllProjects = async () => {
    const message = t().deleteAllProjects + '? ' + t().confirm.toLowerCase();
    if (confirm(message)) {
      await deleteAllProjects();
      await loadProjects();
    }
  };

  const handleExportAllProjects = async () => {
    const data = await exportAllProjects();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = t().allProjectsFilename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert(t().exportAllProjects + ' ' + t().failed);
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
    console.log('Sidebar language changed to:', newLang);
  });

  createEffect(() => {
    projects();
    searchQuery();
    currentLang(); // React to language changes
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <aside
      class="sidebar fixed top-16 w-80 h-[calc(100vh-4rem)] bg-base-100 border-base-200 overflow-y-auto hidden lg:block z-[55]"
      classList={{
        'start-0 border-e': currentLang() === 'en',
        'end-0 border-s': currentLang() === 'ar'
      }}
    >
      <div class="p-4">
        <ul class="menu bg-base-200 rounded-box w-full mb-5">
          <li classList={{ "menu-active": location.pathname === "/" }}>
            <A href="/" onClick={() => window.dispatchEvent(new CustomEvent('resetAgent'))} class="flex items-center gap-3 px-4 py-3 hover:bg-base-300 transition-colors">
              <div class="p-1 bg-primary/10 rounded">
                <i data-lucide="plus" class="w-4 h-4 text-primary"></i>
              </div>
              <span class="font-medium">{t().newProject}</span>
            </A>
          </li>
          <li classList={{ "menu-active": location.pathname === "/explore" }}>
            <A href="/explore" class="flex items-center gap-3 px-4 py-3 hover:bg-base-300 transition-colors">
              <div class="p-1 bg-secondary/10 rounded">
                <i data-lucide="compass" class="w-4 h-4 text-secondary"></i>
              </div>
              <span class="font-medium">{t().exploreIdeas}</span>
            </A>
          </li>
          <li classList={{ "menu-active": location.pathname === "/help" }}>
            <A href="/help" class="flex items-center gap-3 px-4 py-3 hover:bg-base-300 transition-colors">
              <div class="p-1 bg-info/10 rounded">
                <i data-lucide="help-circle" class="w-4 h-4 text-info"></i>
              </div>
              <span class="font-medium">{t().help}</span>
            </A>
          </li>
        </ul>
        <section class="menu bg-base-200 rounded-box w-full">
          <li>
            <details open>
              <summary class="flex items-center justify-between px-4 py-3 hover:bg-base-300 transition-colors cursor-pointer">
                <div class="flex items-center gap-3">
                  <div class="p-1 bg-accent/10 rounded">
                    <i data-lucide="folder" class="w-4 h-4 text-accent"></i>
                  </div>
                  <span class="font-medium">{t().allProjects}</span>
                  <span class="badge badge-sm badge-accent">{filteredProjects().length}</span>
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
                  <a onclick={() => alert(t().backupAllData + ' - ' + 'Coming soon!')} class="flex items-center gap-2">
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

              <div class="px-4 pb-3">
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
                         <summary class="flex justify-between items-center px-4 py-2 hover:bg-base-300 rounded-lg transition-colors cursor-pointer">
                            <span class="flex items-center w-full">
                              <div class="p-1 bg-base-300 rounded mr-2">
                                <i data-lucide="folder" class="w-3 h-3 text-base-content/60"></i>
                              </div>
                              <span
                                class="ml-2"
                                data-project-id={project.id}
                                contentEditable={editingProjectId() === project.id}
                                onBlur={(e) => {
                                  if (editingProjectId() === project.id) {
                                    const newName = e.target.textContent.trim();
                                    if (newName && newName !== project.name) {
                                      handleProjectAction('rename', project.id);
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
                                  {t().models}
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
                                  {t().reports}
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
                        <li><a onclick={() => window.dispatchEvent(new CustomEvent('openProject', { detail: project.id }))}><i data-lucide="folder-open" class="w-4 h-4"></i>{t().open}</a></li>
                        <li><a onclick={() => alert(t().exportProject + ': ' + project.name)}><i data-lucide="download" class="w-4 h-4"></i>{t().exportProject}</a></li>
                        <li><a onclick={() => alert(t().exportReports + ': ' + project.name)}><i data-lucide="file-text" class="w-4 h-4"></i>{t().exportReports}</a></li>
                      </ul>
                    </li>
                  )}
                </For>
                <Show when={filteredProjects().length === 0}>
                  <li class="text-center py-8 px-4">
                    <i data-lucide="folder-x" class="w-12 h-12 mx-auto mb-3 text-base-content/40"></i>
                    <div class="text-sm font-medium text-base-content/60 mb-1">
                      {searchQuery() ? t().noProjectsMatch : t().noProjectsYet}
                    </div>
                    <div class="text-xs text-base-content/50">
                      {searchQuery() ? t().tryAdjustingSearch : t().createFirstProject}
                    </div>
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