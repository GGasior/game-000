const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Setup middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
  secret: 'game-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using https
}));

// Data directory for user info and game data
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

// Helper to read users
function getUsers() {
  const data = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(data);
}

// Helper to write users
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/game');
  } else {
    res.sendFile(path.join(__dirname, '../public/login.html'));
  }
});

app.get('/game', (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, '../public/game.html'));
  } else {
    res.redirect('/');
  }
});

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Set user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      gameData: user.gameData
    };
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Register route
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();
  
  // Check if user already exists
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }
  
  // Create new user
  const newUser = {
    id: Date.now().toString(),
    username,
    password,
    gameData: {}
  };
  
  users.push(newUser);
  saveUsers(users);
  
  // Set user in session
  req.session.user = {
    id: newUser.id,
    username: newUser.username,
    gameData: newUser.gameData
  };
  
  res.json({ success: true });
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Game data route - save game data
app.post('/api/save-game', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }
  
  const { gameData } = req.body;
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === req.session.user.id);
  
  if (userIndex !== -1) {
    users[userIndex].gameData = gameData;
    saveUsers(users);
    req.session.user.gameData = gameData;
    return res.json({ success: true });
  }
  
  res.status(404).json({ success: false, message: 'User not found' });
});

// Get game data
app.get('/api/game-data', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }
  
  res.json({ success: true, gameData: req.session.user.gameData });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 