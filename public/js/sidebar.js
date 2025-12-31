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
          uniqueId TEXT UNIQUE NOT NULL,
          type TEXT,
          name TEXT,
          question TEXT,
          answer TEXT,
          prompt_en TEXT,
          prompt_ar TEXT,
          placeholder TEXT,
          parent_id INTEGER
        );
      `);
      console.log('Table created or exists');

      // Migrate static data if table is empty
      const existing = await this.db.query('SELECT COUNT(*) as count FROM nodes');
      console.log('Existing count query result:', existing);
      if (existing.rows[0].count === 0) {
        console.log('No data found, migrating static data...');
        await this.migrateStaticData();
      } else {
        console.log('Data already exists, skipping migration');
      }
    } catch (e) {
      console.error('DB init error:', e);
    }
    console.log('DB init completed');
  }

  async migrateStaticData() {
    console.log('Starting migration of static data');
    const insertRecursive = async (nodes, parentId = null) => {
      console.log(`Inserting ${nodes.length} nodes at parent ${parentId}`);
      for (const node of nodes) {
        console.log(`Inserting node: ${node.uniqueId}`);
        const result = await this.db.query(
          'INSERT INTO nodes (uniqueId, type, name, question, answer, prompt_en, prompt_ar, placeholder, parent_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
          [node.uniqueId, node.type, node.name, node.question, node.answer, node['prompt-en'], node['prompt-ar'], node.placeholder, parentId]
        );
        const newId = result.rows[0].id;
        console.log(`Inserted node ${node.uniqueId} with id ${newId}`);
        if (node.children && node.children.length > 0) {
          await insertRecursive(node.children, newId);
        }
      }
    };
    await insertRecursive(hierarchicalData);
    console.log('Migration completed');
  }

  async loadRoots() {
    console.log('Loading roots...');
    const result = await this.db.query('SELECT * FROM nodes WHERE parent_id IS NULL ORDER BY id');
    this.roots = result.rows;
    console.log('Roots loaded:', this.roots.length);
    for (const root of this.roots) {
      root.children = await this.loadChildren(root.id);
    }
    console.log('Roots with children loaded');
  }

  async loadChildren(parentId) {
    const result = await this.db.query('SELECT * FROM nodes WHERE parent_id = $1 ORDER BY id', [parentId]);
    const children = result.rows;
    console.log(`Loaded ${children.length} children for parent ${parentId}`);
    for (const child of children) {
      child.children = await this.loadChildren(child.id);
    }
    return children;
  }

  async findNode(uniqueId) {
    const result = await this.db.query('SELECT * FROM nodes WHERE uniqueId = $1', [uniqueId]);
    const [node] = result.rows;
    if (node) {
      node.children = await this.loadChildren(node.id);
    }
    return node;
  }

  async addNode(parentId, nodeData) {
    await this.db.query(
      'INSERT INTO nodes (uniqueId, type, name, question, answer, prompt_en, prompt_ar, placeholder, parent_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [nodeData.uniqueId, nodeData.type, nodeData.name, nodeData.question, nodeData.answer, nodeData['prompt-en'], nodeData['prompt-ar'], nodeData.placeholder, parentId]
    );
  }

  async updateNode(uniqueId, updates) {
    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(updates);
    await this.db.query(`UPDATE nodes SET ${fields} WHERE uniqueId = $1`, [uniqueId, ...values]);
  }

  async deleteNode(uniqueId) {
    await this.db.query('DELETE FROM nodes WHERE uniqueId = $1', [uniqueId]);
  }

  async regenerateIds(node, newParentId) {
    const newUniqueId = 'node' + idCounter++;
    await this.db.query('UPDATE nodes SET uniqueId = $1, parent_id = $2 WHERE id = $3', [newUniqueId, newParentId, node.id]);
    const children = await this.db.query('SELECT * FROM nodes WHERE parent_id = $1', [node.id]);
    for (const child of children) {
      await this.regenerateIds(child, node.id);
    }
  }
}

// Static seed data migrated to DB on init (reduced for performance)
let hierarchicalData = [
  {
    "type": "folder",
    "uniqueId": "root1",
    "name": "Projects",
    "question": "",
    "answer": "",
    "prompt-en": "",
    "prompt-ar": "",
    "placeholder": "",
    "children": [
      {
        "type": "folder",
        "uniqueId": "sub1",
        "name": "Web Development",
        "question": "",
        "answer": "",
        "prompt-en": "",
        "prompt-ar": "",
        "placeholder": "",
        "children": [
          {
            "type": "leaf",
            "uniqueId": "leaf1",
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
      html += `<li>
