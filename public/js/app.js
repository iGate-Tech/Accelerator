// app.js - Client-side logic for theme, language, and data management

import { Collection } from 'https://esm.sh/@signaldb/core';

// Collections
const nodesCollection = new Collection('nodes');

// Theme functionality
const themeController = document.getElementById('theme-controller');
const html = document.documentElement;

// Get saved theme or default to 'light'
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
if (themeController) {
  themeController.checked = savedTheme === 'dark';
}

// Toggle theme on checkbox change
if (themeController) {
  themeController.addEventListener('change', () => {
    const isChecked = themeController.checked;
    const newTheme = isChecked ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

// I18n functionality
const translations = {
  en: {
    title: "Hi <span class='text-primary'>Demo</span>, what's your next big idea?",
    placeholder: "Enter prompt...",
    home: "Home",
    dashboard: "Dashboard",
    explore: "Explore",
    portfolio: "Portfolio",
    help: "Help"
  },
  ar: {
    title: "مرحباً <span class='text-primary'>ديمو</span>، ما هي فكرتك الكبيرة التالية؟",
    placeholder: "أدخل الطلب...",
    home: "الرئيسية",
    dashboard: "لوحة التحكم",
    explore: "استكشف",
    portfolio: "المحفظة",
    help: "المساعدة"
  }
};

function setLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = translations[lang][key];
    } else {
      el.innerHTML = translations[lang][key];
    }
  });
  // Adjust sidebar position
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    if (lang === 'ar') {
      sidebar.classList.remove('left-0', 'border-r');
      sidebar.classList.add('right-0', 'border-l');
    } else {
      sidebar.classList.remove('right-0', 'border-l');
      sidebar.classList.add('left-0', 'border-r');
    }
  }
  // Adjust content margin
  const contentDiv = document.querySelector('div.ml-\\[400px\\]');
  if (contentDiv) {
    if (lang === 'ar') {
      contentDiv.classList.remove('ml-[400px]');
      contentDiv.classList.add('mr-[400px]');
    } else {
      contentDiv.classList.remove('mr-[400px]');
      contentDiv.classList.add('ml-[400px]');
    }
  }
  localStorage.setItem('lang', lang);
}

// Language toggle
const langSwap = document.querySelector('.swap input[type="checkbox"]');
if (langSwap) {
  langSwap.addEventListener('change', (e) => {
    const lang = e.target.checked ? 'ar' : 'en';
    setLanguage(lang);
  });
}

// Initialize
const savedLang = localStorage.getItem('lang') || 'en';
setLanguage(savedLang);
if (langSwap) {
  langSwap.checked = savedLang === 'ar';
}

