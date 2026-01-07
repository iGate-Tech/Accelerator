import { A, useLocation } from "@solidjs/router";
import { useContext, onMount, createSignal, createEffect, For } from "solid-js";
import { LangContext } from "../context/LangContext";
import { translations } from "../lib/translations";
import { getProjects, addProject, updateProject, deleteProject } from "../lib/db";

const Sidebar = () => {
  const { lang } = useContext(LangContext);
  const location = useLocation();
  const [projects, setProjects] = createSignal([]);
  const [search, setSearch] = createSignal("");
  const [editingProjectId, setEditingProjectId] = createSignal(null);

  const filteredProjects = () => projects().filter(p => p.name.toLowerCase().includes(search().toLowerCase()));

  const handleAddProject = async () => {
    const name = prompt("Enter project name:");
    if (name) {
      await addProject({ name, createdAt: new Date() });
      loadProjects();
    }
  };

  const handleEditProject = async (id) => {
    if (editingId() === id) {
      await updateProject(id, { name: editName() });
      setEditingId(null);
      loadProjects();
    } else {
      const project = projects().find(p => p.id === id);
      setEditName(project.name);
      setEditingId(id);
    }
  };

  const handleDeleteProject = async (id) => {
    await deleteProject(id);
    loadProjects();
  };

  const handleRenameProject = async (id, newName) => {
    await updateProject(id, { name: newName });
    loadProjects();
  };

  const loadProjects = async () => {
    const projs = await getProjects();
    setProjects(projs);
  };

  onMount(async () => {
    await loadProjects();
    // Listen for project added events
    window.addEventListener('projectAdded', async () => {
      await loadProjects();
    });
    // Create Lucide icons
    if (window.lucide) window.lucide.createIcons();
  });

  createEffect(() => {
    projects();
    search();
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div class="sidebar fixed left-0 top-16 w-80 bg-base-100 border-r border-base-200 h-[calc(100vh-4rem)] overflow-y-auto hidden lg:block z-[55]">
      <div class="p-4">
        <ul class="menu bg-base-200 rounded-box w-full mb-5">
          <li classList={{ "active": location.pathname === "/" }}>
            <A href="/">
              <i data-lucide="plus" class="w-4 h-4"></i>
              New Project
            </A>
          </li>
          <li classList={{ "active": location.pathname === "/explore" }}>
            <A href="/explore">
              <i data-lucide="compass" class="w-4 h-4"></i>
              Explore Ideas
            </A>
          </li>
          <li classList={{ "active": location.pathname === "/help" }}>
            <A href="/help">
              <i data-lucide="help-circle" class="w-4 h-4"></i>
              {translations[lang()].help}
            </A>
          </li>
         </ul>
         <ul class="menu bg-base-200 rounded-box w-full">
          <li>
            <details>
              <summary>
                <i data-lucide="folder" class="w-4 h-4"></i>
                All Projects
              </summary>
              <div class="px-2 py-1">
                <input
                  type="text"
                  placeholder="Search projects..."
                  class="input w-full mb-2"
                  value={search()}
                  onInput={(e) => setSearch(e.target.value)}
                />
              </div>
              <ul>
                <For each={filteredProjects()}>
                  {(project) => (
                     <li>
                       <details>
                         <summary class="flex justify-between items-center">
                            <span class="flex items-center w-full">
                              <i data-lucide="folder" class="w-4 h-4"></i>
                              <span
                                class="ml-2"
                                data-project-id={project.id}
                                contentEditable={editingProjectId() === project.id}
                                onBlur={(e) => {
                                  if (editingProjectId() === project.id) {
                                    const newName = e.target.textContent.trim();
                                    if (newName && newName !== project.name) {
                                      handleRenameProject(project.id, newName);
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
                           <button class="btn btn-ghost btn-xs" popovertarget={`popover-${project.id}`} style={`anchor-name:--anchor-${project.id}`}>
                             <i data-lucide="more-vertical" class="w-4 h-4"></i>
                           </button>
                         </summary>
                          <ul class="menu menu-xs bg-base-200 rounded-box max-w-xs w-full mt-2">
                            <li class="px-2">
                              <details open>
                                <summary>
                                  <i data-lucide="layers" class="w-4 h-4"></i>
                                  Models
                                </summary>
                               <ul>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="lightbulb" class="w-4 h-4 mr-1"></i>
                                       Idea Model
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
                                       Business Model
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
                                       Financial Model
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
                                       Funding Model
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
                                       Marketing Model
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
                                       Team Model
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
                                       Legal Model
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
                                       Technical Model
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
                                <summary>
                                  <i data-lucide="folder" class="w-4 h-4"></i>
                                  Reports
                                </summary>
                               <ul>
                                 <li>
                                   <div class="flex justify-between items-center">
                                     <a class="flex items-center">
                                       <i data-lucide="presentation" class="w-4 h-4 mr-1"></i>
                                       Pitch Deck
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
                                       Business Plan
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
                                       Valuation
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
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>View</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>Edit</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>Export</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-business-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>View</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>Edit</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>Export</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-financial-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>View</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>Edit</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>Export</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-funding-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>View</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>Edit</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>Export</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-marketing-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>View</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>Edit</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>Export</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-team-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>View</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>Edit</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>Export</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-legal-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>View</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>Edit</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>Export</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-technical-model">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>View</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>Edit</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>Export</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-pitch-deck">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>View</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>Edit</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>Export</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-business-plan-report">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>View</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>Edit</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>Export</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-valuation-report">
                         <li><a><i data-lucide="eye" class="w-4 h-4 mr-1"></i>View</a></li>
                         <li><a><i data-lucide="edit" class="w-4 h-4 mr-1"></i>Edit</a></li>
                         <li><a><i data-lucide="download" class="w-4 h-4 mr-1"></i>Export</a></li>
                       </ul>
                       <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id={`popover-${project.id}`} style={`position-anchor:--anchor-${project.id}`}>
                        <li><a onclick={() => { setEditingProjectId(project.id); setTimeout(() => { const span = document.querySelector(`[data-project-id="${project.id}"]`); if (span) { span.focus(); const range = document.createRange(); range.selectNodeContents(span); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); } }, 0); }}><i data-lucide="edit" class="w-4 h-4"></i>Rename</a></li>
                        <li><a onclick={() => handleDeleteProject(project.id)}><i data-lucide="trash" class="w-4 h-4"></i>Delete</a></li>
                        <li><a onclick={() => window.dispatchEvent(new CustomEvent('openProject', { detail: project.name }))}><i data-lucide="folder-open" class="w-4 h-4"></i>Open</a></li>
                        <li><a onclick={() => alert('Export project: ' + project.name)}><i data-lucide="download" class="w-4 h-4"></i>Export Project</a></li>
                        <li><a onclick={() => alert('Export reports: ' + project.name)}><i data-lucide="file-text" class="w-4 h-4"></i>Export Reports</a></li>
                      </ul>
                    </li>
                  )}
                </For>
                <Show when={filteredProjects().length === 0}>
                  <li class="text-center py-8 px-4">
                    <i data-lucide="folder-x" class="w-12 h-12 mx-auto mb-3 text-gray-400"></i>
                    <div class="text-sm text-gray-500 font-medium mx-auto">{search() ? "No projects match your search." : "No projects yet."}</div>
                    <div class="text-xs text-gray-400 mt-1 mx-auto text-center">{search() ? "Try adjusting your search terms." : "Create your first project to get started!"}</div>
                  </li>
                </Show>
              </ul>
            </details>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;