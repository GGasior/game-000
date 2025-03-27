// Task Simulator System
// This file handles task simulation for bots, PCs, and servers in the game

// Task definitions - different task types with their requirements
const TASK_TYPES = [
    { id: 1, name: "Data Processing", requirements: { server: 1 }, reward: 50, statBonus: { type: "powerSH", amount: 5 }, description: "Process data on a server" },
    { id: 2, name: "Network Scan", requirements: { server: 2 }, reward: 100, statBonus: { type: "speed", amount: 10 }, description: "Scan network using two servers" },
    { id: 3, name: "Bot Collaboration", requirements: { bot: 1 }, reward: 75, statBonus: { type: "algorithm", amount: 7 }, description: "Collaborate with another bot" },
    { id: 4, name: "Data Mining", requirements: { server: 1, bot: 1 }, reward: 150, statBonus: { type: "powerSH", amount: 15 }, description: "Mine data with server and bot" },
    { id: 5, name: "Security Audit", requirements: { server: 3 }, reward: 200, statBonus: { type: "algorithm", amount: 20 }, description: "Full security scan with 3 servers" },
    { id: 6, name: "Distributed Computing", requirements: { server: 2, bot: 2 }, reward: 300, statBonus: { type: "speed", amount: 30 }, description: "Run computations across servers and bots" },
    { id: 7, name: "Simple Calculation", requirements: { server: 1 }, reward: 30, statBonus: { type: "powerSH", amount: 3 }, description: "Basic calculation on a server" },
    { id: 8, name: "System Backup", requirements: { server: 2 }, reward: 120, statBonus: { type: "algorithm", amount: 12 }, description: "Backup system data to two servers" },
    { id: 9, name: "Bot Network", requirements: { bot: 3 }, reward: 250, statBonus: { type: "speed", amount: 25 }, description: "Create a small bot network" },
    { id: 10, name: "Lightweight Task", requirements: { }, reward: 10, statBonus: { type: "popularity", amount: 5 }, description: "Simple task requiring no extra components" },
    { id: 11, name: "Server Cluster", requirements: { server: 2 }, reward: 120, statBonus: { type: "powerSH", amount: 12 }, description: "Process on server cluster" },
    { id: 12, name: "Bot Relay", requirements: { bot: 2 }, reward: 150, statBonus: { type: "speed", amount: 15 }, description: "Message relay using bots" },
    { id: 13, name: "Complex Analysis", requirements: { server: 2, bot: 1 }, reward: 180, statBonus: { type: "algorithm", amount: 18 }, description: "Analyze data with servers and bot" },
    { id: 14, name: "Script Execution", requirements: { server: 1 }, reward: 60, statBonus: { type: "powerSH", amount: 6 }, description: "Execute script on server" },
    { id: 15, name: "Parallel Processing", requirements: { server: 2, bot: 1 }, reward: 200, statBonus: { type: "speed", amount: 20 }, description: "Process data in parallel" },
    { id: 16, name: "Database Query", requirements: { server: 1 }, reward: 45, statBonus: { type: "algorithm", amount: 5 }, description: "Query database on server" },
    { id: 17, name: "Resource Intensive", requirements: { server: 3, bot: 1 }, reward: 280, statBonus: { type: "powerSH", amount: 28 }, description: "Heavy processing task" },
    { id: 18, name: "Bot Swarm", requirements: { bot: 3 }, reward: 220, statBonus: { type: "popularity", amount: 22 }, description: "Coordinate a swarm of bots" },
    { id: 19, name: "Server Maintenance", requirements: { server: 1 }, reward: 35, statBonus: { type: "algorithm", amount: 4 }, description: "Basic server maintenance" },
    { id: 20, name: "Full Network Ops", requirements: { server: 3, bot: 2 }, reward: 350, statBonus: { type: "popularity", amount: 35 }, description: "Complete network operation" }
];

// Bot task state constants
const BOT_STATE = {
    IDLE: 'idle',
    MOVING_TO_PC: 'movingToPC',
    GETTING_TASK: 'gettingTask',
    MOVING_TO_COMPONENT: 'movingToComponent',
    WORKING_ON_COMPONENT: 'workingOnComponent',
    RETURNING_TO_PC: 'returningToPC',
    COMPLETING_TASK: 'completingTask'
};

// Bot active tasks - stores which bot is working on what
let activeBotTasks = {};

// Component cooldown tracking
let componentCooldowns = {};