// Data management (for pages with sidebar)
if (document.querySelector('.sidebar')) {
  // Load initial data
  fetch('/data/hierarchical-data.json')
    .then(res => res.json())
    .then(data => {
      // Normalize and flatten to individual nodes
      const nodes = [];
      function flatten(data, parentId = null) {
        data.forEach(node => {
          if (node.childern && !node.children) {
            node.children = node.childern;
            delete node.childern;
          }
          if (!node.children) node.children = [];
          const flatNode = {
            uniqueId: node.uniqueId,
            name: node.name,
            question: node.question,
            answer: node.answer,
            'prompt-en': node['prompt-en'],
            'prompt-ar': node['prompt-ar'],
            placeholder: node.placeholder,
            parentId: parentId
          };
          nodes.push(flatNode);
          if (node.children.length > 0) {
            flatten(node.children, node.uniqueId);
          }
        });
      }
      flatten(data);
      // Insert into collection
      nodesCollection.insert(nodes);
      // Update sidebar
      updateSidebar();
    });

  // Function to update sidebar
  function updateSidebar() {
    const allNodes = nodesCollection.find().fetch();
    // Build tree
    const nodeMap = {};
    const roots = [];
    allNodes.forEach(node => {
      nodeMap[node.uniqueId] = { ...node, children: [] };
    });
    allNodes.forEach(node => {
      if (node.parentId) {
        nodeMap[node.parentId].children.push(nodeMap[node.uniqueId]);
      } else {
        roots.push(nodeMap[node.uniqueId]);
      }
    });
    const sidebarUl = document.querySelector('.sidebar ul.menu.w-full');
    if (sidebarUl) {
      sidebarUl.innerHTML = '';
      roots.forEach(node => {
        const li = document.createElement('li');
        li.innerHTML = generateNodeHTML(node);
        sidebarUl.appendChild(li);
      });
      lucide.createIcons();
    }
  }

  // Generate HTML
  function generateNodeHTML(node) {
    let html = '';
    if (node.children && node.children.length > 0) {
      // Folder
      html += '<details class="dropdown w-full" data-nodeid="' + node.uniqueId + '">';
      html += '<summary>';
      html += '<i class="lucide lucide-folder w-4 h-4 flex-shrink-0 min-w-4 min-h-4" data-lucide="folder"></i>';
      html += '<span class="node-name">' + (node.name || '') + '</span>';
      html += '<button class="btn btn-ghost btn-sm" popovertarget="popover-' + node.uniqueId + '" style="anchor-name:--anchor-' + node.uniqueId + '" onclick="event.stopPropagation()">';
      html += '<i class="lucide lucide-ellipsis-vertical w-4 h-4" data-lucide="ellipsis-vertical"></i>';
      html += '</button>';
      html += '<ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-' + node.uniqueId + '" style="position-anchor:--anchor-' + node.uniqueId + '">';
      html += '<li><a onclick="editItem(this)"><i class="lucide lucide-edit w-4 h-4" data-lucide="edit"></i> Edit</a></li>';
      html += '<li><a onclick="saveItem(this)"><i class="lucide lucide-save w-4 h-4" data-lucide="save"></i> Save</a></li>';
      html += '<li><a onclick="copyNode(this)"><i class="lucide lucide-copy w-4 h-4" data-lucide="copy"></i> Copy</a></li>';
      html += '<li><a onclick="pasteAsChild(this)"><i class="lucide lucide-clipboard-paste w-4 h-4" data-lucide="clipboard-paste"></i> Paste as child</a></li>';
      html += '<li><a onclick="addSub(this)"><i class="lucide lucide-folder-plus w-4 h-4" data-lucide="folder-plus"></i> Add sub</a></li>';
      html += '<li><a onclick="addLeaf(this)"><i class="lucide lucide-file-plus w-4 h-4" data-lucide="file-plus"></i> Add leaf</a></li>';
      html += '<li><a onclick="deleteItem(this)"><i class="lucide lucide-trash w-4 h-4" data-lucide="trash"></i> Delete</a></li>';
      html += '</ul>';
      html += '</summary>';
      html += '<ul>';
      node.children.forEach(child => {
        html += generateNodeHTML(child);
      });
      html += '</ul>';
      html += '</details>';
    } else {
      // Leaf
      html += '<a href="#" class="flex justify-between items-center" data-nodeid="' + node.uniqueId + '">';
      html += '<span class="flex items-center">';
      html += '<i class="lucide lucide-file-text w-4 h-4 flex-shrink-0 min-w-4 min-h-4" data-lucide="file-text"></i>';
      html += '<span class="node-name ml-2">' + (node.question || '') + '</span>';
      html += '</span>';
      html += '<button class="btn btn-ghost btn-sm" popovertarget="popover-' + node.uniqueId + '" style="anchor-name:--anchor-' + node.uniqueId + '">';
      html += '<i class="lucide lucide-ellipsis-vertical w-4 h-4" data-lucide="ellipsis-vertical"></i>';
      html += '</button>';
      html += '</a>';
      html += '<ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-' + node.uniqueId + '" style="position-anchor:--anchor-' + node.uniqueId + '">';
      html += '<li><a onclick="editItem(this)"><i class="lucide lucide-edit w-4 h-4" data-lucide="edit"></i> Edit</a></li>';
      html += '<li><a onclick="saveItem(this)"><i class="lucide lucide-save w-4 h-4" data-lucide="save"></i> Save</a></li>';
      html += '<li><a onclick="copyNode(this)"><i class="lucide lucide-copy w-4 h-4" data-lucide="copy"></i> Copy</a></li>';
      html += '<li><a onclick="pasteAsChild(this)"><i class="lucide lucide-clipboard-paste w-4 h-4" data-lucide="clipboard-paste"></i> Paste as child</a></li>';
      html += '<li><a onclick="deleteItem(this)"><i class="lucide lucide-trash w-4 h-4" data-lucide="trash"></i> Delete</a></li>';
      html += '</ul>';
    }
    return html;
  }

  // CRUD functions
  let copiedId = null;

  window.copyNode = function(el) {
    let container = el.closest('details');
    if (!container) {
      const dropdownUl = el.closest('ul.dropdown');
      if (dropdownUl) {
        container = dropdownUl.parentElement.querySelector('details') || dropdownUl.parentElement.querySelector('a[data-nodeid]');
      }
    }
    if (!container) container = el.closest('a[data-nodeid]');
    if (container) {
      copiedId = container.dataset.nodeid;
    }
  };

  window.pasteAsChild = function(el) {
    if (!copiedId) return;
    let container = el.closest('details');
    if (!container) {
      const dropdownUl = el.closest('ul.dropdown');
      if (dropdownUl) {
        container = dropdownUl.parentElement.querySelector('details') || dropdownUl.parentElement.querySelector('a[data-nodeid]');
      }
    }
    if (!container) container = el.closest('a[data-nodeid]');
    if (container) {
      const parentId = container.dataset.nodeid;
      const node = nodesCollection.findOne({ uniqueId: copiedId }).fetch();
      if (node) {
      const copy = {
        uniqueId: Math.random().toString(36).substr(2, 9),
        name: node.name,
        question: node.question,
        answer: node.answer,
        'prompt-en': node['prompt-en'],
        'prompt-ar': node['prompt-ar'],
        placeholder: node.placeholder,
        parentId: parentId
      };
      nodesCollection.insert(copy);
      console.log('Pasted node:', copy.uniqueId);
      updateSidebar();
      }
    }
  };

  window.addSub = function(el) {
    let container = el.closest('details');
    if (!container) {
      const dropdownUl = el.closest('ul.dropdown');
      if (dropdownUl) {
        container = dropdownUl.parentElement.querySelector('details') || dropdownUl.parentElement.querySelector('a[data-nodeid]');
      }
    }
    if (!container) container = el.closest('a[data-nodeid]');
    const parentId = container ? container.dataset.nodeid : null;
    const newNode = {
      uniqueId: Math.random().toString(36).substr(2, 9),
      name: 'New Sub',
      parentId: parentId
    };
    nodesCollection.insert(newNode);
    updateSidebar();
  };

  window.addLeaf = function(el) {
    let container = el.closest('details');
    if (!container) {
      const dropdownUl = el.closest('ul.dropdown');
      if (dropdownUl) {
        container = dropdownUl.parentElement.querySelector('details') || dropdownUl.parentElement.querySelector('a[data-nodeid]');
      }
    }
    if (!container) container = el.closest('a[data-nodeid]');
    const parentId = container ? container.dataset.nodeid : null;
    const newNode = {
      uniqueId: Math.random().toString(36).substr(2, 9),
      question: 'New Leaf',
      answer: "",
      "prompt-en": "",
      "prompt-ar": "",
      placeholder: "",
      parentId: parentId
    };
    nodesCollection.insert(newNode);
    updateSidebar();
  };

  window.deleteItem = function(el) {
    let container = el.closest('details');
    if (!container) {
      const dropdownUl = el.closest('ul.dropdown');
      if (dropdownUl) {
        container = dropdownUl.parentElement.querySelector('a[data-nodeid]');
      }
    }
    if (!container) container = el.closest('a[data-nodeid]');
    const nodeId = container.dataset.nodeid;
    nodesCollection.delete({ uniqueId: nodeId });
    // Also remove children
    function removeChildren(parentId) {
      const children = nodesCollection.find({ parentId: parentId }).fetch();
      children.forEach(child => {
        nodesCollection.delete({ uniqueId: child.uniqueId });
        removeChildren(child.uniqueId);
      });
    }
    removeChildren(nodeId);
    updateSidebar();
  };

  window.editItem = function(el) {
    let container = el.closest('details');
    if (!container) {
      const dropdownUl = el.closest('ul.dropdown');
      if (dropdownUl) {
        container = dropdownUl.parentElement.querySelector('a[data-nodeid]');
      }
    }
    if (!container) container = el.closest('a[data-nodeid]');
    let header;
    if (container.tagName.toLowerCase() === 'details') {
      header = container.querySelector('summary');
    } else {
      header = container;
    }
    const nameSpan = header.querySelector('.node-name');
    if (nameSpan) {
      const currentText = nameSpan.textContent.trim();
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentText;
      input.className = 'input input-sm';
      header.replaceChild(input, nameSpan);
      input.focus();
      input.select();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          saveItem(el);
        } else if (e.key === 'Escape') {
          header.replaceChild(nameSpan, input);
        }
      });
    }
  };

  window.saveItem = function(el) {
    let container = el.closest('details');
    if (!container) {
      const dropdownUl = el.closest('ul.dropdown');
      if (dropdownUl) {
        container = dropdownUl.parentElement.querySelector('a[data-nodeid]');
      }
    }
    if (!container) container = el.closest('a[data-nodeid]');
    let header;
    if (container.tagName.toLowerCase() === 'details') {
      header = container.querySelector('summary');
    } else {
      header = container;
    }
    const input = header.querySelector('input');
    if (input) {
      const newText = input.value.trim();
      const nameSpan = document.createElement('span');
      nameSpan.className = 'node-name';
      nameSpan.textContent = newText;
      header.replaceChild(nameSpan, input);
      const nodeId = container.dataset.nodeid;
      const updates = { name: newText, question: newText };
      nodesCollection.update({ uniqueId: nodeId }, updates);
    }
  };

  window.addSubToRoot = function() {
    const newNode = {
      uniqueId: Math.random().toString(36).substr(2, 9),
      name: 'New Sub',
      parentId: null
    };
    nodesCollection.insert(newNode);
    updateSidebar();
  };

  window.addLeafToRoot = function() {
    const newNode = {
      uniqueId: Math.random().toString(36).substr(2, 9),
      question: 'New Leaf',
      answer: "",
      "prompt-en": "",
      "prompt-ar": "",
      placeholder: "",
      parentId: null
    };
    nodesCollection.insert(newNode);
    updateSidebar();
  };

  window.pasteAsChildToRoot = function() {
    if (!copiedId) return;
    const node = nodesCollection.findOne({ uniqueId: copiedId }).fetch();
    if (node) {
      const copy = {
        uniqueId: Math.random().toString(36).substr(2, 9),
        name: node.name,
        question: node.question,
        answer: node.answer,
        'prompt-en': node['prompt-en'],
        'prompt-ar': node['prompt-ar'],
        placeholder: node.placeholder,
        parentId: null
      };
      nodesCollection.insert(copy);
      updateSidebar();
    }
  };

  // Question card animation (if present)
if (document.querySelector('.card')) {
  const card = document.querySelector('.card');
  const colors = ['rgba(255,0,0,0.5)', 'rgba(255,165,0,0.5)', 'rgba(255,255,0,0.5)', 'rgba(0,255,0,0.5)', 'rgba(0,0,255,0.5)', 'rgba(75,0,130,0.5)', 'rgba(238,130,238,0.5)'];
  function animate() {
    const time = Date.now() * 0.001;
    const x = Math.random() * 100 - 50;
    const y = Math.random() * 40 - 10;
    const blur = 60 + Math.random() * 40;
    const spread = Math.random() * 10 - 5;
    const colorIndex = Math.floor(time * 0.1) % colors.length;
    const color = colors[colorIndex];
    card.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
    const delay = Math.random() * 3000 + 1000;
    setTimeout(animate, delay);
  }
  animate();
}

console.log('app.js loaded');
}