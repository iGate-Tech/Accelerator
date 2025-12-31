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





app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});