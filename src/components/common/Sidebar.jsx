import { A, useLocation, useNavigate } from "@solidjs/router";
import { useContext, onMount, onCleanup, createSignal, createEffect, For, Show, createMemo } from "solid-js";
import { LangContext } from "../../context/LangContext";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { confirmDelete } from "../../components/ui/GlobalConfirm";
import { translations } from "../../assets/translations/translations-index.js";
import { getProjects, updateProject, deleteProject, deleteAllProjects, exportAllProjects, exportAllData, exportProject, exportReports, getUserNotifications, getCreditBalance, getUserSubscription } from "../../lib/db";
import { toastManager } from "../../lib/feedback";
import logger from "../../lib/logger.js";
const Sidebar = () => {
  logger.trace('Sidebar: Starting');
  const { lang } = useContext(LangContext);
  const { user, isAuthenticated, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLang, t, setLang } = useLanguage();
  const [projects, setProjects] = createSignal([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [editingProjectId, setEditingProjectId] = createSignal(null);
  const [isCollapsed, setIsCollapsed] = createSignal(false);
  const [notifications, setNotifications] = createSignal([]);
  const [creditBalance, setCreditBalance] = createSignal(50);
  const [subscription, setSubscription] = createSignal({ plan: 'free' });
   const [projectsCount, setProjectsCount] = createSignal(0);
   const [projectsOpen, setProjectsOpen] = createSignal(true);
  const navbarT = t;
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
  const loadNotifications = async () => {
    const userId = user()?.id;
    if (!userId) return;
    try {
      const [notifs, balance, sub, projectsData] = await Promise.all([
        getUserNotifications(userId),
        getCreditBalance(userId),
        getUserSubscription(userId),
        getProjects(userId)
      ]);
      setNotifications(notifs.slice(0, 5).map(n => ({
        ...n,
        type: n.type === 'system' ? 'systemUpdate' : n.type === 'billing' ? 'billing' : n.type === 'credits' ? 'credits' : n.type === 'getting-started' ? 'gettingStarted' : n.type === 'subscription' ? 'subscription' : n.type === 'ai' ? 'aiFeature' : n.type === 'explore' ? 'explore' : n.type === 'help' ? 'help' : n.type === 'project' ? 'project' : 'newMessage',
        time: new Date(n.created_at)
      })));
      setCreditBalance(balance !== null ? balance : (user()?.credits?.balance || 50));
      setSubscription(sub ? { plan: sub.package_name || 'free' } : (user()?.subscription || { plan: 'free' }));
      setProjectsCount(Array.isArray(projectsData) ? projectsData.length : 0);
    } catch (error) {
      logger.warn('Failed to load sidebar data:', error.message);
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
        const confirmed = await confirmDelete(project.name);
        if (confirmed) {
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
    const confirmed = await confirmDelete(t().allProjects, "All projects will be permanently deleted.");
    if (confirmed) {
      await deleteAllProjects();
      toastManager.success(t().deleteAllProjects + ' ' + t().successful);
      await loadProjects();
    }
  };
  const handleExportAllProjects = async () => {
    const currentUser = user();
    if (!currentUser) return;
    try {
      const data = await exportAllData(currentUser.id);
      downloadJSON(data, `accelerator-export-${new Date().toISOString().split('T')[0]}.json`);
      toastManager.success(t().exportAllProjects + ' ' + t().successful);
    } catch (error) {
      logger.error('Failed to export projects:', error);
      toastManager.error(t().exportAllProjects + ' ' + t().failed);
    }
  };
  const onProjectAdded = async () => {
    await loadProjects();
  };
  const onProjectUpdated = async () => {
    await loadProjects();
  };
  onMount(async () => {
    await loadProjects();
    await loadNotifications();
    window.addEventListener('projectAdded', onProjectAdded);
    window.addEventListener('projectUpdated', onProjectUpdated);
    if (window.lucide) {
      window.lucide.createIcons();
    }
    // User dropdown is always anchored above (footer menu pattern)
  });
  onCleanup(() => {
    window.removeEventListener('projectAdded', onProjectAdded);
    window.removeEventListener('projectUpdated', onProjectUpdated);
  });
  createEffect(() => {
    const newLang = lang();
    setLang(newLang);
  });
  createEffect(() => {
    const currentUser = user();
    if (currentUser && currentUser.id) {
      loadProjects();
    }
  });
  createEffect(() => {
    if (!isCollapsed() && window.lucide) {
      window.lucide.createIcons();
    }
  });
  return (
    <aside
      class={`sidebar h-screen bg-base-100 border-e border-base-300 flex flex-col z-[55] transition-all duration-300 ease-in-out overflow-hidden ${currentLang() === 'ar' ? 'rtl' : ''}`}
      style={{ width: isCollapsed() ? '80px' : '256px' }}
      dir={currentLang() === "ar" ? "rtl" : "ltr"}
    >
      <div class="flex flex-col h-full min-h-0 transition-all duration-300">
        <div class="flex-shrink-0 relative p-3 flex justify-center rtl:justify-center">
          <A href="/" onClick={(e) => { e.preventDefault(); setIsCollapsed(!isCollapsed()); }} class="cursor-pointer flex w-full justify-center rtl:justify-center">
            <img src={isCollapsed() ? "/src/assets/favicon.svg" : "/src/assets/iGate-tech-logo.svg"} alt="Logo" classList={{
              'h-8': true,
              'w-10': isCollapsed(),
              'me-auto ms-4': !isCollapsed()
            }} />
          </A>
        </div>
        
        <div class="flex-1 overflow-y-auto px-1 min-h-0 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
          <ul class="menu w-full gap-1">
              <li classList={{ "menu-active": location.pathname === "/" }}>
                <A href="/" onClick={() => window.dispatchEvent(new CustomEvent('resetAgent'))} class="flex items-center justify-center ltr:justify-center rtl:justify-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group" aria-label={`Create new project - ${t().newProject}`}>
                  <i data-lucide="plus" classList={{ "w-5 h-5": !isCollapsed(), "w-6 h-6": isCollapsed() }} class="text-primary" aria-hidden="true"></i>
                  <Show when={!isCollapsed()}>
                    <span class="font-medium ltr:ml-3 rtl:mr-3">{t().newProject}</span>
                  </Show>
                </A>
              </li>
             <li classList={{ "menu-active": location.pathname === "/apps" }}>
               <A href="/apps" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group" aria-label="Apps">
                 <i data-lucide="grid" classList={{ "w-5 h-5": !isCollapsed(), "w-6 h-6": isCollapsed() }} class="text-secondary" aria-hidden="true"></i>
                 <Show when={!isCollapsed()}>
                   <span class="font-medium ltr:ml-3 rtl:mr-3">{t().apps}</span>
                 </Show>
               </A>
             </li>
             <li classList={{ "menu-active": location.pathname === "/dashboard" }}>
               <A href="/dashboard" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group" aria-label={`Dashboard - ${t().dashboard}`}>
                 <i data-lucide="bar-chart" classList={{ "w-5 h-5": !isCollapsed(), "w-6 h-6": isCollapsed() }} class="text-warning" aria-hidden="true"></i>
                 <Show when={!isCollapsed()}>
                   <span class="font-medium ltr:ml-3 rtl:mr-3">{t().dashboard}</span>
                 </Show>
               </A>
             </li>
             <li classList={{ "menu-active": location.pathname === "/portfolio" }}>
               <A href="/portfolio" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group" aria-label={`Portfolio - ${t().portfolio}`}>
                 <i data-lucide="briefcase" classList={{ "w-5 h-5": !isCollapsed(), "w-6 h-6": isCollapsed() }} class="text-accent" aria-hidden="true"></i>
                 <Show when={!isCollapsed()}>
                   <span class="font-medium ltr:ml-3 rtl:mr-3">{t().portfolio}</span>
                 </Show>
               </A>
             </li>
             <li classList={{ "menu-active": location.pathname === "/invitations" }}>
               <A href="/invitations" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group" aria-label={`Collaborate - Invitations`}>
                 <i data-lucide="users" classList={{ "w-5 h-5": !isCollapsed(), "w-6 h-6": isCollapsed() }} class="text-info" aria-hidden="true"></i>
                 <Show when={!isCollapsed()}>
                   <span class="font-medium ltr:ml-3 rtl:mr-3">{t().collaborate}</span>
                 </Show>
               </A>
             </li>
             <li classList={{ "menu-active": location.pathname === "/explore" }}>
               <A href="/explore" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group" aria-label={`Explore project ideas - ${t().exploreIdeas}`}>
                 <i data-lucide="compass" classList={{ "w-5 h-5": !isCollapsed(), "w-6 h-6": isCollapsed() }} class="text-secondary" aria-hidden="true"></i>
                 <Show when={!isCollapsed()}>
                   <span class="font-medium ltr:ml-3 rtl:mr-3">{t().exploreIdeas}</span>
                 </Show>
               </A>
             </li>
             <li classList={{ "menu-active": location.pathname === "/help" }}>
               <A href="/help" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group" aria-label={`Get help and support - ${t().help}`}>
                 <i data-lucide="help-circle" classList={{ "w-5 h-5": !isCollapsed(), "w-6 h-6": isCollapsed() }} class="text-info" aria-hidden="true"></i>
                 <Show when={!isCollapsed()}>
                   <span class="font-medium ltr:ml-3 rtl:mr-3">{t().help}</span>
                 </Show>
               </A>
             </li>
         
          </ul>
        <ul class="menu w-full gap-1">
             <Show when={!isCollapsed()}>
              <li>
                <details open={projectsOpen()} onToggle={(e) => setProjectsOpen(e.target.open)}>
                  <summary class="flex items-center ltr:justify-between rtl:justify-between px-4 py-2.5 hover:bg-base-300 transition-colors rounded-lg cursor-pointer">
                    <div class="flex items-center gap-3 w-full">
                      <div class="p-1 rounded">
                         <i data-lucide="folder" classList={{ "w-4 h-4": !isCollapsed(), "w-5 h-5": isCollapsed() }} class="text-accent"></i>
                      </div>
                      <span class="font-medium">{t().allProjects}</span>
                      <span class="badge badge-sm badge-accent ltr:ml-auto rtl:mr-auto flex-shrink-0">{filteredProjects().length}</span>
                    </div>
                    <button
                      class="btn btn-ghost btn-xs opacity-60 hover:opacity-100 btn-circle"
                      popovertarget="popover-all-projects"
                      style="anchor-name:--anchor-all-projects"
                    >
                      <i data-lucide="more-vertical" class="w-3 h-3"></i>
                    </button>
                  </summary>
                  <div
                    class="dropdown menu w-full min-w-56 rounded-box bg-base-100 shadow-lg border border-base-200 mt-1"
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
                      <a onclick={async () => { try { const data = await exportAllData(user()?.id); downloadJSON(data, 'all_data_backup.json'); toastManager.success(t().backupAllData + ' ' + t().successful); } catch (error) { toastManager.error(t().backupAllData + ' ' + t().failed); } }} class="flex items-center gap-2">
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
                  <div class="px-3 py-2">
                    <div class="relative">
                      <input
                        type="text"
                        placeholder={t().sidebarSearch}
                        class="input input-bordered input-sm w-full pe-8"
                        value={searchQuery()}
                        onInput={(e) => setSearchQuery(e.target.value)}
                      />
                      <i data-lucide="search" class="absolute top-1/2 -translate-y-1/2 end-2 w-4 h-4 text-base-content/40"></i>
                    </div>
                  </div>
                  <ul class="mt-1 space-y-1">
                    <For each={filteredProjects()}>
                      {(project) => (
                        <li>
                          <div class="flex justify-between ltr:justify-between rtl:justify-between items-center px-4 py-2 hover:bg-base-300 rounded-lg transition-colors cursor-pointer group">
                            <span onclick={() => { logger.debug('Opening project:', project.id); window.dispatchEvent(new CustomEvent('openProject', { detail: project.id })); }} class="flex items-center w-full gap-2">
                              <div class="rounded flex-shrink-0">
                                <i data-lucide="folder" classList={{ "w-4 h-4": !isCollapsed(), "w-5 h-5": isCollapsed() }} class="text-base-content/60"></i>
                              </div>
                              <span
                                class="ltr:ms-2 rtl:me-2 truncate flex-1 min-w-0"
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
                            <button class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 btn-circle" popovertarget={`popover-project-${project.id}`} style={`anchor-name: --anchor-project-${project.id}`}>
                              <i data-lucide="more-vertical" class="w-3 h-3"></i>
                            </button>
                          </div>
                          <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id={`popover-project-${project.id}`} style={`position-anchor: --anchor-project-${project.id}`}>
                            <li><a onclick={() => { setEditingProjectId(project.id); setTimeout(() => { const span = document.querySelector(`[data-project-id="${project.id}"]`); if (span) { span.focus(); const range = document.createRange(); range.selectNodeContents(span); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); } }, 0); }}><i data-lucide="edit" class="w-4 h-4"></i>{t().rename}</a></li>
                            <li><a onclick={() => handleProjectAction('delete', project.id)}><i data-lucide="trash" class="w-4 h-4"></i>{t().delete}</a></li>
                            <li><a onclick={async () => { try { const data = await exportProject(project.id); downloadJSON(data, `${project.name}-project.json`); toastManager.success(t().exportProject + ' ' + t().successful); } catch (error) { toastManager.error(t().backupAllData + ' ' + t().failed); } }}><i data-lucide="download" class="w-4 h-4"></i>{t().exportProject}</a></li>
                            <li><a onclick={async () => { try { const data = await exportReports(project.id); downloadJSON(data, `${project.name}-report.json`); toastManager.success(t().exportReports + ' ' + t().successful); } catch (error) { toastManager.error(t().exportReports + ' ' + t().failed); } }}><i data-lucide="file-text" class="w-4 h-4"></i>{t().exportReports}</a></li>
                          </ul>
                        </li>
                      )}
                    </For>
                    <Show when={filteredProjects().length === 0}>
                      <li class="flex flex-col items-center justify-center py-4 px-2">
                        <i data-lucide="folder-x" classList={{ "w-8 h-8": !isCollapsed(), "w-10 h-10": isCollapsed() }} class="mb-2 text-base-content/40"></i>
                        <div class="text-sm font-semibold mb-1 text-center">
                          {searchQuery() ? t().noProjectsMatch : t().noProjectsYet}
                        </div>
                        <div class="text-xs text-base-content/60 mb-2 text-center">
                          {searchQuery() ? t().tryAdjustingSearch : t().createFirstProject}
                        </div>
                        <button class="btn btn-primary btn-sm" onClick={() => window.dispatchEvent(new CustomEvent('resetAgent'))}>{t().createTask}</button>
                      </li>
                    </Show>
                  </ul>
                </details>
              </li>
            </Show>
        </ul>
        </div>
        
          <div class="flex-shrink-0 border-t border-base-200">
            <ul class="menu w-full gap-1">
        <Show when={isAuthenticated() && !isCollapsed()}>
              <li>
    <details class="w-full">
   <summary
     classList={{
       'flex items-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group w-full cursor-pointer list-none': true,
       'justify-center': isCollapsed(),
     }}
   >
    {/* Avatar */}
    <div class="avatar relative flex-shrink-0">
      <div class="w-8 rounded-full ring ring-primary/30 ring-offset-1 ring-offset-base-100">
        {user()?.avatar ? (
          <img
            src={user()?.avatar}
            alt="User avatar"
            class="w-full h-full object-cover"
          />
        ) : (
          <div class="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
            <i
              data-lucide="user"
              classList={{
                'w-5 h-5': !isCollapsed(),
                'w-6 h-6': isCollapsed(),
              }}
              class="text-primary"
            ></i>
          </div>
        )}
      </div>

      {/* Online indicator */}
      <div class="absolute bottom-0 end-0 w-2 h-2 bg-success border border-base-100 rounded-full"></div>
    </div>

     {/* Name + Chevron */}
     <Show when={!isCollapsed()}>
       <span class="font-medium ms-3 flex-1 min-w-0 truncate">
         {user()?.profile?.name ?? 'User'}
       </span>
     </Show>


   </summary>

   {/* Dropdown */}
   <ul
     class="dropdown-content menu w-52 rounded-box bg-base-100 shadow-sm"
   >
     <li class="menu-title px-3 py-2 border-b border-base-200">
       <span>{user()?.profile?.name ?? 'User'}</span>
     </li>
     <li>
       <A href="/profile" class="flex items-center gap-2">
         <i data-lucide="user" class="w-4 h-4"></i>
         {navbarT().profile || 'Profile'}
       </A>
     </li>
     <li>
       <A href="/settings" class="flex items-center gap-2">
         <i data-lucide="settings" class="w-4 h-4"></i>
         {navbarT().settings || 'Settings'}
       </A>
     </li>
     <li>
       <A href="/packages" class="flex items-center gap-2">
         <i data-lucide="crown" class="w-4 h-4 text-accent"></i>
         {navbarT().packages || 'Packages'}
       </A>
     </li>
      <li>
        <A href="/billing" class="flex items-center gap-2">
          <i data-lucide="credit-card" class="w-4 h-4"></i>
          {navbarT().billingLabel || 'Billing'}
        </A>
      </li>
      <li>
        <A href="/credits" class="flex items-center gap-2">
          <i data-lucide="coins" class="w-4 h-4 text-yellow-500"></i>
          {navbarT().creditsLabel || 'Credits'}
        </A>
      </li>

      <div class="divider my-1"></div>

     <li>
       <button
         onClick={async () => {
           await logout();
           navigate('/auth/login');
         }}
         class="text-error hover:bg-error/10"
       >
         <i data-lucide="log-out" class="w-4 h-4"></i>
         {navbarT().signOut || 'Sign Out'}
       </button>
      </li>
    </ul>
  </details>


              </li>
        </Show>

              <li classList={{ "menu-active": location.pathname === "/notifications" }}>
                <A href="/notifications" classList={{
                  'flex items-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group w-full normal-case': true,
                  'justify-center': isCollapsed(),
                  'justify-start ltr:justify-start rtl:justify-end': !isCollapsed()
                }}>
                   <i data-lucide="bell" classList={{ "w-5 h-5": !isCollapsed(), "w-6 h-6": isCollapsed() }}></i>
                  <Show when={!isCollapsed()}>
                    <span class="font-medium ltr:ml-3 rtl:mr-3 flex-1 text-left">{navbarT().notifications || 'Notifications'}</span>
                    <Show when={(notifications() || []).some(n => !n.read)}>
                      <span class="badge badge-error badge-sm ltr:ml-auto rtl:mr-auto">{(notifications() || []).filter(n => !n.read).length}</span>
                    </Show>
                  </Show>
                </A>
              </li>
              <li>
                <button
                  classList={{
                    'flex items-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group w-full normal-case': true,
                    'justify-center': isCollapsed(),
                    'justify-start ltr:justify-start rtl:justify-end': !isCollapsed()
                  }}
                  onClick={() => {
                    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                    document.documentElement.setAttribute('data-theme', next);
                    localStorage.setItem('theme', next);
                  }}
                >
                   <i data-lucide="sun-moon" classList={{ "w-5 h-5": !isCollapsed(), "w-6 h-6": isCollapsed() }}></i>
                  <Show when={!isCollapsed()}>
                    <span class="font-medium ltr:ml-3 rtl:mr-3 flex-1 text-left">{navbarT().theme || 'Theme'}</span>
                    <span class="badge badge-sm ltr:ml-auto rtl:mr-auto">
                      {document.documentElement.getAttribute('data-theme') === 'dark' ? 'Dark' : 'Light'}
                    </span>
                  </Show>
                </button>
              </li>
              <li>
                <button
                  classList={{
                    'flex items-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group w-full normal-case': true,
                    'justify-center': isCollapsed(),
                    'justify-start ltr:justify-start rtl:justify-end': !isCollapsed()
                  }}
                  onClick={() => {
                    const next = currentLang() === 'en' ? 'ar' : 'en';
                    setLang(next);
                    localStorage.setItem('lang', next);
                  }}
                >
                   <i data-lucide="globe" classList={{ "w-5 h-5": !isCollapsed(), "w-6 h-6": isCollapsed() }}></i>
                  <Show when={!isCollapsed()}>
                    <span class="font-medium ltr:ml-3 rtl:mr-3 flex-1 text-left">{navbarT().language || 'Language'}</span>
                    <span class="badge badge-outline badge-sm ltr:ml-auto rtl:mr-auto">
                      {currentLang() === 'ar' ? 'AR' : 'EN'}
                    </span>
                  </Show>
                </button>
              </li>
            </ul>
          </div>
      </div>
    </aside>
  );
};
export default Sidebar;