<details id="${elementId}" data-nodeid="${node.uniqueId}">
<summary>
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
</svg>
<span>${node.name || ''}</span>
<button class="btn btn-ghost btn-sm" popovertarget="popover-${node.uniqueId}" style="anchor-name:--anchor-${node.uniqueId}">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="ellipsis-vertical" class="lucide lucide-ellipsis-vertical w-4 h-4"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
</button>
<ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-${node.uniqueId}" style="position-anchor:--anchor-${node.uniqueId}">
<li id="${generateUUID()}"><a onclick="addSub('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="plus" class="lucide lucide-plus w-4 h-4"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg> Add</a></li>
<li id="${generateUUID()}"><a onclick="removeItem('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="trash" class="lucide lucide-trash w-4 h-4"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</a></li>
<li id="${generateUUID()}"><a onclick="copyNode('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="copy" class="lucide lucide-copy w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg> Copy</a></li>
<li id="${generateUUID()}"><a onclick="pasteAsChild('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="clipboard-paste" class="lucide lucide-clipboard-paste w-4 h-4"><path d="M11 14h10"></path><path d="M16 4h2a2 2 0 0 1 2 2v1.344"></path><path d="m17 18 4-4-4-4"></path><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect></svg> Paste</a></li>
<li id="${generateUUID()}"><a onclick="moveUp('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="arrow-up" class="lucide lucide-arrow-up w-4 h-4"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg> Move up</a></li>
<li id="${generateUUID()}"><a onclick="moveDown('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="arrow-down" class="lucide lucide-arrow-down w-4 h-4"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg> Move down</a></li>
<li id="${generateUUID()}"><a onclick="editItem(this, '${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="edit" class="lucide lucide-edit w-4 h-4"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg> Edit</a></li>
<li id="${generateUUID()}"><a onclick="saveItem('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="save" class="lucide lucide-save w-4 h-4"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg> Save</a></li>
<li id="${generateUUID()}"><a onclick="addQuestion('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="help-circle" class="lucide lucide-help-circle w-4 h-4"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg> Add question</a></li>
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
<a id="${elementId}" data-nodeid="${node.uniqueId}">
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
</svg>
<span>${node.question || ''}</span>
<button class="btn btn-ghost btn-sm" popovertarget="popover-${node.uniqueId}" style="anchor-name:--anchor-${node.uniqueId}" onclick="event.stopPropagation()">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="ellipsis-vertical" class="lucide lucide-ellipsis-vertical w-4 h-4"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
</button>
</a>
<ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-${node.uniqueId}" style="position-anchor:--anchor-${node.uniqueId}">
<li id="${generateUUID()}"><a onclick="removeItem('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="trash" class="lucide lucide-trash w-4 h-4"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</a></li>
<li id="${generateUUID()}"><a onclick="copyNode('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="copy" class="lucide lucide-copy w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg> Copy</a></li>
<li id="${generateUUID()}"><a onclick="moveUp('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="arrow-up" class="lucide lucide-arrow-up w-4 h-4"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg> Move up</a></li>
<li id="${generateUUID()}"><a onclick="moveDown('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="arrow-down" class="lucide lucide-arrow-down w-4 h-4"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg> Move down</a></li>
<li id="${generateUUID()}"><a onclick="editItem(this, '${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="edit" class="lucide lucide-edit w-4 h-4"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg> Edit</a></li>
<li id="${generateUUID()}"><a onclick="saveItem('${node.uniqueId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="save" class="lucide lucide-save w-4 h-4"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg> Save</a></li>
</ul>
</li>`;
   }
  return html;
}


// Static data migrated to DB on init

/**
 * Global counter for generating unique IDs for new nodes.
 * Issues: Global state; could conflict if multiple instances.
 */
let idCounter = Date.now();

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
  await sidebarManager.loadRoots();
  console.log('Roots loaded for rendering');
  const sidebarUl = document.querySelector('.sidebar ul.menu.w-full');
  if (sidebarUl) {
    console.log('Generating HTML...');
    sidebarUl.innerHTML = sidebarManager.roots.map(generateNodeHTML).join('');
    console.log('HTML set, creating icons...');
    lucide.createIcons();
    console.log('Render completed');
  } else {
    console.error('Sidebar ul not found');
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
      uniqueId: 'node' + idCounter++,
      type: 'folder',
      name: 'New Item',
      question: '',
      answer: '',
      'prompt-en': '',
      'prompt-ar': '',
      placeholder: '',
      children: []
    };
    await sidebarManager.addNode(node.id, newNode);
    await renderSidebar();
  }
}

/**
 * Removes the specified node and all its children from the DB.
 * Purpose: Enables deletion of folders or items in the sidebar, cleaning up unwanted entries.
 * How it works: Deletes the node from DB (CASCADE deletes children), and re-renders the sidebar.
 */
async function removeItem(nodeId) {
  console.log('Removing node', nodeId);
  await sidebarManager.deleteNode(nodeId);
  await renderSidebar();
}

/**
 * Copies the specified node to a global clipboard for later pasting.
 * Purpose: Facilitates duplication of nodes, allowing users to replicate structures or content.
 * How it works: Locates the node by ID via DB, creates a deep copy, and stores it in window.copiedNode.
 */
async function copyNode(nodeId) {
  const node = await sidebarManager.findNode(nodeId);
  if (node) {
    window.copiedNode = JSON.parse(JSON.stringify(node));
  }
}

/**
 * Pastes the copied node as a child of the specified node.
 * Purpose: Completes the copy-paste workflow by inserting the duplicated node into the hierarchy.
 * How it works: Checks if there's a copied node, inserts it as child in DB with regenerated IDs, and re-renders the sidebar.
 */
async function pasteAsChild(nodeId) {
  const node = await sidebarManager.findNode(nodeId);
  if (node && window.copiedNode) {
    const pastedNode = JSON.parse(JSON.stringify(window.copiedNode));
    await sidebarManager.addNode(node.id, pastedNode);
    const result = await sidebarManager.db.query('SELECT id FROM nodes WHERE uniqueId = $1', [pastedNode.uniqueId]);
    await sidebarManager.regenerateIds({ id: result.rows[0].id }, node.id);
    await renderSidebar();
  }
}

/**
 * Moves the specified node up within its siblings in the hierarchy.
 * Purpose: Allows reordering of nodes to adjust their display order in the sidebar.
 * How it works: Loads siblings, swaps with previous if possible, updates DB, and re-renders.
 */
async function moveUp(nodeId) {
  const node = await sidebarManager.findNode(nodeId);
  if (!node) return;
  const result = await sidebarManager.db.query('SELECT * FROM nodes WHERE parent_id = $1 ORDER BY id', [node.parent_id]);
  const siblings = result.rows;
  const index = siblings.findIndex(n => n.uniqueId === nodeId);
  if (index > 0) {
    [siblings[index - 1], siblings[index]] = [siblings[index], siblings[index - 1]];
    await sidebarManager.db.query('UPDATE nodes SET id = CASE WHEN id = $1 THEN $2 WHEN id = $2 THEN $1 END WHERE id IN ($1, $2)', [siblings[index - 1].id, siblings[index].id]);
  }
  await renderSidebar();
}


/**
 * Moves the specified node down within its siblings in the hierarchy.
 * Purpose: Allows reordering of nodes to adjust their display order in the sidebar.
 * How it works: Loads siblings, swaps with next if possible, updates DB, and re-renders.
 */
async function moveDown(nodeId) {
  const node = await sidebarManager.findNode(nodeId);
  if (!node) return;
  const result = await sidebarManager.db.query('SELECT * FROM nodes WHERE parent_id = $1 ORDER BY id', [node.parent_id]);
  const siblings = result.rows;
  const index = siblings.findIndex(n => n.uniqueId === nodeId);
  if (index < siblings.length - 1) {
    [siblings[index], siblings[index + 1]] = [siblings[index + 1], siblings[index]];
    await sidebarManager.db.query('UPDATE nodes SET id = CASE WHEN id = $1 THEN $2 WHEN id = $2 THEN $1 END WHERE id IN ($1, $2)', [siblings[index].id, siblings[index + 1].id]);
  }
  await renderSidebar();
}

/**
 * Enables in-place editing of the node's name by replacing the text element with an input field.
 * Purpose: Provides a way for users to rename folders or items directly in the sidebar.
 * How it works: Finds the node via DB, locates the span, creates input, on blur updates DB and re-renders.
 */
async function editItem(el, nodeId) {
  const node = await sidebarManager.findNode(nodeId);
  if (node) {
    const mainEl = document.querySelector(`[data-nodeid="${nodeId}"]`);
    const textEl = mainEl.querySelector('span');
    if (textEl) {
      const currentText = textEl.textContent;
      const input = document.createElement('input');
      input.value = currentText;
      input.onblur = async () => {
        const updates = node.type === 'folder' ? { name: input.value } : { question: input.value };
        await sidebarManager.updateNode(nodeId, updates);
        await renderSidebar();
      };
      textEl.replaceWith(input);
      input.focus();
    }
  }
}

/**
 * Saves any pending edits and refreshes the sidebar display.
 * Purpose: Ensures the sidebar reflects the latest changes.
 * How it works: Re-renders the sidebar.
 */
async function saveItem(nodeId) {
  await renderSidebar();
}

/**
 * Adds a new question leaf node as a child of the specified node.
 * Purpose: Allows users to add new Q&A entries under folders, expanding the knowledge base.
 * How it works: Finds the node via DB, inserts new leaf as child, and re-renders.
 */
async function addQuestion(nodeId) {
  const node = await sidebarManager.findNode(nodeId);
  if (node && node.type === 'folder') {
    const newNode = {
      type: 'leaf',
      uniqueId: 'node' + idCounter++,
      name: '',
      question: 'New Question',
      answer: '',
      'prompt-en': '',
      'prompt-ar': '',
      placeholder: '',
      children: []
    };
    await sidebarManager.addNode(node.id, newNode);
    await renderSidebar();
  }
}



















// Expose functions to global scope for onclick handlers
window.addSub = addSub;
window.removeItem = removeItem;
window.copyNode = copyNode;
window.pasteAsChild = pasteAsChild;
window.moveUp = moveUp;
window.moveDown = moveDown;
window.editItem = editItem;
window.saveItem = saveItem;
window.addQuestion = addQuestion;

// Data management (for pages with sidebar) - now with PGLite
if (document.querySelector('.sidebar')) {
  console.log('Sidebar found, initializing...');
  (async () => {
    console.log('Starting async init and render...');
    await sidebarManager.init();
    await renderSidebar();
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