// Passive income interval
let passiveIncomeInterval = null;

// Calculate passive income based on network stats
function calculatePassiveIncome(gameData) {
    // Get network stats values
    const powerSH = Math.max(1, gameData.networkStats.powerSH);
    const popularity = Math.max(1, gameData.networkStats.popularity);
    const speed = Math.max(1, gameData.networkStats.speed);
    const algorithm = Math.max(1, gameData.networkStats.algorithm);
    
    // Calculate base income (product of all stats)
    const baseValue = (powerSH * popularity * speed * algorithm) / 10000;
    
    // Apply scaling to keep income reasonable
    return Math.floor(Math.pow(baseValue, 0.25)); // Use fourth root to scale the potentially large number
}

// Start passive income generation
function startPassiveIncome(gameData) {
    // Clear any existing interval
    if (passiveIncomeInterval) {
        clearInterval(passiveIncomeInterval);
    }
    
    // Set up new interval to generate income every second
    passiveIncomeInterval = setInterval(() => {
        // Calculate income
        const income = calculatePassiveIncome(gameData);
        
        // Add to cash
        if (income > 0) {
            gameData.cash += income;
            
            // Display income generation message every 5 seconds
            if (Math.random() < 0.2) { // 20% chance each second = roughly every 5 seconds
                writeToTerminal(`Network generated $${income} from operations.`);
                updateUI();
            } else {
                // Just update cash display without a message
                cashValue.textContent = '$' + gameData.cash.toLocaleString();
            }
        }
    }, 1000);
}

// Stop passive income generation
function stopPassiveIncome() {
    if (passiveIncomeInterval) {
        clearInterval(passiveIncomeInterval);
        passiveIncomeInterval = null;
    }
}

