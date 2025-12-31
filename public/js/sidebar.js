// sidebar.js - Sidebar functionality

// Generate HTML
function generateNodeHTML(node) {
  let html = '';
  if (node.children && node.children.length > 0) {
    // Folder
    html += '<li>';
    html += '<details data-nodeid="' + node.uniqueId + '">';
    html += '<summary>';
    html += '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">';
    html += '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />';
    html += '</svg>';
    html += (node.name || '');
    html += '<button class="btn btn-ghost btn-sm" popovertarget="popover-' + node.uniqueId + '" style="anchor-name:--anchor-' + node.uniqueId + '">';
    html += '<i data-lucide="ellipsis-vertical" class="w-4 h-4"></i>';
    html += '</button>';
    html += '<ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-' + node.uniqueId + '" style="position-anchor:--anchor-' + node.uniqueId + '">';
    html += '<li><a onclick="addSub(this)"><i data-lucide="plus" class="w-4 h-4"></i> Add</a></li>';
    html += '<li><a onclick="removeItem(this)"><i data-lucide="trash" class="w-4 h-4"></i> Remove</a></li>';
    html += '<li><a onclick="copyNode(this)"><i data-lucide="copy" class="w-4 h-4"></i> Copy</a></li>';
    html += '<li><a onclick="pasteAsChild(this)"><i data-lucide="clipboard-paste" class="w-4 h-4"></i> Paste</a></li>';
    html += '<li><a onclick="moveUp(this)"><i data-lucide="arrow-up" class="w-4 h-4"></i> Move up</a></li>';
    html += '<li><a onclick="moveDown(this)"><i data-lucide="arrow-down" class="w-4 h-4"></i> Move down</a></li>';
    html += '<li><a onclick="editItem(this)"><i data-lucide="edit" class="w-4 h-4"></i> Edit</a></li>';
    html += '<li><a onclick="saveItem(this)"><i data-lucide="save" class="w-4 h-4"></i> Save</a></li>';
    html += '<li><a onclick="addQuestion(this)"><i data-lucide="help-circle" class="w-4 h-4"></i> Add question</a></li>';
    html += '</ul>';
    html += '</summary>';
    html += '<ul>';
    node.children.forEach(child => {
      html += generateNodeHTML(child);
    });
    html += '</ul>';
    html += '</details>';
    html += '</li>';
   } else {
     // Leaf
     html += '<li>';
      html += '<a data-nodeid="' + node.uniqueId + '">';
     html += '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">';
     html += '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />';
     html += '</svg>';
     html += (node.question || '');
     html += '<button class="btn btn-ghost btn-sm" popovertarget="popover-' + node.uniqueId + '" style="anchor-name:--anchor-' + node.uniqueId + '" onclick="event.stopPropagation()">';
     html += '<i data-lucide="ellipsis-vertical" class="w-4 h-4"></i>';
     html += '</button>';
     html += '</a>';
     html += '<ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-' + node.uniqueId + '" style="position-anchor:--anchor-' + node.uniqueId + '">';
     html += '<li><a onclick="removeItem(this)"><i data-lucide="trash" class="w-4 h-4"></i> Remove</a></li>';
     html += '<li><a onclick="copyNode(this)"><i data-lucide="copy" class="w-4 h-4"></i> Copy</a></li>';
     html += '<li><a onclick="moveUp(this)"><i data-lucide="arrow-up" class="w-4 h-4"></i> Move up</a></li>';
     html += '<li><a onclick="moveDown(this)"><i data-lucide="arrow-down" class="w-4 h-4"></i> Move down</a></li>';
     html += '<li><a onclick="editItem(this)"><i data-lucide="edit" class="w-4 h-4"></i> Edit</a></li>';
     html += '<li><a onclick="saveItem(this)"><i data-lucide="save" class="w-4 h-4"></i> Save</a></li>';
     html += '</ul>';
     html += '</li>';
   }
  return html;
}

// Static hierarchical data
let hierarchicalData = [
  {
    "uniqueId": "root1",
    "name": "Projects",
    "question": "",
    "answer": "",
    "prompt-en": "",
    "prompt-ar": "",
    "placeholder": "",
    "children": [
      {
        "uniqueId": "sub1",
        "name": "Web Development",
        "question": "",
        "answer": "",
        "prompt-en": "",
        "prompt-ar": "",
        "placeholder": "",
        "children": [
          {
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
        "uniqueId": "sub2",
        "name": "Mobile Apps",
        "question": "",
        "answer": "",
        "prompt-en": "",
        "prompt-ar": "",
        "placeholder": "",
        "children": [
          {
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
    "uniqueId": "root2",
    "name": "Ideas",
    "question": "",
    "answer": "",
    "prompt-en": "",
    "prompt-ar": "",
    "placeholder": "",
    "children": [
      {
        "uniqueId": "sub3",
        "name": "Innovations",
        "question": "",
        "answer": "",
        "prompt-en": "",
        "prompt-ar": "",
        "placeholder": "",
        "children": [
          {
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
    "uniqueId": "root3",
    "name": "Research",
    "question": "",
    "answer": "",
    "prompt-en": "",
    "prompt-ar": "",
    "placeholder": "",
    "children": [
      {
        "uniqueId": "sub4",
        "name": "AI Topics",
        "question": "",
        "answer": "",
        "prompt-en": "",
        "prompt-ar": "",
        "placeholder": "",
        "children": [
          {
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
        "uniqueId": "sub5",
        "name": "Blockchain",
        "question": "",
        "answer": "",
        "prompt-en": "",
        "prompt-ar": "",
        "placeholder": "",
        "children": [
          {
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

// Data management (for pages with sidebar) - totally client side
if (document.querySelector('.sidebar')) {
  // Normalize static data
  function normalizeChildren(data) {
    for (let node of data) {
      if (node.childern && !node.children) {
        node.children = node.childern;
        delete node.childern;
      }
      if ('children' in node && (node.children === null || node.children === undefined)) {
        node.children = [];
      }
      if (Array.isArray(node.children)) {
        normalizeChildren(node.children);
      }
    }
  }
  normalizeChildren(hierarchicalData);
  // Update sidebar statically
  updateSidebar();

  // Function to update sidebar
  function updateSidebar() {
    const sidebarUl = document.querySelector('.sidebar ul.menu.w-full');
    if (sidebarUl) {
      sidebarUl.innerHTML = '';
      hierarchicalData.forEach(node => {
        sidebarUl.innerHTML += generateNodeHTML(node);
      });
      lucide.createIcons();
    }
  }
}