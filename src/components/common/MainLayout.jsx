import { onMount, useContext, Show, createSignal, onCleanup, For, createMemo, createEffect } from "solid-js";
import { LangContext } from "../../context/LangContext";
import { useUser } from "../../context/UserContext";
import { confirmDelete } from "../../components/ui/GlobalConfirm";
import Navbar from "./Navbar";
import { GlobalLoading, GlobalError, ToastContainer } from "./GlobalUI";
import OfflineIndicator from "./OfflineIndicator";
import { A } from "@solidjs/router";
import { getProjects, updateProject, deleteProject, deleteAllProjects, exportAllData, exportProject, exportReports } from "../../lib/db";
import { toastManager } from "../../lib/feedback";
import logger from "../../lib/logger.js";

const MainLayout = (props) => {
  const context = useContext(LangContext) || { lang: () => 'ar', setLang: () => {} };
  const { lang, setLang } = context;
  const { isAuthenticated, user } = useUser();
  const [isDrawerOpen, setIsDrawerOpen] = createSignal(true);
  const [projects, setProjects] = createSignal([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [editingProjectId, setEditingProjectId] = createSignal(null);

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

  const loadProjects = async () => {
    try {
      const currentUser = user();
      if (!currentUser || typeof currentUser !== 'object' || !currentUser.id) return;
      const projs = await getProjects(currentUser.id) || [];
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
          toastManager.success('Rename successful');
          await loadProjects();
        }
        break;
      case 'delete':
        const confirmed = await confirmDelete(project.name);
        if (confirmed) {
          await deleteProject(projectId);
          window.dispatchEvent(new CustomEvent('projectDeleted', { detail: { projectId } }));
          toastManager.success('Delete successful');
          await loadProjects();
        }
        break;
      case 'open':
        window.dispatchEvent(new CustomEvent('openProject', { detail: projectId }));
        break;
    }
  };

  const handleDeleteAllProjects = async () => {
    const confirmed = await confirmDelete('All Tasks', "All tasks will be permanently deleted.");
    if (confirmed) {
      await deleteAllProjects();
      toastManager.success('Delete all successful');
      await loadProjects();
    }
  };

  const handleExportAllProjects = async () => {
    const currentUser = user();
    if (!currentUser) return;
    try {
      const data = await exportAllData(currentUser.id);
      downloadJSON(data, `accelerator-export-${new Date().toISOString().split('T')[0]}.json`);
      toastManager.success('Export successful');
    } catch (error) {
      toastManager.error('Export failed');
    }
  };

  const filteredProjects = createMemo(() => {
    const projs = projects();
    if (!Array.isArray(projs)) return [];
    const query = searchQuery().toLowerCase().trim();
    if (!query) return projs;
    return projs.filter(project =>
      project && typeof project === 'object' && project.name && typeof project.name === 'string' && project.name.toLowerCase().includes(query)
    );
  });

  const onProjectAdded = async () => await loadProjects();
  const onProjectUpdated = async () => await loadProjects();

  onMount(async () => {
    if (window.lucide) {
      window.lucide.createIcons();
    }

    const link = document.querySelector('link[rel="icon"]');
    if (link) {
      link.href = '/favicon.svg';
    }

    const savedLang = localStorage.getItem('lang') || 'en';
    if (savedLang !== lang()) {
      setLang(savedLang);
    }
    document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');

    await loadProjects();
    window.addEventListener('projectAdded', onProjectAdded);
    window.addEventListener('projectUpdated', onProjectUpdated);
  });

  onCleanup(() => {
    window.removeEventListener('projectAdded', onProjectAdded);
    window.removeEventListener('projectUpdated', onProjectUpdated);
  });

  createEffect(() => {
    const currentUser = user();
    if (currentUser && currentUser.id) {
      loadProjects();
    }
  });

  createEffect(() => {
    isDrawerOpen();
    projects();
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 50);
  });

  const currentLang = () => lang();
  const t = (key) => {
    const translations = {
      newProject: "New Task",
      dashboard: "Dashboard",
      portfolio: "Portfolio",
      exploreIdeas: "Explore Ideas",
      help: "Help",
      allProjects: "All Tasks",
      sidebarSearch: "Search tasks...",
    };
    return translations[key] || key;
  };

  return (
    <>
      <GlobalLoading />
      <GlobalError />
      <ToastContainer />
      <OfflineIndicator />
      <div class="drawer h-full min-h-0">
        <Show when={isAuthenticated()}>
          <input 
            id="my-drawer-4" 
            type="checkbox" 
            class="drawer-toggle" 
            checked={isDrawerOpen()}
            onChange={(e) => setIsDrawerOpen(e.target.checked)}
          />
          <div class="drawer-side z-[55]">
            <label 
              for="my-drawer-4" 
              aria-label="close sidebar" 
              class="drawer-overlay"
            ></label>
            
            <div 
              class="flex min-h-full flex-col bg-base-100 border-base-200 transition-all duration-300 ease-in-out h-full"
              classList={{
                'w-16': !isDrawerOpen(),
                'w-72': isDrawerOpen(),
                'border-e': currentLang() === 'en',
                'border-s': currentLang() === 'ar',
                'is-drawer-close:overflow-visible': true
              }}
            >
              <div class="p-2 border-b border-base-200">
                <button 
                  onClick={(e) => { e.preventDefault(); setIsDrawerOpen(!isDrawerOpen()); }} 
                  class="cursor-pointer flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg transition-colors w-full"
                  title={isDrawerOpen() ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  <img src="/src/assets/iGate-tech-logo.svg" alt="Logo" class="h-8 flex-shrink-0" />
                  <Show when={isDrawerOpen()}>
                    <span class="font-bold text-lg whitespace-nowrap">iGate</span>
                  </Show>
                </button>
              </div>

              <div class="px-2 w-full flex-1 overflow-y-auto">
              <ul class="menu w-full mb-2">
                <li>
                  <A href="/" onClick={() => window.dispatchEvent(new CustomEvent('resetAgent'))} class="flex items-center gap-3 py-3 px-3 hover:bg-base-200 rounded-lg transition-colors" aria-label={t('newProject')}>
                    <i data-lucide="plus" class="w-5 h-5 text-primary flex-shrink-0"></i>
                    <Show when={isDrawerOpen()}>
                      <span class="font-medium whitespace-nowrap">{t('newProject')}</span>
                    </Show>
                  </A>
                </li>
                <li>
                  <A href="/dashboard" class="flex items-center gap-3 py-3 px-3 hover:bg-base-200 rounded-lg transition-colors" aria-label={t('dashboard')}>
                    <i data-lucide="bar-chart" class="w-5 h-5 text-warning flex-shrink-0"></i>
                    <Show when={isDrawerOpen()}>
                      <span class="font-medium whitespace-nowrap">{t('dashboard')}</span>
                    </Show>
                  </A>
                </li>
                <li>
                  <A href="/portfolio" class="flex items-center gap-3 py-3 px-3 hover:bg-base-200 rounded-lg transition-colors" aria-label={t('portfolio')}>
                    <i data-lucide="briefcase" class="w-5 h-5 text-accent flex-shrink-0"></i>
                    <Show when={isDrawerOpen()}>
                      <span class="font-medium whitespace-nowrap">{t('portfolio')}</span>
                    </Show>
                  </A>
                </li>
                <li>
                  <A href="/invitations" class="flex items-center gap-3 py-3 px-3 hover:bg-base-200 rounded-lg transition-colors" aria-label="Collaborate">
                    <i data-lucide="users" class="w-5 h-5 text-info flex-shrink-0"></i>
                    <Show when={isDrawerOpen()}>
                      <span class="font-medium whitespace-nowrap">Collaborate</span>
                    </Show>
                  </A>
                </li>
                <li>
                  <A href="/explore" class="flex items-center gap-3 py-3 px-3 hover:bg-base-200 rounded-lg transition-colors" aria-label={t('exploreIdeas')}>
                    <i data-lucide="compass" class="w-5 h-5 text-secondary flex-shrink-0"></i>
                    <Show when={isDrawerOpen()}>
                      <span class="font-medium whitespace-nowrap">{t('exploreIdeas')}</span>
                    </Show>
                  </A>
                </li>
                <li>
                  <A href="/help" class="flex items-center gap-3 py-3 px-3 hover:bg-base-200 rounded-lg transition-colors" aria-label={t('help')}>
                    <i data-lucide="help-circle" class="w-5 h-5 text-info flex-shrink-0"></i>
                    <Show when={isDrawerOpen()}>
                      <span class="font-medium whitespace-nowrap">{t('help')}</span>
                    </Show>
                  </A>
                </li>
              </ul>
              
              <Show when={isDrawerOpen()}>
                <section class="menu border border-base-200 rounded-box w-full">
                  <li>
                    <details open>
                      <summary class="flex items-center justify-between px-4 py-3 hover:bg-base-300 transition-colors cursor-pointer">
                        <div class="flex items-center gap-3">
                          <i data-lucide="folder" class="w-4 h-4 text-accent"></i>
                          <span class="font-medium">{t('allProjects')}</span>
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
                            {t('newProject')}
                          </A>
                        </li>
                        <li>
                          <a onclick={handleExportAllProjects} class="flex items-center gap-2">
                            <i data-lucide="download" class="w-4 h-4"></i>
                            Export All
                          </a>
                        </li>
                        <li>
                          <a onclick={async () => { try { const data = await exportAllData(user()?.id); downloadJSON(data, 'all_data_backup.json'); toastManager.success('Backup successful'); } catch (error) { toastManager.error('Backup failed'); } }} class="flex items-center gap-2">
                            <i data-lucide="archive" class="w-4 h-4"></i>
                            Backup All
                          </a>
                        </li>
                        <div class="divider my-1"></div>
                        <li>
                          <a onclick={handleDeleteAllProjects} class="flex items-center gap-2 text-error">
                            <i data-lucide="trash" class="w-4 h-4"></i>
                            Delete All
                          </a>
                        </li>
                      </div>

                      <div class="px-4 pb-3">
                        <div class="relative">
                          <input
                            type="text"
                            placeholder={t('sidebarSearch')}
                            class="input input-bordered input-sm w-full pr-8"
                            value={searchQuery()}
                            onInput={(e) => setSearchQuery(e.target.value)}
                          />
                          <i data-lucide="search" class="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" classList={{ 'right-2': currentLang() === 'en', 'left-2': currentLang() === 'ar' }}></i>
                        </div>
                      </div>
                      <div>
                        <For each={filteredProjects()}>
                          {(project) => (
                            <li>
                              <div class="flex justify-between items-center px-4 py-2 hover:bg-base-300 rounded-lg transition-colors cursor-pointer">
                                <span onclick={() => { logger.debug('Opening project:', project.id); window.dispatchEvent(new CustomEvent('openProject', { detail: project.id })); }} class="flex items-center w-full gap-2">
                                  <i data-lucide="folder" class="w-4 h-4 text-base-content/60 flex-shrink-0"></i>
                                  <span
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
                              </div>
                              <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id={`popover-project-${project.id}`} style={`position-anchor:--anchor-project-${project.id}`}>
                                <li><a onclick={() => { setEditingProjectId(project.id); setTimeout(() => { const span = document.querySelector(`[data-project-id="${project.id}"]`); if (span) { span.focus(); const range = document.createRange(); range.selectNodeContents(span); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); } }, 0); }}><i data-lucide="edit" class="w-4 h-4"></i>Rename</a></li>
                                <li><a onclick={() => handleProjectAction('delete', project.id)}><i data-lucide="trash" class="w-4 h-4"></i>Delete</a></li>
                                <li><a onclick={async () => { try { const data = await exportProject(project.id); downloadJSON(data, `${project.name}-project.json`); toastManager.success('Export successful'); } catch (error) { toastManager.error('Export failed'); } }}><i data-lucide="download" class="w-4 h-4"></i>Export</a></li>
                                <li><a onclick={async () => { try { const data = await exportReports(project.id); downloadJSON(data, `${project.name}-report.json`); toastManager.success('Export successful'); } catch (error) { toastManager.error('Export failed'); } }}><i data-lucide="file-text" class="w-4 h-4"></i>Export Report</a></li>
                              </ul>
                            </li>
                          )}
                        </For>
                        <Show when={filteredProjects().length === 0}>
                          <li class="flex flex-col items-center justify-center py-8 px-4">
                            <i data-lucide="folder-x" class="w-12 h-12 mb-4 text-base-content/40"></i>
                            <div class="text-lg font-semibold mb-2 text-center">
                              {searchQuery() ? 'No matching tasks' : 'No tasks yet'}
                            </div>
                            <div class="text-sm text-base-content/60 mb-4 text-center">
                              {searchQuery() ? 'Try adjusting search' : 'Create your first task'}
                            </div>
                            <button class="btn btn-primary btn-sm" onClick={() => window.dispatchEvent(new CustomEvent('resetAgent'))}>Create Task</button>
                          </li>
                        </Show>
                      </div>
                    </details>
                  </li>
                </section>
              </Show>
              </div>
            </div>
          </div>
        </Show>
        <div class="drawer-content flex flex-col h-full min-h-0">
            <Navbar />
            <main id="main-content" class="flex-1 w-full min-h-0 overflow-auto">
            {props.children}
          </main>
        </div>
      </div>
    </>
  );
};

export default MainLayout;
