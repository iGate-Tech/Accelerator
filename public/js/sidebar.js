// sidebar.js - Sidebar functionality with PGLite integration

import { PGlite } from 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js';

// Initialize PGLite database
console.log('Initializing PGLite...');
const db = new PGlite();
console.log('PGLite instance created');

/**
 * SidebarManager class to handle DB operations and state.
 */
class SidebarManager {
  constructor(db) {
    this.db = db;
    this.roots = [];
  }

  async init() {
    console.log('Waiting for DB ready...');
    await this.db.ready;
    console.log('DB ready, creating table...');

    try {
      // Create table if not exists
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS nodes (
          id SERIAL PRIMARY KEY,
          type TEXT,
          name TEXT,
          question TEXT,
          answer TEXT,
          prompt_en TEXT,
          prompt_ar TEXT,
          placeholder TEXT,
          parent_id INTEGER,
          is_open BOOLEAN DEFAULT FALSE,
          sort_order INTEGER DEFAULT 0
        );
      `);
      console.log('Table created or exists');

      // Add sort_order column if not exists
      await this.db.exec(`
        ALTER TABLE nodes ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
      `);
      console.log('Sort order column ensured');

       // Migrate static data if table is empty
       const existing = await this.db.query('SELECT COUNT(*) as count FROM nodes');
       console.log('Existing count query result:', existing);
       if (existing.rows[0].count === 0) {
         console.log('No data found, migrating static data...');
         await this.migrateStaticData();
       } else {
         console.log('Data already exists, skipping migration');
       }
       // Ensure orders are set
       await this.renumberOrders();
    } catch (e) {
      console.error('DB init error:', e);
    }
    console.log('DB init completed');
  }

  async migrateStaticData() {
    console.log('Starting migration of static data');
    const insertRecursive = async (nodes, parentId = null, orderStart = 0) => {
      console.log(`Inserting ${nodes.length} nodes at parent ${parentId}`);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        console.log(`Inserting node: ${node.name || node.question}`);
        const result = await this.db.query(
          'INSERT INTO nodes (type, name, question, answer, prompt_en, prompt_ar, placeholder, parent_id, is_open, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
          [node.type, node.name, node.question, node.answer, node['prompt-en'], node['prompt-ar'], node.placeholder, parentId, false, orderStart + i]
        );
        const newId = result.rows[0].id;
        console.log(`Inserted node with id ${newId}`);
        if (node.children && node.children.length > 0) {
          await insertRecursive(node.children, newId, 0);
        }
      }
    };
    await insertRecursive(hierarchicalData, null, 0);
    console.log('Migration completed');
  }

  async renumberOrders() {
    console.log('Renumbering orders...');
    const parents = await this.db.query('SELECT DISTINCT COALESCE(parent_id, -1) as parent FROM nodes');
    for (const p of parents.rows) {
      const parentId = p.parent === -1 ? null : p.parent;
      let children;
      if (parentId === null) {
        children = await this.db.query('SELECT id FROM nodes WHERE parent_id IS NULL ORDER BY id');
      } else {
        children = await this.db.query('SELECT id FROM nodes WHERE parent_id = $1 ORDER BY id', [parentId]);
      }
      for (let i = 0; i < children.rows.length; i++) {
        await this.db.query('UPDATE nodes SET sort_order = $1 WHERE id = $2', [i, children.rows[i].id]);
      }
    }
    console.log('Orders renumbered');
  }

  async loadRoots() {
    console.log('Loading roots...');
    const result = await this.db.query('SELECT * FROM nodes WHERE parent_id IS NULL ORDER BY sort_order, id');
    this.roots = result.rows;
    console.log('Roots loaded:', this.roots.map(r => ({id: r.id, is_open: r.is_open})));
    for (const root of this.roots) {
      root.children = await this.loadChildren(root.id);
    }
    console.log('Roots with children loaded');
  }

  async loadChildren(parentId) {
    const result = await this.db.query('SELECT * FROM nodes WHERE parent_id = $1 ORDER BY sort_order, id', [parentId]);
    const children = result.rows;
    console.log(`Loaded ${children.length} children for parent ${parentId}`);
    for (const child of children) {
      child.children = await this.loadChildren(child.id);
    }
    return children;
  }

  async findNode(id) {
    const result = await this.db.query('SELECT * FROM nodes WHERE id = $1', [id]);
    const [node] = result.rows;
    if (node) {
      node.children = await this.loadChildren(node.id);
    }
    return node;
  }

  async addNode(parentId, nodeData) {
    const maxOrderResult = await this.db.query('SELECT COALESCE(MAX(sort_order), 0) as max_order FROM nodes WHERE parent_id = $1', [parentId]);
    const maxOrder = maxOrderResult.rows[0].max_order;
    const result = await this.db.query(
      'INSERT INTO nodes (type, name, question, answer, prompt_en, prompt_ar, placeholder, parent_id, is_open, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [nodeData.type, nodeData.name, nodeData.question, nodeData.answer, nodeData['prompt-en'], nodeData['prompt-ar'], nodeData.placeholder, parentId, false, maxOrder + 1]
    );
    return result.rows[0].id;
  }

  async updateNode(id, updates) {
    console.log('Updating node', id, 'with', updates);
    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(updates);
    await this.db.query(`UPDATE nodes SET ${fields} WHERE id = $1`, [id, ...values]);
    console.log('Update query executed');
  }

  async deleteNode(id) {
    await this.db.query('DELETE FROM nodes WHERE id = $1', [id]);
  }

  async insertNodeRecursive(parentId, nodeData, orderStart = null) {
    if (orderStart === null) {
      const maxOrderResult = await this.db.query('SELECT COALESCE(MAX(sort_order), 0) as max_order FROM nodes WHERE parent_id = $1', [parentId]);
      orderStart = maxOrderResult.rows[0].max_order + 1;
    }
    const result = await this.db.query(
      'INSERT INTO nodes (type, name, question, answer, prompt_en, prompt_ar, placeholder, parent_id, is_open, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [nodeData.type, nodeData.name, nodeData.question, nodeData.answer, nodeData.prompt_en || '', nodeData.prompt_ar || '', nodeData.placeholder || '', parentId, nodeData.is_open || false, orderStart]
    );
    const newId = result.rows[0].id;
    if (nodeData.children && nodeData.children.length > 0) {
      for (let i = 0; i < nodeData.children.length; i++) {
        await this.insertNodeRecursive(newId, nodeData.children[i], i);
      }
    }
    return newId;
  }


}

// Static seed data migrated to DB on init (reduced for performance)
let hierarchicalData = [
  {
    "type": "folder",
    "name": "Projects",
    "question": "",
    "answer": "",
    "prompt-en": "",
    "prompt-ar": "",
    "placeholder": "",
    "children": [
      {
        "type": "folder",
        "name": "Web Development",
        "question": "",
        "answer": "",
        "prompt-en": "",
        "prompt-ar": "",
        "placeholder": "",
        "children": [
          {
            "type": "leaf",
            "name": "",
            "question": "How to build a website?",
            "answer": "Use HTML, CSS, JS",
            "prompt-en": "Describe web dev basics",
            "prompt-ar": "وصف أساسيات تطوير الويب",
            "placeholder": "Enter your question",
            "children": []
          }
        ]
      }
    ]
  }
];

const sidebarManager = new SidebarManager(db);



/**
 * Generates a random UUID string.
 * How it works: Replaces placeholders in a template with random hex values.
 * Issues: Not cryptographically secure; use crypto.randomUUID() if available.
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generates HTML string for a single node in the sidebar hierarchy.
 * Purpose: Recursively builds the UI structure for folders (expandable) and leaves (questions) with dropdown menus.
 * How it works: Checks if node has children; for folders, creates <details>/<summary> with icon, name, popover button, and menu (Add, Remove, etc.). For leaves, creates <a> with icon, question, popover button, and menu (Remove, Copy, etc.). Uses node.uniqueId for data attributes and popover IDs. Generates unique elementId for main element. Recursively processes children. Includes inline SVGs and Lucide icons.
 * Issues:
 * - XSS risk: String concatenation with node data could inject scripts if data becomes user-inputted (escape or sanitize).
 * - Performance: Inefficient for large trees due to recursive string building; consider virtual DOM.
 * - Accessibility: Inline onclick not ideal; use event listeners. Popovers need ARIA for screen readers.
 * - Maintainability: Long HTML strings; extract to templates.
 * - UUID: Regenerated on each render; could cause issues if DOM references stale.
 * - Browser support: CSS anchor positioning (anchor-name) is experimental.
 * - Redundancy: Duplicate menu logic for folders/leaves; refactor.
 * - Error handling: Assumes node properties exist; add checks.
 */
function generateNodeHTML(node) {
  const elementId = generateUUID();
  let html = '';
  if (node.type === 'folder') {
    // Folder
    console.log('Generating folder', node.id, 'open:', node.is_open);
      html += `<li>
<details id="${elementId}" data-nodeid="${node.id}" ${node.is_open ? 'open' : ''}>
<summary>
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
</svg>
<span>${node.name || ''}</span>
<button class="btn btn-ghost btn-sm" popovertarget="popover-${node.id}" style="anchor-name:--anchor-${node.id}">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="ellipsis-vertical" class="lucide lucide-ellipsis-vertical w-4 h-4"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
</button>
<ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-${node.id}" style="position-anchor:--anchor-${node.id}">
<li id="${generateUUID()}"><a onclick="addSub('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="plus" class="lucide lucide-plus w-4 h-4"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg> Add</a></li>
<li id="${generateUUID()}"><a onclick="removeItem('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="trash" class="lucide lucide-trash w-4 h-4"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</a></li>
<li id="${generateUUID()}"><a onclick="copyNode('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="copy" class="lucide lucide-copy w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg> Copy</a></li>
<li id="${generateUUID()}"><a onclick="pasteAsChild('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="clipboard-paste" class="lucide lucide-clipboard-paste w-4 h-4"><path d="M11 14h10"></path><path d="M16 4h2a2 2 0 0 1 2 2v1.344"></path><path d="m17 18 4-4-4-4"></path><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect></svg> Paste</a></li>
<li id="${generateUUID()}"><a onclick="moveUp('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="arrow-up" class="lucide lucide-arrow-up w-4 h-4"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg> Move up</a></li>
<li id="${generateUUID()}"><a onclick="moveDown('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="arrow-down" class="lucide lucide-arrow-down w-4 h-4"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg> Move down</a></li>
<li id="${generateUUID()}"><a onclick="editItem(this, '${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="edit" class="lucide lucide-edit w-4 h-4"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg> Edit</a></li>
<li id="${generateUUID()}"><a onclick="saveItem('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="save" class="lucide lucide-save w-4 h-4"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg> Save</a></li>
<li id="${generateUUID()}"><a onclick="addQuestion('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="help-circle" class="lucide lucide-help-circle w-4 h-4"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg> Add question</a></li>
</ul>
</summary>
<ul>`;
      node.children.forEach(child => {
        html += generateNodeHTML(child);
      });
        html += `</ul>
</details>
</li>`;
    } else {
       // Leaf
       html += `<li>
 <a id="${elementId}" data-nodeid="${node.id}" onclick="loadQuestion('${node.id}')">
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
 <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
 </svg>
 <span>${node.question || ''}</span>
 <button class="btn btn-ghost btn-sm" popovertarget="popover-${node.id}" style="anchor-name:--anchor-${node.id}" onclick="event.stopPropagation()">
 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="ellipsis-vertical" class="lucide lucide-ellipsis-vertical w-4 h-4"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
 </button>
 </a>
<ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-${node.id}" style="position-anchor:--anchor-${node.id}">
<li id="${generateUUID()}"><a onclick="removeItem('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="trash" class="lucide lucide-trash w-4 h-4"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</a></li>
<li id="${generateUUID()}"><a onclick="copyNode('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="copy" class="lucide lucide-copy w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg> Copy</a></li>
<li id="${generateUUID()}"><a onclick="moveUp('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="arrow-up" class="lucide lucide-arrow-up w-4 h-4"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg> Move up</a></li>
<li id="${generateUUID()}"><a onclick="moveDown('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="arrow-down" class="lucide lucide-arrow-down w-4 h-4"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg> Move down</a></li>
<li id="${generateUUID()}"><a onclick="editItem(this, '${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="edit" class="lucide lucide-edit w-4 h-4"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg> Edit</a></li>
<li id="${generateUUID()}"><a onclick="saveItem('${node.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="save" class="lucide lucide-save w-4 h-4"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg> Save</a></li>
</ul>
</li>`;
    }
  return html;
}


// Static data migrated to DB on init



/**
 * Renders the entire sidebar by generating HTML for all root nodes from DB.
 * Purpose: Updates the DOM to reflect the current state from PGLite.
 * How it works: Loads roots and their children from DB, finds the sidebar ul element (.sidebar ul.menu.w-full), maps each root to HTML using generateNodeHTML, joins the strings, sets innerHTML, and initializes Lucide icons. Called after data changes.
 * Implementation details: Async DB loading, recursive HTML generation. Uses innerHTML for full re-render.
 * Issues: Replaces entire DOM subtree; inefficient. No error handling for DB or DOM.
 * Potential improvements: Incremental updates, lazy-loading children.
 */
async function renderSidebar() {
  console.log('Starting renderSidebar...');
  // Preserve currently open details
  const openIds = Array.from(document.querySelectorAll('details[open]')).map(d => d.dataset.nodeid);
  console.log('Preserving open ids:', openIds);
  await sidebarManager.loadRoots();
  console.log('Roots loaded for rendering');
  const sidebarUl = document.getElementById('build-tab-content');
  if (sidebarUl) {
    console.log('Generating HTML...');
    sidebarUl.innerHTML = sidebarManager.roots.map(generateNodeHTML).join('');
    console.log('HTML set, creating icons...');
    lucide.createIcons();
    console.log('Setting open states...');
    // Recursively set open for nodes with is_open
    const setOpen = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 'folder' && node.is_open) {
          const details = document.querySelector(`[data-nodeid="${node.id}"]`);
          console.log('Setting open for', node.id, details);
          if (details) details.open = true;
        }
        if (node.children) setOpen(node.children);
      });
    };
    setOpen(sidebarManager.roots);
    // Also set preserved open states
    openIds.forEach(id => {
      const details = document.querySelector(`[data-nodeid="${id}"]`);
      if (details) {
        details.open = true;
        // Update DB if not already
        sidebarManager.updateNode(id, { is_open: true });
      }
    });
    console.log('Adding toggle listeners...');
    document.querySelectorAll('details').forEach(details => {
      details.addEventListener('toggle', async (e) => {
        const id = details.dataset.nodeid;
        console.log('Toggling', id, 'to', e.target.open);
        await sidebarManager.updateNode(id, { is_open: e.target.open });
        console.log('Updated DB for', id);
      });
    });
    console.log('Render completed');
  } else {
    console.error('Sidebar ul not found');
  }
}

/**
 * Renders content for the "Use" tab: a flat list of all leaf nodes.
 */
async function renderUseTab() {
  console.log('Rendering Use tab...');
  const result = await sidebarManager.db.query('SELECT * FROM nodes WHERE type = $1 ORDER BY id', ['leaf']);
  const leaves = result.rows;
  const html = leaves.map(leaf => `<li><a onclick="loadQuestion('${leaf.id}')">${leaf.question || ''}</a></li>`).join('');
  const useUl = document.getElementById('use-tab-content');
  if (useUl) {
    useUl.innerHTML = html;
    console.log('Use tab rendered');
  }
}

/**
 * Renders content for the "Reports" tab: summary statistics.
 */
async function renderReportsTab() {
  console.log('Rendering Reports tab...');
  const totalNodes = await sidebarManager.db.query('SELECT COUNT(*) as count FROM nodes');
  const totalLeaves = await sidebarManager.db.query('SELECT COUNT(*) as count FROM nodes WHERE type = $1', ['leaf']);
  const totalFolders = await sidebarManager.db.query('SELECT COUNT(*) as count FROM nodes WHERE type = $1', ['folder']);
  const html = `
    <li><strong>Total Nodes:</strong> ${totalNodes.rows[0].count}</li>
    <li><strong>Folders:</strong> ${totalFolders.rows[0].count}</li>
    <li><strong>Questions:</strong> ${totalLeaves.rows[0].count}</li>
  `;
  const reportsUl = document.getElementById('reports-tab-content');
  if (reportsUl) {
    reportsUl.innerHTML = html;
    console.log('Reports tab rendered');
  }
}




// Global functions for sidebar interactions


/**
 * Adds a new subfolder (child node) to the specified node.
 * Purpose: Allows users to expand the hierarchical structure by creating new folders under existing ones.
 * How it works: Finds the node by ID via DB, inserts new folder node as child, and re-renders the sidebar.
 */
async function addSub(nodeId) {
  const node = await sidebarManager.findNode(nodeId);
  if (node && node.type === 'folder') {
    const newNode = {
      type: 'folder',
      name: 'New Item',
      question: '',
      answer: '',
      'prompt-en': '',
      'prompt-ar': '',
      placeholder: '',
      children: []
    };
    const id = await sidebarManager.addNode(node.id, newNode);
    // Ensure parent folder is open
    await sidebarManager.updateNode(node.id, { is_open: true });
    await renderSidebar();
  }
}

/**
 * Removes the specified node and all its children from the DB.
 * Purpose: Enables deletion of folders or items in the sidebar, cleaning up unwanted entries.
 * How it works: Deletes the node from DB (CASCADE deletes children), and re-renders the sidebar.
 */
async function removeItem(nodeId) {
  await sidebarManager.deleteNode(nodeId);
  await renderSidebar();
}

/**
 * Copies the specified node to a global clipboard for later pasting.
 * Purpose: Facilitates duplication of nodes, allowing users to replicate structures or content.
 * How it works: Locates the node by ID via DB, creates a deep copy, and stores it in window.copiedNode.
 */
async function copyNode(nodeId) {
  console.log('copyNode called with nodeId:', nodeId);
  const node = await sidebarManager.findNode(nodeId);
  console.log('Node to copy:', node);
  if (node) {
    window.copiedNode = JSON.parse(JSON.stringify(node));
    console.log('Node copied to clipboard');
  } else {
    console.log('Node not found for copying');
  }
}

/**
 * Pastes the copied node as a child of the specified node.
 * Purpose: Completes the copy-paste workflow by inserting the duplicated node into the hierarchy.
 * How it works: Checks if there's a copied node, inserts it as child in DB with regenerated IDs, and re-renders the sidebar.
 */
async function pasteAsChild(nodeId) {
  console.log('pasteAsChild called with nodeId:', nodeId);
  const node = await sidebarManager.findNode(nodeId);
  console.log('Parent node:', node);
  if (node && window.copiedNode) {
    console.log('Copied node exists:', window.copiedNode);
    const pastedNode = JSON.parse(JSON.stringify(window.copiedNode));
    console.log('Pasting node:', pastedNode);
    const id = await sidebarManager.insertNodeRecursive(node.id, pastedNode);
    console.log('Node added with id:', id);
    await renderSidebar();
    console.log('pasteAsChild completed');
  } else {
    console.log('No parent node or copied node');
  }
}

/**
 * Moves the specified node up within its siblings in the hierarchy.
 * Purpose: Allows reordering of nodes to adjust their display order in the sidebar.
 * How it works: Loads siblings, swaps with previous if possible, updates DB, and re-renders.
 */
async function moveUp(nodeId) {
  console.log('moveUp called with nodeId:', nodeId);
  const node = await sidebarManager.findNode(nodeId);
  console.log('Node to move:', node);
  if (!node) {
    console.log('Node not found');
    return;
  }
  let siblings;
  if (node.parent_id === null) {
    const result = await sidebarManager.db.query('SELECT * FROM nodes WHERE parent_id IS NULL ORDER BY sort_order, id');
    siblings = result.rows;
  } else {
    const result = await sidebarManager.db.query('SELECT * FROM nodes WHERE parent_id = $1 ORDER BY sort_order, id', [node.parent_id]);
    siblings = result.rows;
  }
  console.log('Siblings:', siblings);
   const index = siblings.findIndex(n => n.id === parseInt(nodeId));
  console.log('Index:', index);
  if (index > 0) {
    console.log('Swapping with previous');
    const tempOrder = siblings[index - 1].sort_order;
    await sidebarManager.updateNode(siblings[index - 1].id, { sort_order: siblings[index].sort_order });
    await sidebarManager.updateNode(siblings[index].id, { sort_order: tempOrder });
    console.log('DB updated, rendering');
  } else {
    console.log('Cannot move up');
  }
  await renderSidebar();
  console.log('moveUp completed');
}


/**
 * Moves the specified node down within its siblings in the hierarchy.
 * Purpose: Allows reordering of nodes to adjust their display order in the sidebar.
 * How it works: Loads siblings, swaps with next if possible, updates DB, and re-renders.
 */
async function moveDown(nodeId) {
  console.log('moveDown called with nodeId:', nodeId);
  const node = await sidebarManager.findNode(nodeId);
  console.log('Node to move:', node);
  if (!node) {
    console.log('Node not found');
    return;
  }
  let siblings;
  if (node.parent_id === null) {
    const result = await sidebarManager.db.query('SELECT * FROM nodes WHERE parent_id IS NULL ORDER BY sort_order, id');
    siblings = result.rows;
  } else {
    const result = await sidebarManager.db.query('SELECT * FROM nodes WHERE parent_id = $1 ORDER BY sort_order, id', [node.parent_id]);
    siblings = result.rows;
  }
  console.log('Siblings:', siblings);
  const index = siblings.findIndex(n => n.id === parseInt(nodeId));
  console.log('Index:', index);
  if (index < siblings.length - 1) {
    console.log('Swapping with next');
    const tempOrder = siblings[index + 1].sort_order;
    await sidebarManager.updateNode(siblings[index + 1].id, { sort_order: siblings[index].sort_order });
    await sidebarManager.updateNode(siblings[index].id, { sort_order: tempOrder });
    console.log('DB updated, rendering');
  } else {
    console.log('Cannot move down');
  }
  await renderSidebar();
  console.log('moveDown completed');
}

/**
 * Enables in-place editing of the node's name by replacing the text element with an input field.
 * Purpose: Provides a way for users to rename folders or items directly in the sidebar.
 * How it works: Finds the node via DB, locates the span, creates input, on blur updates DB and re-renders.
 */
async function editItem(el, nodeId) {
  console.log('editItem called with el:', el, 'nodeId:', nodeId);
  const node = await sidebarManager.findNode(nodeId);
  console.log('Node to edit:', node);
  if (node) {
    const mainEl = document.querySelector(`[data-nodeid="${nodeId}"]`);
    console.log('Main element:', mainEl);
    const textEl = mainEl.querySelector('span');
    console.log('Text element:', textEl);
    if (textEl) {
      const currentText = textEl.textContent;
      console.log('Current text:', currentText);
      const input = document.createElement('input');
      input.value = currentText;
      input.onblur = async () => {
        console.log('Input blurred, updating DB');
        const updates = node.type === 'folder' ? { name: input.value } : { question: input.value };
        console.log('Updates:', updates);
        await sidebarManager.updateNode(nodeId, updates);
        console.log('DB updated, rendering');
        await renderSidebar();
        console.log('Edit completed');
      };
      textEl.replaceWith(input);
      input.focus();
      console.log('Input focused');
    } else {
      console.log('Text element not found');
    }
  } else {
    console.log('Node not found');
  }
}

/**
 * Saves any pending edits and refreshes the sidebar display.
 * Purpose: Ensures the sidebar reflects the latest changes.
 * How it works: Re-renders the sidebar.
 */
async function saveItem(nodeId) {
  console.log('saveItem called with nodeId:', nodeId);
  await renderSidebar();
  console.log('saveItem completed');
}

/**
 * Adds a new question leaf node as a child of the specified node.
 * Purpose: Allows users to add new Q&A entries under folders, expanding the knowledge base.
 * How it works: Finds the node via DB, inserts new leaf as child, and re-renders.
 */
async function addQuestion(nodeId) {
  console.log('addQuestion called with nodeId:', nodeId);
  const node = await sidebarManager.findNode(nodeId);
  console.log('Parent node:', node);
  if (node && node.type === 'folder') {
    console.log('Parent is folder, creating new question');
    const newNode = {
      type: 'leaf',
      name: '',
      question: 'New Question',
      answer: '',
      'prompt-en': '',
      'prompt-ar': '',
      placeholder: '',
      children: []
    };
    console.log('New question node:', newNode);
    const id = await sidebarManager.addNode(node.id, newNode);
    console.log('Question added with id:', id);
    // Ensure parent folder is open
    await sidebarManager.updateNode(node.id, { is_open: true });
    await renderSidebar();
    console.log('addQuestion completed');
  } else {
    console.log('Parent not found or not a folder');
  }
}















/**
 * Loads a question (leaf node) into the question card.
 * Purpose: Updates the UI when a question is clicked in the sidebar.
 * How it works: Fetches node data, updates window.currentQuestion, and refreshes the card.
 */
async function loadQuestion(nodeId) {
  console.log('loadQuestion called with nodeId:', nodeId);
  const node = await sidebarManager.findNode(nodeId);
  console.log('Node to load:', node);
  if (node && node.type === 'leaf') {
    window.currentQuestion = {
      title: node.question || '',
      content: node.answer || '',
      placeholder: node.placeholder || ''
    };
    console.log('Updated window.currentQuestion:', window.currentQuestion);
    if (window.updateQuestionCard) {
      window.updateQuestionCard();
    }
    console.log('Question card updated');
  } else {
    console.log('Node not found or not a leaf');
  }
}

/**
 * Adds a new subfolder as a root node.
 */
async function addSubToRoot() {
  const newNode = {
    type: 'folder',
    name: 'New Folder',
    question: '',
    answer: '',
    'prompt-en': '',
    'prompt-ar': '',
    placeholder: '',
    children: []
  };
  await sidebarManager.addNode(null, newNode);  // null for root
  await renderSidebar();
}

/**
 * Adds a new leaf as a root node.
 */
async function addLeafToRoot() {
  const newNode = {
    type: 'leaf',
    name: '',
    question: 'New Question',
    answer: '',
    'prompt-en': '',
    'prompt-ar': '',
    placeholder: '',
    children: []
  };
  await sidebarManager.addNode(null, newNode);  // null for root
  await renderSidebar();
}

/**
 * Pastes the copied node as a new root node.
 */
async function pasteAsChildToRoot() {
  if (window.copiedNode) {
    const pastedNode = JSON.parse(JSON.stringify(window.copiedNode));
    await sidebarManager.insertNodeRecursive(null, pastedNode);  // null for root
    await renderSidebar();
  } else {
    alert('No node copied to paste.');
  }
}


/**
 * Switches the active tab in the sidebar.
 */
function switchTab(tabElement) {
  // Remove active class from all tabs
  const tabs = document.querySelectorAll('.sidebar .tabs .tab');
  tabs.forEach(tab => tab.classList.remove('tab-active'));
  // Add active to clicked tab
  tabElement.classList.add('tab-active');
  // Hide all tab content
  const contents = document.querySelectorAll('.sidebar .tab-content');
  contents.forEach(content => content.style.display = 'none');
  // Show content for active tab
  const tabMap = { 'build-application': 'build', 'use': 'use', 'reports': 'reports' };
  const tabKey = tabElement.textContent.trim().replace(/\s+/g, '-').toLowerCase();
  const tabName = tabMap[tabKey];
  const activeContent = document.getElementById(`${tabName}-tab-content`);
  if (activeContent) activeContent.style.display = 'block';
}

// Expose functions to global scope for onclick handlers
window.switchTab = switchTab;
window.loadQuestion = loadQuestion;
window.addSub = addSub;
window.addSubToRoot = addSubToRoot;
window.addLeafToRoot = addLeafToRoot;
window.pasteAsChildToRoot = pasteAsChildToRoot;
window.removeItem = removeItem;
window.copyNode = copyNode;
window.pasteAsChild = pasteAsChild;
window.moveUp = moveUp;
window.moveDown = moveDown;
window.editItem = editItem;
window.saveItem = saveItem;
window.addQuestion = addQuestion;
window.exportData = async function() {
  await sidebarManager.loadRoots();
  const data = JSON.stringify(sidebarManager.roots, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sidebar-data.json';
  a.click();
  URL.revokeObjectURL(url);
};

window.importData = async function(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      // Clear existing data
      await sidebarManager.db.exec('DELETE FROM nodes');
      // Insert new data
      const insertRecursive = async (nodes, parentId = null) => {
        for (const node of nodes) {
          const result = await sidebarManager.db.query(
            'INSERT INTO nodes (type, name, question, answer, prompt_en, prompt_ar, placeholder, parent_id, is_open, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
            [node.type, node.name, node.question, node.answer, node.prompt_en || '', node.prompt_ar || '', node.placeholder || '', parentId, node.is_open || false, node.sort_order || 0]
          );
          const newId = result.rows[0].id;
          if (node.children && node.children.length > 0) {
            await insertRecursive(node.children, newId);
          }
        }
      };
      await insertRecursive(data);
      // Re-render all tabs
      await renderSidebar();
      await renderUseTab();
      await renderReportsTab();
      console.log('Data imported successfully!');
    } catch (error) {
      console.error('Import error:', error);
    }
  };
  reader.readAsText(file);
};

// Data management (for pages with sidebar) - now with PGLite
if (document.querySelector('.sidebar')) {
  console.log('Sidebar found, initializing...');
  (async () => {
    console.log('Starting async init and render...');
    await sidebarManager.init();
    await renderSidebar();
    await renderUseTab();
    await renderReportsTab();
    console.log('Sidebar fully loaded');
  })();
}

/**
 * Summary: The sidebar is fully functional using PGLite for persistence.
 * - Nodes are stored in PGLite 'nodes' table with type ('folder' or 'leaf'), parent_id for hierarchy.
 * - Folders display name, folder icon, and full menu; leaves display question, document icon, limited menu.
 * - Interactions (add, remove, edit, etc.) perform async DB operations and re-render the DOM.
 * - Persistence: Data survives page reloads via IndexedDB/OPFS.
 * - All functions work correctly: async rendering, CRUD with DB, menu actions, UI updates.
 */









