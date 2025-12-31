const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');

const port = 3000;

// Load raw data for sidebar
let hierarchicalData = JSON.parse(fs.readFileSync('hierarchical-data.json', 'utf8'));

// Function to normalize children property
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

function deleteNodeByUniqueId(data, uniqueId) {
  for (let i = 0; i < data.length; i++) {
    if (data[i].uniqueId === uniqueId) {
      data.splice(i, 1);
      return true;
    }
    if (data[i].children && deleteNodeByUniqueId(data[i].children, uniqueId)) {
      return true;
    }
  }
  return false;
}

function addNode(data, parentUniqueId, newNode) {
  if (!parentUniqueId) {
    data.push(newNode);
    return true;
  }
  for (let i = 0; i < data.length; i++) {
    if (data[i].uniqueId === parentUniqueId) {
      if (!data[i].children) data[i].children = [];
      data[i].children.push(newNode);
      return true;
    }
    if (data[i].children && addNode(data[i].children, parentUniqueId, newNode)) {
      return true;
    }
  }
  return false;
}

function updateNode(data, uniqueId, updates) {
  for (let i = 0; i < data.length; i++) {
    if (data[i].uniqueId === uniqueId) {
      Object.assign(data[i], updates);
      return true;
    }
    if (data[i].children && updateNode(data[i].children, uniqueId, updates)) {
      return true;
    }
  }
  return false;
}

function getNodeByUniqueId(data, uniqueId) {
  for (let i = 0; i < data.length; i++) {
    if (data[i].uniqueId === uniqueId) {
      return data[i];
    }
    if (data[i].children) {
      const found = getNodeByUniqueId(data[i].children, uniqueId);
      if (found) return found;
    }
  }
  return null;
}

function copyNode(data, fromUniqueId, toParentUniqueId) {
  console.log('Copying node', fromUniqueId, 'to parent', toParentUniqueId);
  const node = getNodeByUniqueId(data, fromUniqueId);
  if (!node) {
    console.log('Node not found');
    return false;
  }
  const copy = JSON.parse(JSON.stringify(node));
  console.log('Original node:', node.name || node.question);
  // Generate new id and uniqueId
  copy.id = Date.now().toString();
  copy.uniqueId = Math.random().toString(36).substr(2, 9);
  console.log('New id:', copy.id, 'uniqueId:', copy.uniqueId);
  // If it's a folder, recursively update ids
  function updateIds(obj) {
    if (obj.children && Array.isArray(obj.children)) {
      obj.children.forEach(child => {
        child.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        child.uniqueId = Math.random().toString(36).substr(2, 9);
        updateIds(child);
      });
    }
  }
  updateIds(copy);
  // Add to parent
  const added = addNode(data, toParentUniqueId, copy);
  console.log('Added to parent:', added);
  return added ? copy : false;
}

const app = express();

// Set up Handlebars
app.engine('handlebars', exphbs.engine({
    helpers: {
        gt: (a, b) => a > b,
        eq: (a, b) => a === b,
        markdown: (text) => marked.parse(text),
        countQuestions: (arr) => arr ? arr.length : 0,
        sumLengths: (content) => content ? content.reduce((sum, group) => sum + (group ? group.length : 0), 0) : 0,
        totalModelQuestions: (sections) => sections ? sections.reduce((sum, section) => sum + (section.content ? section.content.reduce((s, g) => s + (g ? g.length : 0), 0) : 0), 0) : 0
    },
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.post('/delete-node/:id', (req, res) => {
  const uniqueId = req.params.id;
  if (deleteNodeByUniqueId(hierarchicalData, uniqueId)) {
    fs.writeFileSync('hierarchical-data.json', JSON.stringify(hierarchicalData, null, 2));
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});

app.post('/add-node', (req, res) => {
  const { parentId, type, name } = req.body;
  const newId = Date.now().toString();
  const newNode = type === 'sub' ? { id: newId, name, children: [] } : { id: newId, question: name, answer: "", "prompt-en": "", "prompt-ar": "", placeholder: "" };
  newNode.uniqueId = Math.random().toString(36).substr(2, 9);
  if (addNode(hierarchicalData, parentId, newNode)) {
    fs.writeFileSync('hierarchical-data.json', JSON.stringify(hierarchicalData, null, 2));
    res.json({ success: true, id: newId, uniqueId: newNode.uniqueId });
  } else {
    res.status(400).json({ success: false });
  }
});

app.post('/update-node/:id', (req, res) => {
  const uniqueId = req.params.id;
  const { name } = req.body;
  const node = getNodeByUniqueId(hierarchicalData, uniqueId);
  if (!node) {
    return res.status(400).json({ success: false });
  }
  const updates = 'children' in node ? { name } : { question: name };
  if (updateNode(hierarchicalData, uniqueId, updates)) {
    fs.writeFileSync('hierarchical-data.json', JSON.stringify(hierarchicalData, null, 2));
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});

app.post('/paste-as-child', (req, res) => {
  const { parentId, copyId } = req.body;
  console.log('Pasting node', copyId, 'as child of', parentId);
  let copy;
  if (parentId === 'root') {
    const node = getNodeByUniqueId(hierarchicalData, copyId);
    if (!node) {
      console.log('Node not found');
      return res.status(400).json({ success: false });
    }
    copy = JSON.parse(JSON.stringify(node));
    copy.id = Date.now().toString();
    copy.uniqueId = Math.random().toString(36).substr(2, 9);
    function updateIds(obj) {
      if (obj.children && Array.isArray(obj.children)) {
        obj.children.forEach(child => {
          child.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          child.uniqueId = Math.random().toString(36).substr(2, 9);
          updateIds(child);
        });
      }
    }
    updateIds(copy);
    hierarchicalData.push(copy);
  } else {
    copy = copyNode(hierarchicalData, copyId, parentId);
  }
  if (copy) {
    fs.writeFileSync('hierarchical-data.json', JSON.stringify(hierarchicalData, null, 2));
    console.log('Paste successful');
    res.json({ success: true, newNode: copy });
  } else {
    console.log('Paste failed: node not found');
    res.status(400).json({ success: false });
  }
});

app.get('/home', (req, res) => {
    // Normalize children property
    normalizeChildren(hierarchicalData);
    function addIsFolder(data) {
        for (let node of data) {
            node.isFolder = 'children' in node;
            node.uniqueId = Math.random().toString(36).substr(2, 9);
            if (node.children && node.children.length > 0) {
                addIsFolder(node.children);
            }
        }
    }
    addIsFolder(hierarchicalData);
    res.locals.rawData = hierarchicalData;
    res.render('home', { rawData: hierarchicalData });
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard', { title: 'Dashboard' });
});

app.get('/explore', (req, res) => {
    res.render('explore', { title: 'Explore' });
});

app.get('/portfolio', (req, res) => {
    res.render('portfolio', { title: 'Portfolio' });
});

app.get('/help', (req, res) => {
    res.render('help', { title: 'Help' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});