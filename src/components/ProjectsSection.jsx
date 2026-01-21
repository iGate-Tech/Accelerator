import { useContext, createSignal, createEffect, createMemo, onMount, onCleanup, For, Show } from "solid-js";
import { LangContext } from "../context/LangContext";
import { useUser } from "../context/UserContext";
import { useLanguage } from "../hooks/useLanguage";
import { confirmDelete } from "../components";
import { translations } from "../assets/translations/translations-index.js";
import {
    getProjects,
    updateProject,
    deleteProject,
    deleteAllProjects,
    exportAllProjects,
    exportAllData,
    exportProject,
    exportReports,
} from "../lib/database";
import { addProject } from "../lib/db";
import { toastManager } from "../lib/ui/feedback";
import { logger } from "../lib/core";
import { useActivityLogger } from "../lib/business/activity";
import { projectsStore, setProjectsStore, setPendingProjectId } from "../stores/projectsStore";

const ProjectsSection = (props) => {
    const { lang } = useContext(LangContext);
    const { user } = useUser();
    const activityLogger = useActivityLogger();
    const { t, setLang } = useLanguage();
    const [projectsOpen, setProjectsOpen] = createSignal(true);
    const [editingProjectId, setEditingProjectId] = createSignal(null);
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
    const filteredProjects = createMemo(() => {
        const projs = projectsStore.projects;
        const query = projectsStore.searchQuery.toLowerCase().trim();

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
            setProjectsStore('loading', true);
            logger.debug('Loading projects...');
            
            // Check if user is authenticated before loading projects
            const currentUser = user();
            if (!currentUser?.id) {
                logger.debug('No authenticated user, skipping project load');
                setProjectsStore('projects', []);
                setProjectsStore('count', 0);
                return;
            }
            
            const userProjects = await getProjects(currentUser.id);
            logger.debug('getProjects returned:', userProjects);

            // Ensure we always set an array, even if getProjects returns undefined or null
            const projectsArray = Array.isArray(userProjects) ? [...userProjects] : [];
            logger.debug('Processed projects array:', projectsArray.length);

            setProjectsStore('projects', []);
            setProjectsStore('projects', projectsArray);
            setProjectsStore('count', projectsArray.length);

            // Log the first few projects for debugging
            if (projectsArray.length > 0) {
                logger.debug('First project:', projectsArray[0]);
            }
        } catch (error) {
            logger.error('Failed to load projects:', error);
            setProjectsStore('projects', []);
            setProjectsStore('count', 0);
        } finally {
            setProjectsStore('loading', false);
        }
    };

    const handleProjectAction = async (action, projectId, newName = null) => {
        const project = projectsStore.projects.find(p => p.id === projectId);
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
            case 'delete': {
                const confirmed = await confirmDelete(project.name);
                if (confirmed) { // Audit logging before deletion
                    logger.info('Project deletion initiated', {
                        projectId,
                        projectName: project.name,
                        userId: user()?.id,
                        timestamp: new Date().toISOString()
                    });

                    await deleteProject(projectId);

                    // Additional audit logging after successful deletion
                    logger.info('Project deletion completed', {
                        projectId,
                        projectName: project.name,
                        userId: user()?.id,
                        timestamp: new Date().toISOString()
                    });

                    window.dispatchEvent(new CustomEvent('projectDeleted', { detail: { projectId } }));
                    toastManager.success(t().delete + ' ' + t().successful);
                    await loadProjects();
                }
                break;
            }
            case 'open':
                setPendingProjectId(projectId);
                break;
            default:
                logger.debug('Unknown action:', action);
        }
    };
    const handleDeleteAllProjects = async () => {
        const confirmed = await confirmDelete(t().allProjects, "All projects will be permanently deleted.");
        if (confirmed) {
            try {
                await deleteAllProjects();
                toastManager.success(t().deleteAllProjects + ' ' + t().successful);
                await loadProjects();
            } catch (error) {
                console.log('Caught error in delete all projects:', error.message);
                toastManager.error('Failed to delete all projects: ' + error.message);
            }
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
    const handleCreateProject = async () => {
        const currentUser = user();
        if (!currentUser) {
            toastManager.error('You must be logged in to create a project');
            return;
        }

        try {
            // Ensure database is initialized
            const { initDb } = await import("../lib/database");
            await initDb();

            const projectId = await addProject({ name: 'New Project' }, currentUser.id);
            window.dispatchEvent(new CustomEvent('projectAdded'));
            toastManager.success(t().newProject + ' ' + t().successful);
            await loadProjects(); // Also reload directly

            // Automatically open the newly created project
            if (projectId) {
                setPendingProjectId(projectId);
            }
        } catch (error) {
            logger.error('Failed to create project:', error);
            toastManager.error(t().newProject + ' ' + t().failed);
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

        setProjectsStore('loading', true);
        await loadProjects();
        window.addEventListener('projectAdded', onProjectAdded);
        window.addEventListener('projectUpdated', onProjectUpdated);
        window.addEventListener('projectDeleted', onProjectUpdated);
        if (window.lucide) {
            window.lucide.createIcons();
        }
    });
    onCleanup(() => {
        window.removeEventListener('projectAdded', onProjectAdded);
        window.removeEventListener('projectUpdated', onProjectUpdated);
        window.removeEventListener('projectDeleted', onProjectUpdated);
    });
    createEffect(() => {
        const newLang = lang();
        setLang(newLang);
    });
    let lastLoadTime = 0;
    createEffect(() => {
        const currentUser = user();
        const now = Date.now();
        if (currentUser && currentUser.id && (now - lastLoadTime > 1000)) {
            lastLoadTime = now;
            loadProjects();
        }
    });
    createEffect(() => {
        projectsStore.projects;
        setTimeout(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }, 50);
    });

    return (
        <Show when={!props.isCollapsed}>
            <ul class="px-2 w-full gap-1">
                <li>
                    <details open={projectsOpen()} onToggle={(e) => setProjectsOpen(e.target.open)}>
                        <summary style='line-height: normal;' class="flex items-center ltr:justify-between rtl:justify-between px-4 py-2.5 transition-colors rounded-lg cursor-pointer text-xs text-base-content/50 ">
                            <div class="flex items-center gap-3 w-full ">
                                <span class="">{t().allProjects}</span>
                                <span class="badge badge-xs badge-accent ltr:ml-auto rtl:mr-auto flex-shrink-0 border-none" style="background-color:#00a7e0">{filteredProjects().length}</span>
                            </div>
                            <button class="btn btn-ghost btn-xs opacity-60 hover:opacity-100 btn-circle" popovertarget="popover-all-projects" style="anchor-name:--anchor-all-projects">
                                <i data-lucide="more-vertical" class="w-3 h-3"></i>
                            </button>
                        </summary>
                        <div class="dropdown menu rounded-box shadow-lg mt-1" popover id="popover-all-projects" style="position-anchor:--anchor-all-projects">
                            <li>
                                <button onclick={handleCreateProject} class="flex items-center gap-2 w-full text-left">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                    {t().newProject}
                                </button>
                            </li>
                            <li>
                                <a onclick={handleExportAllProjects} class="flex items-center gap-2">
                                    <i data-lucide="download" class="w-4 h-4"></i>
                                    {t().exportAllProjects}
                                </a>
                            </li>
                            <li>
                                <a onclick={async () => {
                                    try {
                                        const data = await exportAllData(user()?.id);
                                        downloadJSON(data, 'all_data_backup.json');
                                        await activityLogger.logData('exported', 'all_data', { format: 'json' });
                                        toastManager.success(t().backupAllData + ' ' + t().successful);
                                    } catch (error) {
                                        await activityLogger.logError('data_export_failed', error, { dataType: 'all_data' });
                                        toastManager.error(t().backupAllData + ' ' + t().failed);
                                    }
                                }} class="flex items-center gap-2">
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
                        <div class="pr-6 pl-4 py-2">
                            <div class="relative">
                                <input type="text" placeholder={t().sidebarSearch} class="input input-bordered input-sm w-full pe-8" value={projectsStore.searchQuery} onInput={(e) => setProjectsStore('searchQuery', e.target.value)} />
                                <i data-lucide="search" class="absolute top-1/2 -translate-y-1/2 end-2 w-4 h-4 text-base-content/40"></i>
                            </div>
                        </div>
                        <ul class="mt-1 space-y-1">
                             <Show when={!projectsStore.loading}>
                                 <For each={filteredProjects()} key={(project) => project.id}>{(project) => (
                                    <li>
                                        <div class={`flex justify-between ltr:justify-between rtl:justify-between items-center px-4 py-2 rounded-lg transition-colors cursor-pointer group ${project.id === projectsStore.currentProjectId ? '' : ''}`}>
                                            <span onclick={() => {
                                                logger.debug('Opening project:', project.id);
                                                setPendingProjectId(project.id);
                                            }} class="flex items-center w-full gap-2">
                                                <div class="rounded flex-shrink-0">
                                                    <i data-lucide="folder" class={`w-4 h-4 ${project.id === projectsStore.currentProjectId ? 'text-primary' : 'text-base-content/60'}`}></i>
                                                </div>
                                                <span class="ltr:ms-2 rtl:me-2 truncate flex-1 min-w-0" data-project-id={project.id} contentEditable={editingProjectId() === project.id} onBlur={(e) => {
                                                    if (editingProjectId() === project.id) {
                                                        const newName = e.target.textContent.trim();
                                                        if (newName && newName !== project.name) {
                                                            handleProjectAction('rename', project.id, newName.trim());
                                                        }
                                                        setEditingProjectId(null);
                                                    }
                                                }} onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        e.target.blur();
                                                    }
                                                    if (e.key === 'Escape') {
                                                        e.target.textContent = project.name;
                                                        setEditingProjectId(null);
                                                    }
                                                }}>
                                                    {project.name}
                                                </span>
                                            </span>
                                            <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button class="btn btn-ghost btn-xs" popovertarget={`popover-project-${project.id}`} style={`anchor-name: --anchor-project-${project.id}`} aria-label="Project options">
                                                    <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <ul class="dropdown menu w-52 rounded-box shadow-sm" popover id={`popover-project-${project.id}`} style={`position-anchor: --anchor-project-${project.id}`}>
                                            <li>
                                                <a onclick={() => {
                                                    setEditingProjectId(project.id);
                                                    setTimeout(() => {
                                                        const span = document.querySelector(`[data-project-id="${project.id}"]`);
                                                        if (span) {
                                                            span.focus();
                                                            const range = document.createRange();
                                                            range.selectNodeContents(span);
                                                            const sel = window.getSelection();
                                                            sel.removeAllRanges();
                                                            sel.addRange(range);
                                                        }
                                                    }, 0);
                                                }}>
                                                    <i data-lucide="edit" class="w-4 h-4"></i>
                                                    {t().rename}
                                                </a>
                                            </li>
                                            <li>
                                                <a onclick={() => handleProjectAction('delete', project.id)}>
                                                    <i data-lucide="trash" class="w-4 h-4"></i>
                                                    {t().delete}
                                                </a>
                                            </li>
                                            <li>
                                                <a onclick={async () => {
                                                    try {
                                                        const data = await exportProject(project.id);
                                                        downloadJSON(data, `${project.name}-project.json`);
                                                        await activityLogger.logData('exported', 'project', { projectId: project.id, projectName: project.name, format: 'json' });
                                                        toastManager.success(t().exportProject + ' ' + t().successful);
                                                    } catch (error) {
                                                        await activityLogger.logError('project_export_failed', error, { projectId: project.id });
                                                        toastManager.error(t().backupAllData + ' ' + t().failed);
                                                    }
                                                }}>
                                                    <i data-lucide="download" class="w-4 h-4"></i>
                                                    {t().exportProject}
                                                </a>
                                            </li>
                                            <li>
                                                <a onclick={async () => {
                                                    try {
                                                        const data = await exportReports(project.id);
                                                        downloadJSON(data, `${project.name}-report.json`);
                                                        await activityLogger.logData('exported', 'reports', { projectId: project.id, projectName: project.name, format: 'json' });
                                                        toastManager.success(t().exportReports + ' ' + t().successful);
                                                    } catch (error) {
                                                        await activityLogger.logError('reports_export_failed', error, { projectId: project.id });
                                                        toastManager.error(t().exportReports + ' ' + t().failed);
                                                    }
                                                }}>
                                                    <i data-lucide="file-text" class="w-4 h-4"></i>
                                                    {t().exportReports}
                                                </a>
                                            </li>
                                        </ul>
                                    </li>
                                )}</For>
                            </Show>
                        </ul>
                    </details>
                </li>
            </ul>
        </Show>
    );
};

export default ProjectsSection;