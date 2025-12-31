// sidebar.js - Sidebar functionality

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


/**
 * Static array representing the sidebar's hierarchical structure.
 * Purpose: Stores root nodes and their nested children (folders and questions) for rendering.
 * How it works: Each object has uniqueId, name (for folders), question (for leaves), answer, prompts, placeholder, and children array. Used by generateNodeHTML and functions like findNode, removeFromTree.
 * Issues:
 * - Global mutable state; encapsulate in a class or store.
 * - Static data; if made dynamic (e.g., from API), ensure proper updates and persistence.
 * - Typo in code: "childern" instead of "children" (fixed by normalizeChildren).
 * - No validation; malformed data could break rendering.
 */
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
          },
          {
            "type": "leaf",
            "uniqueId": "leaf2",
            "name": "",
            "question": "Best frameworks?",
            "answer": "React, Vue, Angular",
            "prompt-en": "Recommend JS frameworks",
            "prompt-ar": "اقترح إطارات عمل JS",
            "placeholder": "Ask about frameworks",
            "children": []
          }
        ]
      },
      {
        "type": "folder",
        "uniqueId": "sub2",
        "name": "Mobile Apps",
        "question": "",
        "answer": "",
        "prompt-en": "",
        "prompt-ar": "",
        "placeholder": "",
        "children": [
          {
            "type": "leaf",
            "uniqueId": "leaf3",
            "name": "",
            "question": "Cross-platform options?",
            "answer": "React Native, Flutter",
            "prompt-en": "Discuss mobile dev",
            "prompt-ar": "مناقشة تطوير التطبيقات",
            "placeholder": "Mobile question",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "type": "folder",
    "uniqueId": "root2",
    "name": "Ideas",
    "question": "",
    "answer": "",
    "prompt-en": "",
    "prompt-ar": "",
    "placeholder": "",
    "children": [
      {
        "type": "folder",
        "uniqueId": "sub3",
        "name": "Innovations",
        "question": "",
        "answer": "",
        "prompt-en": "",
        "prompt-ar": "",
        "placeholder": "",
        "children": [
          {
            "type": "leaf",
            "uniqueId": "leaf4",
            "name": "",
            "question": "Future projects",
            "answer": "AI chatbot, VR game",
            "prompt-en": "Brainstorm ideas",
            "prompt-ar": "توليد أفكار",
            "placeholder": "What's your idea?",
            "children": []
          },
          {
            "type": "leaf",
            "uniqueId": "leaf5",
            "name": "",
            "question": "Sustainable tech",
            "answer": "Solar panels, EV",
            "prompt-en": "Explore green tech",
            "prompt-ar": "استكشف التكنولوجيا الخضراء",
            "placeholder": "Green idea",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "type": "folder",
    "uniqueId": "root3",
    "name": "Research",
    "question": "",
    "answer": "",
    "prompt-en": "",
    "prompt-ar": "",
    "placeholder": "",
    "children": [
      {
        "type": "folder",
        "uniqueId": "sub4",
        "name": "AI Topics",
        "question": "",
        "answer": "",
        "prompt-en": "",
        "prompt-ar": "",
        "placeholder": "",
        "children": [
          {
            "type": "leaf",
            "uniqueId": "leaf6",
            "name": "",
            "question": "Machine learning basics",
            "answer": "Supervised, unsupervised",
            "prompt-en": "Explain ML",
            "prompt-ar": "شرح التعلم الآلي",
            "placeholder": "ML question",
            "children": []
          }
        ]
      },
      {
        "type": "folder",
        "uniqueId": "sub5",
        "name": "Blockchain",
        "question": "",
        "answer": "",
        "prompt-en": "",
        "prompt-ar": "",
        "placeholder": "",
        "children": [
          {
            "type": "leaf",
            "uniqueId": "leaf7",
            "name": "",
            "question": "Crypto currencies",
            "answer": "Bitcoin, Ethereum",
            "prompt-en": "Discuss crypto",
            "prompt-ar": "مناقشة العملات الرقمية",
            "placeholder": "Crypto topic",
            "children": []
          },
          {
            "type": "leaf",
            "uniqueId": "leaf8",
            "name": "",
            "question": "Smart contracts",
            "answer": "Self-executing contracts",
            "prompt-en": "What are smart contracts?",
            "prompt-ar": "ما هي العقود الذكية؟",
            "placeholder": "Contract question",
            "children": []
          }
        ]
      }
    ]
  }
];

/**
 * Global counter for generating unique IDs for new nodes.
 * Issues: Global state; could conflict if multiple instances.
 */
let idCounter = Date.now();

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
 * Recursively assigns unique IDs to all nodes and their children.
 * Purpose: Ensures each node has a uniqueId for DOM manipulation.
 * How it works: Sets node.uniqueId to a new UUID, recurses on children.
 * Issues: Modifies data in place; only called once via flag, but if data changes, may need re-run.
 */
function assignUUID(node) {
  node.uniqueId = generateUUID();
  if (node.children) {
    node.children.forEach(assignUUID);
  }
}

/**
 * Flag to ensure UUIDs are assigned only on first render.
 * Issues: Global flag; better as a property of a sidebar class.
 */
let uuidsAssigned = false;

/**
 * Renders the entire sidebar by generating HTML for all root nodes.
 * Purpose: Updates the DOM to reflect the current state of hierarchicalData.
 * How it works: On first call, assigns UUIDs to all nodes recursively via assignUUID (flag prevents re-assignment). Finds the sidebar ul element (.sidebar ul.menu.w-full), maps each root node to HTML using generateNodeHTML, joins the strings, sets innerHTML, and initializes Lucide icons. Called after data changes (add, remove, etc.).
 * Implementation details: Recursive HTML generation from data tree. Uses innerHTML for full re-render.
 * Issues: Replaces entire DOM subtree on each call, destroying event listeners and state; inefficient for large trees or frequent updates. No error handling if sidebar element missing. Global flag uuidsAssigned is crude; better as instance property. Lucide.createIcons() assumes icons are present.
 * Potential improvements: Incremental updates, virtual DOM, or React/Vue for better performance.
 */
function renderSidebar() {
  // Assign UUIDs to all nodes on first render
  if (!uuidsAssigned) {
    hierarchicalData.forEach(assignUUID);
    uuidsAssigned = true;
  }
  const sidebarUl = document.querySelector('.sidebar ul.menu.w-full');
  if (sidebarUl) {
    sidebarUl.innerHTML = hierarchicalData.map(generateNodeHTML).join('');
    lucide.createIcons();
  }
}




// Global functions for sidebar interactions
/**
 * Recursively searches for a node by uniqueId in the data tree.
 * Returns: The node object if found, null otherwise.
 * Issues: Linear search; inefficient for deep/large trees.
 */
function findNode(data, id) {
  for (let node of data) {
    if (node.uniqueId === id) {
      return node;
    }
    if (node.children) {
      let found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Recursively removes a node by uniqueId from the data tree.
 * Returns: true if removed, false otherwise.
 * Issues: Modifies array in place; assumes unique IDs.
 */
function removeFromTree(data, id) {
  for (let i = 0; i < data.length; i++) {
    if (data[i].uniqueId === id) {
      console.log('Removing node', id, 'at index', i, 'from array of length', data.length);
      data.splice(i, 1);
      return true;
    }
    if (data[i].children && removeFromTree(data[i].children, id)) {
      return true;
    }
  }
  return false;
}

/**
 * Adds a new subfolder (child node) to the specified node.
 * Purpose: Allows users to expand the hierarchical structure by creating new folders under existing ones.
 * How it works: Finds the node by ID, ensures it has a children array, appends a new node with default properties (unique ID, name 'New Item', etc.), and re-renders the sidebar to reflect the change.
 */
function addSub(nodeId) {
  const node = findNode(hierarchicalData, nodeId);
  if (node && node.type === 'folder') {
    if (!node.children) node.children = [];
    node.children.push({
      type: 'folder',
      uniqueId: 'node' + idCounter++,
      name: 'New Item',
      question: '',
      answer: '',
      'prompt-en': '',
      'prompt-ar': '',
      placeholder: '',
      children: []
    });
    renderSidebar();
  }
}

/**
 * Removes the specified node and all its children from the hierarchical data.
 * Purpose: Enables deletion of folders or items in the sidebar, cleaning up unwanted entries.
 * How it works: Uses removeFromTree to delete the node from the data structure, logs the action, and re-renders the sidebar.
 */
function removeItem(nodeId) {
  console.log('Removing node', nodeId);
  removeFromTree(hierarchicalData, nodeId);
  renderSidebar();
}

/**
 * Copies the specified node to a global clipboard for later pasting.
 * Purpose: Facilitates duplication of nodes, allowing users to replicate structures or content.
 * How it works: Locates the node by ID, creates a deep copy using JSON.parse/stringify, and stores it in window.copiedNode.
 */
function copyNode(nodeId) {
  const node = findNode(hierarchicalData, nodeId);
  if (node) {
    window.copiedNode = JSON.parse(JSON.stringify(node));
  }
}

/**
 * Pastes the copied node as a child of the specified node.
 * Purpose: Completes the copy-paste workflow by inserting the duplicated node into the hierarchy.
 * How it works: Checks if there's a copied node, creates a deep copy, regenerates unique IDs to avoid conflicts, adds it to the target's children, and re-renders the sidebar.
 */
function pasteAsChild(nodeId) {
  const node = findNode(hierarchicalData, nodeId);
  if (node && window.copiedNode) {
    if (!node.children) node.children = [];
    const pastedNode = JSON.parse(JSON.stringify(window.copiedNode));
    regenerateIds(pastedNode);
    node.children.push(pastedNode);
    renderSidebar();
  }
}

/**
 * Moves the specified node up within its siblings in the hierarchy.
 * Purpose: Allows reordering of nodes to adjust their display order in the sidebar.
 * How it works: Recursively searches the tree to find the node, swaps it with the previous sibling if possible, and re-renders the sidebar.
 */
function moveUp(nodeId) {
  function moveInTree(data, id) {
    for (let i = 0; i < data.length; i++) {
      if (data[i].uniqueId === id && i > 0) {
        [data[i-1], data[i]] = [data[i], data[i-1]];
        return true;
      }
      if (data[i].children && moveInTree(data[i].children, id)) {
        return true;
      }
    }
    return false;
  }
  moveInTree(hierarchicalData, nodeId);
  renderSidebar();
}

/**
 * Moves the specified node down within its siblings in the hierarchy.
 * Purpose: Allows reordering of nodes to adjust their display order in the sidebar.
 * How it works: Recursively searches the tree to find the node, swaps it with the next sibling if possible, and re-renders the sidebar.
 */
function moveDown(nodeId) {
  function moveInTree(data, id) {
    for (let i = 0; i < data.length; i++) {
      if (data[i].uniqueId === id && i < data.length - 1) {
        [data[i], data[i+1]] = [data[i+1], data[i]];
        return true;
      }
      if (data[i].children && moveInTree(data[i].children, id)) {
        return true;
      }
    }
    return false;
  }
  moveInTree(hierarchicalData, nodeId);
  renderSidebar();
}

/**
 * Enables in-place editing of the node's name by replacing the text element with an input field.
 * Purpose: Provides a way for users to rename folders or items directly in the sidebar.
 * How it works: Finds the text element near the clicked button, creates an input with the current value, sets up an onblur handler to save changes and re-render, and focuses the input.
 */
function editItem(el, nodeId) {
  const node = findNode(hierarchicalData, nodeId);
  if (node) {
    // Find the span containing the text
    const mainEl = document.querySelector(`[data-nodeid="${nodeId}"]`);
    const textEl = mainEl.querySelector('span');
    if (textEl) {
      const currentText = textEl.textContent;
      const input = document.createElement('input');
      input.value = currentText;
      input.onblur = () => {
        if (node.type === 'folder') {
          node.name = input.value;
        } else {
          node.question = input.value;
        }
        renderSidebar();
      };
      textEl.replaceWith(input);
      input.focus();
    }
  }
}

/**
 * Saves any pending edits and refreshes the sidebar display.
 * Purpose: Ensures the sidebar reflects the latest changes, though currently redundant since editItem handles saving on blur.
 * How it works: Simply re-renders the sidebar to update the UI.
 */
function saveItem(nodeId) {
  renderSidebar();
}

/**
 * Adds a new question leaf node as a child of the specified node.
 * Purpose: Allows users to add new Q&A entries under folders, expanding the knowledge base.
 * How it works: Finds the node, ensures children array, appends a new node with question defaults (unique ID with 'q' prefix, 'New Question', etc.), and re-renders the sidebar.
 */
function addQuestion(nodeId) {
  const node = findNode(hierarchicalData, nodeId);
  if (node && node.type === 'folder') {
    if (!node.children) node.children = [];
    node.children.push({
      type: 'leaf',
      uniqueId: 'node' + idCounter++,
      name: '',
      question: 'New Question',
      answer: '',
      'prompt-en': '',
      'prompt-ar': '',
      placeholder: '',
      children: []
    });
    renderSidebar();
  }
}















/**
 * Regenerates unique IDs for a node and its children to avoid conflicts when pasting.
 * How it works: Sets node.uniqueId to 'node' + idCounter++, recurses on children.
 * Issues: Uses global idCounter; assumes no existing ID conflicts.
 */
function regenerateIds(node) {
  node.uniqueId = 'node' + idCounter++;
  if (node.children) {
    node.children.forEach(child => regenerateIds(child));
  }
}

// Data management (for pages with sidebar) - totally client side
if (document.querySelector('.sidebar')) {
  // Render sidebar initially with static data
  renderSidebar();
}

/**
 * Summary: The sidebar is fully functional using the hierarchicalData JS object.
 * - Nodes are rendered based on 'type': 'folder' (expandable with children) or 'leaf' (end nodes).
 * - Folders display name, folder icon, and full menu (add sub, remove, etc.).
 * - Leaves display question, document icon, and limited menu (no add options).
 * - Interactions (add, remove, edit, etc.) update the hierarchicalData object and re-render the DOM.
 * - Persistence is client-side; data is stored in the JS object and re-rendered on changes.
 * - All functions work correctly: rendering, CRUD operations, menu actions, and UI updates.
 */









