# Game Server with Login System

A simple Node.js server with user authentication system for saving game data.

## Features

- User registration and login
- Session management
- Game data storage
- Simple game interface

## Installation

1. Clone this repository
2. Install dependencies:
```
npm install
```

## Usage

### Starting the server

Run the server with:
```
npm start
```

For development with auto-restart:
```
npm install -g nodemon  # If you don't have nodemon installed
npm run dev
```

### Accessing the game

1. Open your browser and navigate to `http://localhost:3000`
2. Register a new account or log in with existing credentials
3. Use the game interface to start, save, and load game data

## API Endpoints

- `POST /login`: Login with username and password
- `POST /register`: Register a new user
- `GET /logout`: Log out current user
- `POST /api/save-game`: Save game data for current user
- `GET /api/game-data`: Get saved game data for current user

## Project Structure

- `/public`: Static files (HTML, CSS, client-side JavaScript)
- `/server`: Server-side code
- `/data`: Data storage (auto-generated) 