// Path finding algorithm (simple A* implementation)
function findPath(startX, startY, targetX, targetY, grid) {
    // A* search algorithm implementation
    class Node {
        constructor(x, y, g, h) {
            this.x = x;
            this.y = y;
            this.g = g; // cost from start
            this.h = h; // heuristic (estimated cost to goal)
            this.f = g + h; // total cost
            this.parent = null;
        }
    }
    
    // Manhattan distance heuristic
    function heuristic(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    
    // Check if a position is valid
    function isValid(x, y) {
        return x >= 0 && y >= 0 && x < grid[0].length && y < grid.length;
    }
    
    // Check if a position is blocked/occupied
    function isBlocked(x, y) {
        return grid[y][x] !== 0 && !(x === targetX && y === targetY);
    }
    
    const openSet = [];
    const closedSet = [];
    const startNode = new Node(startX, startY, 0, heuristic(startX, startY, targetX, targetY));
    openSet.push(startNode);
    
    while (openSet.length > 0) {
        // Find node with lowest f cost
        let currentIndex = 0;
        for (let i = 0; i < openSet.length; i++) {
            if (openSet[i].f < openSet[currentIndex].f) {
                currentIndex = i;
            }
        }
        
        const current = openSet[currentIndex];
        
        // Check if we reached the target
        if (current.x === targetX && current.y === targetY) {
            // Reconstruct path
            const path = [];
            let temp = current;
            while (temp !== null) {
                path.push({ x: temp.x, y: temp.y });
                temp = temp.parent;
            }
            return path.reverse();
        }
        
        // Move current from open to closed set
        openSet.splice(currentIndex, 1);
        closedSet.push(current);
        
        // Check all adjacent nodes
        const directions = [
            { x: 0, y: -1 }, // up
            { x: 1, y: 0 },  // right
            { x: 0, y: 1 },  // down
            { x: -1, y: 0 }  // left
        ];
        
        for (const dir of directions) {
            const x = current.x + dir.x;
            const y = current.y + dir.y;
            
            // Skip invalid or blocked positions
            if (!isValid(x, y) || isBlocked(x, y)) {
                continue;
            }
            
            // Skip if in closed set
            if (closedSet.some(node => node.x === x && node.y === y)) {
                continue;
            }
            
            const g = current.g + 1;
            const h = heuristic(x, y, targetX, targetY);
            const newNode = new Node(x, y, g, h);
            newNode.parent = current;
            
            // Skip if already in open set with better path
            const existingOpenNode = openSet.find(node => node.x === x && node.y === y);
            if (existingOpenNode) {
                if (g < existingOpenNode.g) {
                    existingOpenNode.g = g;
                    existingOpenNode.f = g + existingOpenNode.h;
                    existingOpenNode.parent = current;
                }
            } else {
                openSet.push(newNode);
            }
        }
    }
    
    // No path found
    return null;
}

// Get a random task from available tasks
function getRandomTask() {
    const index = Math.floor(Math.random() * TASK_TYPES.length);
    return TASK_TYPES[index];
}

// Check if requirements can be fulfilled with available components
function canFulfillRequirements(requirements, gameData, botId) {
    // Check for each component type
    for (const type in requirements) {
        const count = requirements[type];
        
        // For servers, we just need the right count
        if (type === 'server' && gameData.items.server.length < count) {
            return false;
        }
        
        // For bots, we need enough OTHER bots (not including this one)
        if (type === 'bot') {
            // Count available bots (excluding the current one)
            const availableBots = gameData.items.bot.filter(bot => 
                !activeBotTasks[bot.x + ',' + bot.y] && // not already on a task
                (bot.x + ',' + bot.y !== botId) // not the current bot
            ).length;
            
            if (availableBots < count) {
                return false;
            }
        }
    }
    
    return true;
}

// Find nearest component of a specific type
function findNearestComponent(botX, botY, type, gameData, excludeComponents = []) {
    const components = gameData.items[type];
    let nearest = null;
    let minDistance = Infinity;
    
    for (const component of components) {
        // Skip components that are in the exclude list
        if (excludeComponents.some(c => c.x === component.x && c.y === component.y)) {
            continue;
        }
        
        // Calculate Manhattan distance
        const distance = Math.abs(botX - component.x) + Math.abs(botY - component.y);
        
        if (distance < minDistance) {
            minDistance = distance;
            nearest = component;
        }
    }
    
    return nearest;
}

// Reserve components needed for a task
function reserveComponents(requirements, botX, botY, gameData) {
    const reserved = [];
    
    // For each component type
    for (const type in requirements) {
        const count = requirements[type];
        
        // Skip bot requirements for now (handled differently)
        if (type === 'bot') continue;
        
        // Find and reserve the needed components
        for (let i = 0; i < count; i++) {
            // Find nearest component excluding already reserved ones
            const component = findNearestComponent(botX, botY, type, gameData, reserved);
            
            if (component) {
                reserved.push({
                    type: type,
                    x: component.x,
                    y: component.y
                });
            }
        }
    }
    
    return reserved;
}

// Initialize task simulator
function initTaskSimulator(gameData) {
    // Reset state
    activeBotTasks = {};
    componentCooldowns = {};
    
    // Assign a unique ID to each component for tracking
    gameData.items.pc.forEach(pc => {
        pc.id = `pc_${pc.x}_${pc.y}`;
    });
    
    gameData.items.server.forEach(server => {
        server.id = `server_${server.x}_${server.y}`;
    });
    
    gameData.items.bot.forEach(bot => {
        bot.id = `bot_${bot.x}_${bot.y}`;
        bot.state = BOT_STATE.IDLE;
        bot.task = null;
        bot.targetComponent = null;
        bot.path = null;
        bot.pathIndex = 0;
        bot.visitedComponents = [];
    });
    
    // Start passive income
    startPassiveIncome(gameData);
}

// Update simulator state (call this every game tick)
function updateTaskSimulator(gameData) {
    // Process cooldowns
    for (const key in componentCooldowns) {
        if (componentCooldowns[key] > 0) {
            componentCooldowns[key] -= 1;
            if (componentCooldowns[key] <= 0) {
                delete componentCooldowns[key];
            }
        }
    }
    
    // Process each bot
    gameData.items.bot.forEach(bot => {
        // Skip inactive bots
        if (!bot.active) return;
        
        const botKey = `${bot.x},${bot.y}`;
        
        // If bot is idle, check if it can get a task
        if (bot.state === BOT_STATE.IDLE || !bot.state) {
            // Find nearest PC
            const nearestPC = findNearestComponent(bot.x, bot.y, 'pc', gameData);
            
            if (nearestPC) {
                // Set state to moving to PC
                bot.state = BOT_STATE.MOVING_TO_PC;
                bot.targetComponent = nearestPC;
                bot.path = findPath(bot.x, bot.y, nearestPC.x, nearestPC.y, gameData.map);
                bot.pathIndex = 0;
                
                // Add to active tasks
                activeBotTasks[botKey] = {
                    botId: botKey,
                    state: BOT_STATE.MOVING_TO_PC
                };
                
                writeToTerminal(`Bot at (${bot.x}, ${bot.y}) is heading to PC at (${nearestPC.x}, ${nearestPC.y}) to get a task.`);
            }
        }
        // If bot is moving to PC
        else if (bot.state === BOT_STATE.MOVING_TO_PC) {
            if (bot.path && bot.pathIndex < bot.path.length) {
                // Move along path
                const nextStep = bot.path[bot.pathIndex];
                
                // Store the current position components
                const currentPos = { x: bot.x, y: bot.y };
                
                // Update bot position on the map without erasing PCs or components
                // Only clear the previous position if it wasn't a PC, server, or other component
                let tileValue = gameData.map[bot.y][bot.x];
                
                // Check if we're on a PC (don't erase it when moving away)
                let isPCPos = false;
                gameData.items.pc.forEach(pc => {
                    if (pc.x === bot.x && pc.y === bot.y) {
                        isPCPos = true;
                        tileValue = 1; // PC value
                    }
                });
                
                // Check if we're on a server
                let isServerPos = false;
                gameData.items.server.forEach(server => {
                    if (server.x === bot.x && server.y === bot.y) {
                        isServerPos = true;
                        tileValue = 2; // Server value
                    }
                });
                
                // Only set to 0 if not a component position
                if (!isPCPos && !isServerPos) {
                    gameData.map[bot.y][bot.x] = 0; // Clear previous position
                } else {
                    gameData.map[bot.y][bot.x] = tileValue; // Restore the component
                }
                
                // Check if next position is a PC or server (to not overwrite it permanently)
                let targetIsPCPos = false;
                gameData.items.pc.forEach(pc => {
                    if (pc.x === nextStep.x && pc.y === nextStep.y) {
                        targetIsPCPos = true;
                    }
                });
                
                let targetIsServerPos = false; 
                gameData.items.server.forEach(server => {
                    if (server.x === nextStep.x && server.y === nextStep.y) {
                        targetIsServerPos = true;
                    }
                });
                
                // Set new position as bot, but remember we're on a component
                gameData.map[nextStep.y][nextStep.x] = 3; // Set new position as bot
                
                // Store what we're standing on for when we move away
                if (targetIsPCPos) {
                    bot.standingOn = 1; // PC
                } else if (targetIsServerPos) {
                    bot.standingOn = 2; // Server
                } else {
                    bot.standingOn = 0; // Empty
                }
                
                // Update bot coordinates
                bot.x = nextStep.x;
                bot.y = nextStep.y;
                bot.pathIndex++;
                
                // Update bot task key
                const newBotKey = `${bot.x},${bot.y}`;
                if (botKey !== newBotKey) {
                    activeBotTasks[newBotKey] = activeBotTasks[botKey];
                    delete activeBotTasks[botKey];
                }
            } else {
                // Reached PC, get task
                bot.state = BOT_STATE.GETTING_TASK;
                
                // Get a random task
                const task = getRandomTask();
                bot.task = task;
                
                writeToTerminal(`Bot at (${bot.x}, ${bot.y}) received task: ${task.name}`);
                writeToTerminal(`Requirements: ${JSON.stringify(task.requirements)}`);
                
                // Check if requirements can be met
                if (canFulfillRequirements(task.requirements, gameData, botKey)) {
                    // Reserve components for this task
                    bot.reservedComponents = reserveComponents(task.requirements, bot.x, bot.y, gameData);
                    bot.visitedComponents = [];
                    
                    // Set state to move to first component if there are any
                    if (bot.reservedComponents.length > 0) {
                        const firstComponent = bot.reservedComponents[0];
                        bot.targetComponent = firstComponent;
                        bot.state = BOT_STATE.MOVING_TO_COMPONENT;
                        bot.path = findPath(bot.x, bot.y, firstComponent.x, firstComponent.y, gameData.map);
                        bot.pathIndex = 0;
                        
                        writeToTerminal(`Bot is moving to first component: ${firstComponent.type} at (${firstComponent.x}, ${firstComponent.y})`);
                    } else {
                        // No components needed, return to PC to complete
                        bot.state = BOT_STATE.RETURNING_TO_PC;
                        const pc = bot.targetComponent; // Still the PC from earlier
                        bot.path = findPath(bot.x, bot.y, pc.x, pc.y, gameData.map);
                        bot.pathIndex = 0;
                        
                        writeToTerminal(`No components needed for this task. Bot returning to PC.`);
                    }
                } else {
                    writeToTerminal(`Cannot fulfill task requirements. Cancelling task.`);
                    bot.state = BOT_STATE.IDLE;
                    bot.task = null;
                    delete activeBotTasks[botKey];
                }
            }
        }
        // If bot is moving to a component
        else if (bot.state === BOT_STATE.MOVING_TO_COMPONENT) {
            if (bot.path && bot.pathIndex < bot.path.length) {
                // Move along path
                const nextStep = bot.path[bot.pathIndex];
                
                // Check what we're standing on and restore it after we move
                if (bot.standingOn !== undefined) {
                    gameData.map[bot.y][bot.x] = bot.standingOn;
                } else {
                    gameData.map[bot.y][bot.x] = 0; // Clear previous position if not tracked
                }
                
                // Check if next position is a PC or server
                let nextTileType = 0;
                gameData.items.pc.forEach(pc => {
                    if (pc.x === nextStep.x && pc.y === nextStep.y) {
                        nextTileType = 1;
                    }
                });
                
                gameData.items.server.forEach(server => {
                    if (server.x === nextStep.x && server.y === nextStep.y) {
                        nextTileType = 2;
                    }
                });
                
                // Store what we'll be standing on
                bot.standingOn = nextTileType;
                
                // Set new position as bot
                gameData.map[nextStep.y][nextStep.x] = 3;
                
                // Update bot coordinates
                bot.x = nextStep.x;
                bot.y = nextStep.y;
                bot.pathIndex++;
                
                // Update bot task key
                const newBotKey = `${bot.x},${bot.y}`;
                if (botKey !== newBotKey) {
                    activeBotTasks[newBotKey] = activeBotTasks[botKey];
                    delete activeBotTasks[botKey];
                }
            } else {
                // Reached component, start working
                bot.state = BOT_STATE.WORKING_ON_COMPONENT;
                
                // Set cooldown on component (2 seconds)
                const componentKey = `${bot.targetComponent.x},${bot.targetComponent.y}`;
                componentCooldowns[componentKey] = 2;
                
                // Add to visited components
                bot.visitedComponents.push(bot.targetComponent);
                
                writeToTerminal(`Bot at (${bot.x}, ${bot.y}) is working on ${bot.targetComponent.type} for 2 seconds.`);
                
                // After 2 seconds (will be handled next update)
                setTimeout(() => {
                    if (bot.state === BOT_STATE.WORKING_ON_COMPONENT) {
                        // Check if there are more components to visit
                        const nextComponentIndex = bot.visitedComponents.length;
                        if (nextComponentIndex < bot.reservedComponents.length) {
                            // Move to next component
                            const nextComponent = bot.reservedComponents[nextComponentIndex];
                            bot.targetComponent = nextComponent;
                            bot.state = BOT_STATE.MOVING_TO_COMPONENT;
                            bot.path = findPath(bot.x, bot.y, nextComponent.x, nextComponent.y, gameData.map);
                            bot.pathIndex = 0;
                            
                            writeToTerminal(`Bot moving to next component: ${nextComponent.type} at (${nextComponent.x}, ${nextComponent.y})`);
                        } else {
                            // All components visited, return to PC
                            const pc = findNearestComponent(bot.x, bot.y, 'pc', gameData);
                            bot.targetComponent = pc;
                            bot.state = BOT_STATE.RETURNING_TO_PC;
                            bot.path = findPath(bot.x, bot.y, pc.x, pc.y, gameData.map);
                            bot.pathIndex = 0;
                            
                            writeToTerminal(`Bot has visited all components and is returning to PC.`);
                        }
                    }
                }, 2000);
            }
        }
        // If bot is returning to PC
        else if (bot.state === BOT_STATE.RETURNING_TO_PC) {
            if (bot.path && bot.pathIndex < bot.path.length) {
                // Move along path
                const nextStep = bot.path[bot.pathIndex];
                
                // Restore what the bot was standing on
                if (bot.standingOn !== undefined) {
                    gameData.map[bot.y][bot.x] = bot.standingOn;
                } else {
                    gameData.map[bot.y][bot.x] = 0; // Clear previous position
                }
                
                // Check if next position is a PC or server
                let nextTileType = 0;
                gameData.items.pc.forEach(pc => {
                    if (pc.x === nextStep.x && pc.y === nextStep.y) {
                        nextTileType = 1;
                    }
                });
                
                gameData.items.server.forEach(server => {
                    if (server.x === nextStep.x && server.y === nextStep.y) {
                        nextTileType = 2;
                    }
                });
                
                // Store what we'll be standing on
                bot.standingOn = nextTileType;
                
                // Set new position as bot
                gameData.map[nextStep.y][nextStep.x] = 3;
                
                // Update bot coordinates
                bot.x = nextStep.x;
                bot.y = nextStep.y;
                bot.pathIndex++;
                
                // Update bot task key
                const newBotKey = `${bot.x},${bot.y}`;
                if (botKey !== newBotKey) {
                    activeBotTasks[newBotKey] = activeBotTasks[botKey];
                    delete activeBotTasks[botKey];
                }
            } else {
                // Reached PC, complete task
                bot.state = BOT_STATE.COMPLETING_TASK;
                
                // Add reward
                if (bot.task) {
                    // Add cash reward
                    gameData.cash += bot.task.reward;
                    
                    // Add popularity from the task
                    gameData.nodePopularity += Math.floor(bot.task.reward / 10);
                    
                    // Apply stat bonus to the specific network stat
                    if (bot.task.statBonus) {
                        const { type, amount } = bot.task.statBonus;
                        
                        // Increase the stat
                        gameData.networkStats[type] += amount;
                        
                        // Add to history
                        gameData.networkStats.history[type].push(gameData.networkStats[type]);
                        
                        writeToTerminal(`Bot completed task: ${bot.task.name}`);
                        writeToTerminal(`Earned $${bot.task.reward}, ${Math.floor(bot.task.reward / 10)} popularity, and ${amount} ${type}.`);
                    } else {
                        writeToTerminal(`Bot completed task: ${bot.task.name}`);
                        writeToTerminal(`Earned $${bot.task.reward} and ${Math.floor(bot.task.reward / 10)} popularity.`);
                    }
                    
                    // Calculate new passive income
                    const income = calculatePassiveIncome(gameData);
                    writeToTerminal(`Network now generates $${income} per second.`);
                    
                    // Update stats
                    updateUI();
                }
                
                // Reset bot state
                bot.state = BOT_STATE.IDLE;
                bot.task = null;
                bot.targetComponent = null;
                bot.reservedComponents = [];
                bot.visitedComponents = [];
                
                // Remove from active tasks
                delete activeBotTasks[botKey];
                
                writeToTerminal(`Bot at (${bot.x}, ${bot.y}) is now idle and ready for a new task.`);
            }
        }
    });
}

// Add commands to the game's command processor
function addTaskSimulatorCommands(gameData, processCommand) {
    // Store the original processCommand function
    const originalProcessCommand = processCommand;
    
    // Return a new function that extends the original
    return function(command) {
        const cmd = command.toLowerCase();
        
        if (cmd === 'sim start' || cmd === 'start sim') {
            // Check if there's at least one PC and one bot
            if (gameData.items.pc.length === 0) {
                writeToTerminal('No PCs available. Add a PC first with "add pc".');
                return;
            }
            
            if (gameData.items.bot.length === 0) {
                writeToTerminal('No bots available. Add a bot first with "add bot".');
                return;
            }
            
            // Initialize and start the simulation
            initTaskSimulator(gameData);
            
            // Start simulation update interval
            if (window.simulationInterval) {
                clearInterval(window.simulationInterval);
            }
            window.simulationInterval = setInterval(() => {
                updateTaskSimulator(gameData);
            }, 1000); // Update every second
            
            // Start passive income generation
            startPassiveIncome(gameData);
            
            // Calculate current passive income
            const income = calculatePassiveIncome(gameData);
            
            writeToTerminal('Task simulation started. Bots will now automatically seek tasks from PCs.');
            writeToTerminal('Available tasks: ' + TASK_TYPES.length);
            writeToTerminal('Add more PCs, servers and bots to increase efficiency.');
            writeToTerminal(`Your network generates $${income} per second based on your network stats.`);
            writeToTerminal('Use "sim stop" to stop the simulation.');
            
        } else if (cmd === 'sim stop' || cmd === 'stop sim') {
            // Stop the simulation
            if (window.simulationInterval) {
                clearInterval(window.simulationInterval);
                window.simulationInterval = null;
            }
            
            // Stop passive income
            stopPassiveIncome();
            
            // Reset bot states
            gameData.items.bot.forEach(bot => {
                bot.state = BOT_STATE.IDLE;
                bot.task = null;
                bot.targetComponent = null;
            });
            
            // Clear active tasks
            activeBotTasks = {};
            
            writeToTerminal('Task simulation stopped. All bots have been reset to idle state.');
            writeToTerminal('Network passive income generation paused.');
            
        } else if (cmd === 'sim status' || cmd === 'status sim') {
            // Show status of simulation
            const activeBots = gameData.items.bot.filter(bot => bot.state !== BOT_STATE.IDLE).length;
            const totalBots = gameData.items.bot.length;
            
            writeToTerminal(`Simulation status: ${window.simulationInterval ? 'Running' : 'Stopped'}`);
            writeToTerminal(`Active bots: ${activeBots}/${totalBots}`);
            writeToTerminal(`PCs: ${gameData.items.pc.length}`);
            writeToTerminal(`Servers: ${gameData.items.server.length}`);
            
            // Show network stats
            writeToTerminal('Network Stats:');
            writeToTerminal(`  Power s/H: ${gameData.networkStats.powerSH}`);
            writeToTerminal(`  Popularity: ${gameData.networkStats.popularity}`);
            writeToTerminal(`  Speed: ${gameData.networkStats.speed}`);
            writeToTerminal(`  Algorithm: ${gameData.networkStats.algorithm}`);
            
            // Show passive income
            const income = calculatePassiveIncome(gameData);
            writeToTerminal(`Current passive income: $${income} per second`);
            
            // Show individual bot status
            gameData.items.bot.forEach((bot, index) => {
                const state = bot.state || BOT_STATE.IDLE;
                const taskName = bot.task ? bot.task.name : 'None';
                
                writeToTerminal(`Bot ${index + 1} at (${bot.x}, ${bot.y}): ${state}, task: ${taskName}`);
            });
            
        } else if (cmd === 'sim help' || cmd === 'help sim') {
            // Show sim commands
            writeToTerminal('Simulation Commands:');
            writeToTerminal('  sim start - Start the task simulation');
            writeToTerminal('  sim stop - Stop the task simulation');
            writeToTerminal('  sim status - Show simulation status');
            writeToTerminal('  sim help - Show simulation commands');
            writeToTerminal('');
            writeToTerminal('Tasks give cash rewards and increase one network statistic:');
            writeToTerminal('  - Power s/H: Processing power of your network');
            writeToTerminal('  - Popularity: How well-known your network is');
            writeToTerminal('  - Speed: How fast your network operates');
            writeToTerminal('  - Algorithm: How efficient your systems are');
            writeToTerminal('');
            writeToTerminal('Your network generates passive income based on:');
            writeToTerminal('  (Power × Popularity × Speed × Algorithm) factors');
            
        } else {
            // Not a simulation command, call the original processCommand
            return originalProcessCommand(command);
        }
    };
}

// Update the help command to include simulation commands
function updateHelpCommand(processCommand) {
    const originalProcessCommand = processCommand;
    
    return function(command) {
        if (command.toLowerCase() === 'help') {
            writeToTerminal('Available commands:');
            writeToTerminal('  help - Show this help');
            writeToTerminal('  stats - Show your current stats');
            writeToTerminal('  clear - Clear the terminal');
            writeToTerminal('  data - Toggle data view');
            writeToTerminal('  add pc - Add a PC (cost: $100)');
            writeToTerminal('  add server - Add a server (cost: $300)');
            writeToTerminal('  add bot - Add a bot (cost: $500)');
            writeToTerminal('  start - Start your services');
            writeToTerminal('  stop - Stop your services');
            writeToTerminal('  sim start - Start task simulation');
            writeToTerminal('  sim stop - Stop task simulation');
            writeToTerminal('  sim status - Show simulation status');
            writeToTerminal('  sim help - Show simulation commands');
        } else {
            return originalProcessCommand(command);
        }
    };
}

// Export functions to be used in the main game
window.TaskSimulator = {
    init: initTaskSimulator,
    update: updateTaskSimulator,
    addCommands: addTaskSimulatorCommands,
    updateHelp: updateHelpCommand,
    startPassiveIncome: startPassiveIncome,
    stopPassiveIncome: stopPassiveIncome,
    calculatePassiveIncome: calculatePassiveIncome
}; 