const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');

const port = 3000;

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
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Serve initial data
app.get('/data/hierarchical-data.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'hierarchical-data.json'));
});

// Routes
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/home', (req, res) => {
    res.render('home');
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

app.get('/explore', (req, res) => {
    res.render('explore');
});

app.get('/portfolio', (req, res) => {
    res.render('portfolio');
});

app.get('/help', (req, res) => {
    res.render('help');
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
    res.render('home', { rawData: hierarchicalData, title: 'Accelerator' });
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