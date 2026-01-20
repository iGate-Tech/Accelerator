import {A, useLocation, useNavigate} from "@solidjs/router";
import {
    useContext,
    onMount,
    onCleanup,
    createSignal,
    createEffect,
    For,
    Show,
    createMemo
} from "solid-js";
import {LangContext} from "../context/LangContext";
import {useUser} from "../context/UserContext";
import {useLanguage} from "../hooks/useLanguage";
import { confirmDelete } from "../components";
import {translations} from "../assets/translations/translations-index.js";
import {
    getProjects,
    updateProject,
    deleteProject,
    deleteAllProjects,
    exportAllProjects,
    exportAllData,
    exportProject,
    exportReports,
    getUserNotifications,
    getCreditBalance,
    getUserSubscription
} from "../lib/database";
import {toastManager} from "../lib/ui/feedback";
import { logger } from "../lib/core";
import {useActivityLogger} from "../lib/business/activity";
import { SidebarSkeleton } from "../components";

const Sidebar = () => {
    logger.trace('Sidebar: Starting');
    const {lang} = useContext(LangContext);
    const {user, isAuthenticated, logout} = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const activityLogger = useActivityLogger();
    const {currentLang, t, setLang} = useLanguage();
    const [projects, setProjects] = createSignal([]);
    const [projectsLoading, setProjectsLoading] = createSignal(true);
    const [projectsCount, setProjectsCount] = createSignal(0);
    const [projectsOpen, setProjectsOpen] = createSignal(true);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [notifications, setNotifications] = createSignal([]);
    const [creditBalance, setCreditBalance] = createSignal(50);
    const [subscription, setSubscription] = createSignal({plan: 'free'});
    const [isCollapsed, setIsCollapsed] = createSignal(false);
    const [editingProjectId, setEditingProjectId] = createSignal(null);
    const navbarT = t;
    const downloadJSON = (data, filename) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
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
        const userId = user() ?. id;
        if (! userId) 
            return;
        
        try {
            const [notifs, balance, sub, projectsData] = await Promise.all([getUserNotifications(userId), getCreditBalance(userId), getUserSubscription(userId), getProjects(userId)]);
            setNotifications(notifs.slice(0, 5).map(n => ({
                ...n,
                type: n.type === 'system' ? 'systemUpdate' : n.type === 'billing' ? 'billing' : n.type === 'credits' ? 'credits' : n.type === 'getting-started' ? 'gettingStarted' : n.type === 'subscription' ? 'subscription' : n.type === 'ai' ? 'aiFeature' : n.type === 'explore' ? 'explore' : n.type === 'help' ? 'help' : n.type === 'project' ? 'project' : 'newMessage',
                time: new Date(n.created_at)
            })));
            setCreditBalance(balance !== null ? balance : (user() ?. credits ?. balance || 50));
            setSubscription(sub ? {
                plan: sub.package_name || 'free'
            } : (user() ?. subscription || {
                plan: 'free'
            }));
            setProjectsCount(Array.isArray(projectsData) ? projectsData.length : 0);
        } catch (error) {
            logger.warn('Failed to load sidebar data:', error.message);
        }
    };
    const filteredProjects = createMemo(() => {
        const projs = projects();
        const query = searchQuery().toLowerCase().trim();

        // Ensure we work with an array
        let projectsArray = [];
        if (Array.isArray(projs)) {
            projectsArray = projs;
        } else if (projs != null) {
            try {
                projectsArray = Array.from(projs);
            } catch (e) {
                projectsArray = [];
            }
        }

        let filtered = projectsArray;
        if (query) {
            filtered = projectsArray.filter(project => {
                if (!project || typeof project !== 'object') return false;
                if (!project.name || typeof project.name !== 'string') return false;
                return project.name.toLowerCase().includes(query);
            });
        }

        // Ensure we always return an array
        return Array.isArray(filtered) ? filtered : [];
    });
    
    const loadProjects = async () => {
        try {
            setProjectsLoading(true);
            logger.debug('Loading projects...');
            const userProjects = await getProjects(user() ?. id);
            logger.debug('getProjects returned:', userProjects);
            
            // Ensure we always set an array, even if getProjects returns undefined or null
            const projectsArray = Array.isArray(userProjects) ? userProjects : [];
            logger.debug('Processed projects array:', projectsArray.length);
            
            setProjects(projectsArray);
            setProjectsCount(projectsArray.length);

            // Log the first few projects for debugging
            if (projectsArray.length > 0) {
                logger.debug('First project:', projectsArray[0]);
            }
        } catch (error) {
            logger.error('Failed to load projects:', error);
            setProjects([]);
            setProjectsCount(0);
        } finally {
            setProjectsLoading(false);
        }
    };


    const handleProjectAction = async (action, projectId, newName = null) => {
        const project = projects().find(p => p.id === projectId);
        if (! project) 
            return;
        
        switch (action) {
            case 'rename':
                if (newName && newName.trim()) {
                    await updateProject(projectId, {name: newName.trim()});
                    window.dispatchEvent(new CustomEvent('projectUpdated'));
                    toastManager.success(t().rename + ' ' + t().successful);
                    await loadProjects();
                }
                break;
            case 'delete': {
                const confirmed = await confirmDelete(project.name);
                if (confirmed) { // Audit logging before deletion
                    logger.info('Project deletion initiated', {
                        projectId,
                        projectName: project.name,
                        userId: user() ?. id,
                        timestamp: new Date().toISOString()
                    });

                    await deleteProject(projectId);

                    // Additional audit logging after successful deletion
                    logger.info('Project deletion completed', {
                        projectId,
                        projectName: project.name,
                        userId: user() ?. id,
                        timestamp: new Date().toISOString()
                    });

                    window.dispatchEvent(new CustomEvent('projectDeleted', {detail: {
                            projectId
                        }}));
                    toastManager.success(t().delete + ' ' + t().successful);
                    await loadProjects();
                }
                break;
            }
            case 'open':
                window.dispatchEvent(new CustomEvent('openProject', {detail: projectId}));
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
        if (! currentUser) 
            return;
        
        try {
            const data = await exportAllData(currentUser.id);
            downloadJSON(data, `accelerator-export-${
                new Date().toISOString().split('T')[0]
            }.json`);
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
        // Initialize database first before loading any data
        try {
            const { initDb } = await import("../lib/database");
            await initDb();
        } catch (error) {
            logger.warn('Failed to initialize database:', error.message);
        }
        
        await loadProjects();
        await loadNotifications();
        window.addEventListener('projectAdded', onProjectAdded);
        window.addEventListener('projectUpdated', onProjectUpdated);
        if (window.lucide) {
            window.lucide.createIcons();
        }
        // Load collapsed state from localStorage
        const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        setIsCollapsed(savedCollapsed);
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
        projects();
        setTimeout(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }, 50);
    });
    createEffect(() => {
        if (!isCollapsed() && window.lucide) {
            window.lucide.createIcons();
        }
    });

    // Persist collapsed state
    createEffect(() => {
        localStorage.setItem('sidebarCollapsed', isCollapsed().toString());
    });
    return (
        <aside class={
                `sidebar h-screen bg-base-100 border-e border-base-300 flex flex-col z-[55] transition-all duration-300 ease-in-out overflow-hidden ${
                    currentLang() === 'ar' ? 'rtl' : ''
                }`
            }
            style={
                {
                    width: isCollapsed() ? '80px' : '256px'
                }
            }
            dir={
                currentLang() === "ar" ? "rtl" : "ltr"
        }>
            <div class="flex flex-col h-full min-h-0 transition-all duration-300">
                <div class="flex-shrink-0 relative p-5 flex items-center justify-between rtl:justify-between gap-2">
                    <A href="/"
                        onClick={
                            (e) => {
                                e.preventDefault();
                                setIsCollapsed(!isCollapsed());
                            }
                        }
                        class="cursor-pointer flex items-center rtl:justify-center">
                        <img src={
                                isCollapsed() ? "/src/assets/images/favicon.svg" : "/src/assets/images/iGate-tech-logo.svg"
                            }
                            alt="Logo"
                            classList={
                                {
                                    'h-8': true,
                                    'w-10': isCollapsed()
                                }
                            }/>
                              <span 
                                classList={{
                                  'hidden': isCollapsed()
                                }} 
                                class="px-2 py-0.5 text-xs font-medium text-base-content/40 self-end">1.0</span>

                    </A>
                    <Show when={
                        !isCollapsed()
                    }>
                        <A href="/"
                            onClick={
                                (e) => {
                                    e.preventDefault();
                                    setIsCollapsed(!isCollapsed());
                                }
                            }
                            class="cursor-pointer p-1 hover:bg-base-300 rounded-lg flex transition-colors">
                            <i data-lucide="chevron-left" class="w-5 h-5 text-base-content/60"></i>
                        </A>
                    </Show>
                </div>

                <div class="flex-1 overflow-y-auto px-1 min-h-0 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
                    <ul class="menu w-full gap-1">
                        <li classList={
                            {
                                "menu-active": location.pathname === "/"
                            }
                        }>
                            <A href="/"
                                onClick={
                                    () => window.dispatchEvent(new CustomEvent('resetAgent'))
                                }
                                class="flex items-center justify-center ltr:justify-center rtl:justify-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group"
                                aria-label={
                                    `Create new project - ${
                                        t().newProject
                                    }`
                            }>
                                <i data-lucide="plus"
                                    classList={
                                        {
                                            "w-5 h-5": !isCollapsed(),
                                            "w-6 h-6": isCollapsed()
                                        }
                                    }
                                    class="text-base-content/60"
                                    aria-hidden="true"></i>
                                <Show when={
                                    !isCollapsed()
                                }>
                                    <span class="font-medium ltr:ml-3 rtl:mr-3">
                                        {
                                        t().newProject
                                    }</span>
                                </Show>
                            </A>
                        </li>
                        <li classList={
                            {
                                "menu-active": location.pathname === "/explore"
                            }
                        }>
                            <A href="/explore" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group"
                                aria-label={
                                    `Explore - ${
                                        t().exploreIdeas
                                    }`
                            }>
                                <i data-lucide="compass"
                                    classList={
                                        {
                                            "w-5 h-5": !isCollapsed(),
                                            "w-6 h-6": isCollapsed()
                                        }
                                    }
                                    class="text-base-content/60"
                                    aria-hidden="true"></i>
                                <Show when={
                                    !isCollapsed()
                                }>
                                    <span class="font-medium ltr:ml-3 rtl:mr-3">
                                        {
                                        t().exploreIdeas
                                    }</span>
                                </Show>
                            </A>
                        </li>
                        <li classList={
                            {
                                "menu-active": location.pathname === "/dashboard"
                            }
                        }>
                            <A href="/dashboard" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group"
                                aria-label={
                                    `Dashboard - ${
                                        t().dashboard
                                    }`
                            }>
                                <i data-lucide="bar-chart"
                                    classList={
                                        {
                                            "w-5 h-5": !isCollapsed(),
                                            "w-6 h-6": isCollapsed()
                                        }
                                    }
                                    class="text-base-content/60"
                                    aria-hidden="true"></i>
                                <Show when={
                                    !isCollapsed()
                                }>
                                    <span class="font-medium ltr:ml-3 rtl:mr-3">
                                        {
                                        t().dashboard
                                    }</span>
                                </Show>
                            </A>
                        </li>
                        <li classList={
                            {
                                "menu-active": location.pathname === "/portfolio"
                            }
                        }>
                            <A href="/portfolio" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group"
                                aria-label={
                                    `Portfolio - ${
                                        t().portfolio
                                    }`
                            }>
                                <i data-lucide="briefcase"
                                    classList={
                                        {
                                            "w-5 h-5": !isCollapsed(),
                                            "w-6 h-6": isCollapsed()
                                        }
                                    }
                                    class="text-base-content/60"
                                    aria-hidden="true"></i>
                                <Show when={
                                    !isCollapsed()
                                }>
                                    <span class="font-medium ltr:ml-3 rtl:mr-3">
                                        {
                                        t().portfolio
                                    }</span>
                                </Show>
                            </A>
                        </li>
                        <li classList={
                            {
                                "menu-active": location.pathname === "/invitations"
                            }
                        }>
                            <A href="/invitations" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group"
                                aria-label={`Collaborate - Invitations`}>
                                <i data-lucide="users"
                                    classList={
                                        {
                                            "w-5 h-5": !isCollapsed(),
                                            "w-6 h-6": isCollapsed()
                                        }
                                    }
                                    class="text-base-content/60"
                                    aria-hidden="true"></i>
                                <Show when={
                                    !isCollapsed()
                                }>
                                    <span class="font-medium ltr:ml-3 rtl:mr-3">
                                        {
                                        t().collaborate
                                    }</span>
                                </Show>
                            </A>
                        </li>


                    </ul>
                    <ul class="px-2 w-full gap-1">
                        <Show when={
                            !isCollapsed()
                        }>
                            <li>
                                <details open={
                                        projectsOpen()
                                    }
                                    onToggle={
                                        (e) => setProjectsOpen(e.target.open)
                                }>
                                    <summary style='line-height: normal;' class="flex items-center ltr:justify-between rtl:justify-between px-4 py-2.5 hover:bg-base-300 transition-colors rounded-lg cursor-pointer text-xs text-base-content/50 ">
                                        <div class="flex items-center gap-3 w-full ">
                                 
                                            <span class="">
                                                {
                                                t().allProjects
                                            }</span>
                                            <span class="badge badge-xs badge-accent ltr:ml-auto rtl:mr-auto flex-shrink-0 border-none" style="background-color:#00a7e0">
                                                {
                                                filteredProjects().length
                                            }</span>
                                        </div>
                                        <button class="btn btn-ghost btn-xs opacity-60 hover:opacity-100 btn-circle" popovertarget="popover-all-projects" style="anchor-name:--anchor-all-projects">
                                            <i data-lucide="more-vertical" class="w-3 h-3"></i>
                                        </button>
                                    </summary>
                                    <div class="dropdown menu rounded-box bg-base-100 shadow-lg border border-base-200 mt-1" popover id="popover-all-projects" style="position-anchor:--anchor-all-projects">
                                        <li>
                                            <A href="/"
                                                onClick={
                                                    () => window.dispatchEvent(new CustomEvent('resetAgent'))
                                                }
                                                class="flex items-center gap-2">
                                                <i data-lucide="plus" class="w-4 h-4"></i>
                                                {
                                                t().newProject
                                            } </A>
                                        </li>
                                        <li>
                                            <a onclick={handleExportAllProjects}
                                                class="flex items-center gap-2">
                                                <i data-lucide="download" class="w-4 h-4"></i>
                                                {
                                                t().exportAllProjects
                                            } </a>
                                        </li>
                                        <li>
                                            <a onclick={
                                                    async () => {
                                                        try {
                                                            const data = await exportAllData(user() ?. id);
                                                            downloadJSON(data, 'all_data_backup.json');
                                                            await activityLogger.logData('exported', 'all_data', {format: 'json'});
                                                            toastManager.success(t().backupAllData + ' ' + t().successful);
                                                        } catch (error) {
                                                            await activityLogger.logError('data_export_failed', error, {dataType: 'all_data'});
                                                            toastManager.error(t().backupAllData + ' ' + t().failed);
                                                        }
                                                    }
                                                }
                                                class="flex items-center gap-2">
                                                <i data-lucide="archive" class="w-4 h-4"></i>
                                                {
                                                t().backupAllData
                                            } </a>
                                        </li>
                                        <div class="divider my-1"></div>
                                        <li>
                                            <a onclick={handleDeleteAllProjects}
                                                class="flex items-center gap-2 text-error">
                                                <i data-lucide="trash" class="w-4 h-4"></i>
                                                {
                                                t().deleteAllProjects
                                            } </a>
                                        </li>
                                    </div>
                                    <div class="pr-6 pl-4 py-2">
                                        <div class="relative">
                                            <input type="text"
                                                placeholder={
                                                    t().sidebarSearch
                                                }
                                                class="input input-bordered input-sm w-full pe-8"
                                                value={
                                                    searchQuery()
                                                }
                                                onInput={
                                                    (e) => setSearchQuery(e.target.value)
                                                }/>
                                            <i data-lucide="search" class="absolute top-1/2 -translate-y-1/2 end-2 w-4 h-4 text-base-content/40"></i>
                                        </div>
                                    </div>
                                    <ul class="mt-1 space-y-1">
                                        <Show when={
                                            projectsLoading()
                                        }>
                                            <SidebarSkeleton/>
                                        </Show>
                                         <Show when={
                                             !projectsLoading()
                                         }>
                                             <For each={filteredProjects()}>{(project) => (
                                                 <li>
                                                        <div class="flex justify-between ltr:justify-between rtl:justify-between items-center px-4 py-2 hover:bg-base-300 rounded-lg transition-colors cursor-pointer group">
                                                            <span onclick={
                                                                    () => {
                                                                        logger.debug('Opening project:', project.id);
                                                                        window.dispatchEvent(new CustomEvent('openProject', {detail: project.id}));
                                                                    }
                                                                }
                                                                class="flex items-center w-full gap-2">
                                                                <div class="rounded flex-shrink-0">
                                                                    <i data-lucide="folder"
                                                                        classList={
                                                                            {
                                                                                "w-4 h-4": !isCollapsed(),
                                                                                "w-5 h-5": isCollapsed()
                                                                            }
                                                                        }
                                                                        class="text-base-content/60"></i>
                                                                </div>
                                                                <span class="ltr:ms-2 rtl:me-2 truncate flex-1 min-w-0"
                                                                    data-project-id={
                                                                        project.id
                                                                    }
                                                                    contentEditable={
                                                                        editingProjectId() === project.id
                                                                    }
                                                                    onBlur={
                                                                        (e) => {
                                                                            if (editingProjectId() === project.id) {
                                                                                const newName = e.target.textContent.trim();
                                                                                if (newName && newName !== project.name) {
                                                                                    handleProjectAction('rename', project.id, newName.trim());
                                                                                }
                                                                                setEditingProjectId(null);
                                                                            }
                                                                        }
                                                                    }
                                                                    onKeyDown={
                                                                        (e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault();
                                                                                e.target.blur();
                                                                            }
                                                                            if (e.key === 'Escape') {
                                                                                e.target.textContent = project.name;
                                                                                setEditingProjectId(null);
                                                                            }
                                                                        }
                                                                }>
                                                                    {
                                                                    project.name
                                                                } </span>
                                                            </span>
                                                            <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button class="btn btn-ghost btn-xs"
                                                                    popovertarget={
                                                                        `popover-project-${
                                                                            project.id
                                                                        }`
                                                                    }
                                                                    style={
                                                                        `anchor-name: --anchor-project-${
                                                                            project.id
                                                                        }`
                                                                    }
                                                                    aria-label="Project options">
                                                                    <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover
                                                            id={
                                                                `popover-project-${
                                                                    project.id
                                                                }`
                                                            }
                                                            style={
                                                                `position-anchor: --anchor-project-${
                                                                    project.id
                                                                }`
                                                        }>
                                                            <li>
                                                                <a onclick={
                                                                    () => {
                                                                        setEditingProjectId(project.id);
                                                                        setTimeout(() => {
                                                                            const span = document.querySelector(`[data-project-id="${
                                                                                project.id
                                                                            }"]`);
                                                                            if (span) {
                                                                                span.focus();
                                                                                const range = document.createRange();
                                                                                range.selectNodeContents(span);
                                                                                const sel = window.getSelection();
                                                                                sel.removeAllRanges();
                                                                                sel.addRange(range);
                                                                            }
                                                                        }, 0);
                                                                    }
                                                                }>
                                                                    <i data-lucide="edit" class="w-4 h-4"></i>
                                                                    {
                                                                    t().rename
                                                                }</a>
                                                            </li>
                                                            <li>
                                                                <a onclick={
                                                                    () => handleProjectAction('delete', project.id)
                                                                }>
                                                                    <i data-lucide="trash" class="w-4 h-4"></i>
                                                                    {
                                                                    t().delete
                                                                }</a>
                                                            </li>
                                                            <li>
                                                                <a onclick={
                                                                    async () => {
                                                                        try {
                                                                            const data = await exportProject(project.id);
                                                                            downloadJSON(data, `${
                                                                                project.name
                                                                            }-project.json`);
                                                                            await activityLogger.logData('exported', 'project', {
                                                                                projectId: project.id,
                                                                                projectName: project.name,
                                                                                format: 'json'
                                                                            });
                                                                            toastManager.success(t().exportProject + ' ' + t().successful);
                                                                        } catch (error) {
                                                                            await activityLogger.logError('project_export_failed', error, {projectId: project.id});
                                                                            toastManager.error(t().backupAllData + ' ' + t().failed);
                                                                        }
                                                                    }
                                                                }>
                                                                    <i data-lucide="download" class="w-4 h-4"></i>
                                                                    {
                                                                    t().exportProject
                                                                }</a>
                                                            </li>
                                                            <li>
                                                                <a onclick={
                                                                    async () => {
                                                                        try {
                                                                            const data = await exportReports(project.id);
                                                                            downloadJSON(data, `${
                                                                                project.name
                                                                            }-report.json`);
                                                                            await activityLogger.logData('exported', 'reports', {
                                                                                projectId: project.id,
                                                                                projectName: project.name,
                                                                                format: 'json'
                                                                            });
                                                                            toastManager.success(t().exportReports + ' ' + t().successful);
                                                                        } catch (error) {
                                                                            await activityLogger.logError('reports_export_failed', error, {projectId: project.id});
                                                                            toastManager.error(t().exportReports + ' ' + t().failed);
                                                                        }
                                                                    }
                                                                }>
                                                                    <i data-lucide="file-text" class="w-4 h-4"></i>
                                                                    {
                                                                    t().exportReports
                                                                }</a>
                                                            </li>
                                                        </ul>
                                                    </li>
                                                      )}</For>
                                         </Show>
                                    </ul>
                                </details>
                            </li>


                        </Show>
                    </ul>
                </div>

                <div class="flex-shrink-0 border-t border-base-200">
                    <ul class="menu w-full gap-1">
                        <Show when={
                            isAuthenticated()
                        }>
                            <li>
                                <details class="w-full">
                                    <summary classList={
                                        {
                                            'flex items-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group w-full cursor-pointer list-none': true,
                                            'justify-center': isCollapsed()
                                        }
                                    }>
                                        {/* Avatar */}
                                        <div class="avatar relative flex-shrink-0">
                                            <div class="w-8 h-8 rounded-full bg-base-300 dark:bg-gray-100/40">
                                                {
                                                user() ?. avatar ? (
                                                    <img src={
                                                            user() ?. avatar
                                                        }
                                                        alt="User avatar"
                                                        class="w-full h-full object-cover rounded-full"/>
                                                ) : (
                                                    <div class="w-full h-full flex items-center justify-center">
                                                        <i data-lucide="user"
                                                            classList={
                                                                {
                                                                    'w-5 h-5': !isCollapsed(),
                                                                    'w-6 h-6': isCollapsed()
                                                                }
                                                            }
                                                            class="text-base-content/60"></i>
                                                    </div>
                                                )
                                            } </div>

                                            {/* Online indicator */}
                                            <div class="absolute bottom-0 end-0 w-2 h-2 bg-success border border-base-100 rounded-full"></div>
                                        </div>

                                        {/* Name + Chevron */}
                                        <Show when={
                                            !isCollapsed()
                                        }>
                                            <span class="font-medium ms-3 flex-1 min-w-0 truncate">
                                                {
                                                user() ?. profile ?. name ?? 'User'
                                            } </span>
                                        </Show>


                                    </summary>

                                    {/* Dropdown */}
                                    <Show when={
                                        !isCollapsed()
                                    }>
                                        <ul class="menu m-0 border border-0 w-full bg-base-100">

                                            <li>
                                                <A href="/profile" class="flex items-center gap-2">
                                                    <i data-lucide="user" class="w-4 h-4 text-base-content/60"></i>
                                                    {
                                                    navbarT().profile || 'Profile'
                                                } </A>
                                            </li>
                                            <li>
                                                <A href="/settings" class="flex items-center gap-2">
                                                    <i data-lucide="settings" class="w-4 h-4 text-base-content/60"></i>
                                                    {
                                                    navbarT().settings || 'Settings'
                                                } </A>
                                            </li>
                                            <li>
                                                <A href="/packages" class="flex items-center gap-2">
                                                    <i data-lucide="crown" class="w-4 h-4 text-base-content/60"></i>
                                                    {
                                                    navbarT().packages || 'Packages'
                                                } </A>
                                            </li>
                                            <li>
                                                <A href="/billing" class="flex items-center gap-2">
                                                    <i data-lucide="credit-card" class="w-4 h-4 text-base-content/60"></i>
                                                    {
                                                    navbarT().billingLabel || 'Billing'
                                                } </A>
                                            </li>
                                            <li>
                                                <A href="/credits" class="flex items-center gap-2">
                                                    <i data-lucide="coins" class="w-4 h-4 text-base-content/60"></i>
                                                    {
                                                    navbarT().creditsLabel || 'Credits'
                                                } </A>
                                            </li>


                                            <li>
                                                <button onClick={
                                                        async () => {
                                                            await logout();
                                                            navigate('/auth/login');
                                                        }
                                                    }
                                                    class="text-error hover:bg-error/10">
                                                    <i data-lucide="log-out" class="w-4 h-4 text-error"></i>
                                                    {
                                                    navbarT().signOut || 'Sign Out'
                                                } </button>
                                            </li>
                                        </ul>
                                    </Show>
                                </details>


                            </li>
                        </Show>

                         <Show when={!isCollapsed()}>
                             <li class="grid grid-cols-4 gap-1 w-full bg-base-200 rounded-lg">
                                 <A href="/notifications" class="flex items-center justify-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group normal-case" aria-label="Notifications">
                                     <i data-lucide="bell" class="w-5 h-5 text-base-content/40"></i>
                                     <Show when={
                                         (notifications() || []).some(n => !n.read)
                                     }>
                                         <span class="badge badge-error badge-xs absolute -top-1 -right-1">
                                             {
                                             (notifications() || []).filter(n => !n.read).length
                                         }</span>
                                     </Show>
                                 </A>
                                 <button class="flex items-center justify-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group normal-case"
                                     onClick={
                                         () => {
                                             const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                                             document.documentElement.setAttribute('data-theme', next);
                                             localStorage.setItem('theme', next);
                                         }
                                     }
                                     aria-label="Toggle theme">
                                     <i data-lucide="sun-moon" class="w-5 h-5 text-base-content/40"></i>
                                 </button>
                                 <button class="flex items-center justify-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group normal-case"
                                     onClick={
                                         () => {
                                             const next = currentLang() === 'en' ? 'ar' : 'en';
                                             setLang(next);
                                             localStorage.setItem('lang', next);
                                         }
                                     }
                                     aria-label="Change language">
                                     <i data-lucide="globe" class="w-5 h-5 text-base-content/40"></i>
                                 </button>
                                 <A href="/help" class="flex items-center justify-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group normal-case" aria-label="Get help and support">
                                     <i data-lucide="help-circle" class="w-5 h-5 text-base-content/40"></i>
                                 </A>
                             </li>
                         </Show>
                    </ul>
                </div>
            </div>
        </aside>
    );
};
export default Sidebar;
