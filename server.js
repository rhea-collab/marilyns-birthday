const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms[code] ? generateCode() : code;
}

function getQuestions() {
  return {
    'marilyn-trivia': [
      { id: 'mt1', text: 'Who at this table knows the most about teenage Marilyn?', type: 'challenge', instruction: 'You have the option to challenge here, or select two people to answer' },
      { id: 'mt2', text: "What is Marilyn's go-to comfort food?", type: 'challenge', instruction: 'You have the option to challenge' },
      { id: 'mt3', text: "Who is Marilyn's celebrity crush?", type: 'challenge', instruction: 'You have the option to challenge' },
      { id: 'mt4', text: "What's a tiny detail about Marilyn that everyone should know?", type: 'wildcard', instruction: 'Everyone has to answer this question' },
      { id: 'mt5', text: "What would Marilyn's memoir be called?", type: 'challenge', instruction: 'Choose up to two challengers and Marilyn picks a winner' },
      { id: 'mt6', text: 'Yakhne on the rice or next to the rice?', type: 'debate', instruction: 'Challenge Marilyn to a debate' },
      { id: 'mt7', text: 'Window seat or aisle seat?', type: 'debate', instruction: 'Challenge Marilyn to a debate' },
      { id: 'mt8', text: "What's the most Marilyn thing Marilyn has ever done?", type: 'open' },
      { id: 'mt9', text: 'What is your favorite memory of Marilyn?', type: 'open' },
    ],
    'cosmic-chaos': [
      { id: 'cc1', text: 'What cosmic lesson has Marilyn taught you?', type: 'wildcard', instruction: 'Everyone has to answer' },
      { id: 'cc2', text: 'If you were stranded on an island with Marilyn, what three things do you know she\'ll bring?', type: 'open' },
      { id: 'cc3', text: 'Marilyn starts a cult. What is it called?', type: 'open' },
      { id: 'cc4', text: "Invent Marilyn's signature cocktail.", type: 'challenge', instruction: 'Name a challenger and Marilyn gets to pick a winner' },
      { id: 'cc5', text: 'If Marilyn were a city, what fruit would she be?', type: 'open' },
      { id: 'cc6', text: "Let's get on a time machine. Choose an era to visit with Marilyn. What would you do?", type: 'open' },
      { id: 'cc7', text: "Let's work together and build a birthday wish sentence for Marilyn. You can only say one word and hand it over to the person next to you.", type: 'wildcard', instruction: 'Everyone participates' },
      { id: 'cc8', text: 'Would Marilyn thrive more in...', type: 'vote', instruction: 'Pick sides, let\'s vote!', options: ['A castle', 'On a yacht', 'A tiny European village', 'A penthouse'] },
      { id: 'cc9', text: 'Marilyn in another lifetime was...', type: 'vote', instruction: 'Pick sides, let\'s vote!', options: ['Royalty', 'A jazz singer', 'A pirate', 'A wizard', 'An oracle', 'A doctor', 'A painter'] },
      { id: 'cc10', text: 'What is the funniest possible career Marilyn could accidentally become famous for?', type: 'debate', instruction: 'Table debate' },
      { id: 'cc11', text: 'If Marilyn were a mix of two colors, what would they be?', type: 'open' },
    ],
    'heart-strings': [
      { id: 'hs1', text: 'What does friendship with Marilyn feel like?', type: 'wildcard', instruction: 'Everyone has to answer' },
      { id: 'hs2', text: 'What is your favorite memory with Marilyn?', type: 'open' },
      { id: 'hs3', text: "What's something beautiful about getting older?", type: 'challenge', instruction: 'You and Marilyn have to answer' },
      { id: 'hs4', text: 'Describe a moment when Marilyn really showed up for you.', type: 'open' },
      { id: 'hs5', text: "What's one thing Marilyn has inspired you to change in your life?", type: 'open' },
      { id: 'hs6', text: "Everyone around the table says one blessing for Marilyn's next decade.", type: 'wildcard', instruction: 'Everyone participates' },
      { id: 'hs7', text: 'What do you hope Gaby will inherit from her mom?', type: 'open' },
      { id: 'hs8', text: 'What do you think 25-year-old Marilyn would be proud of today? And what would 80-year-old Marilyn tell you today?', type: 'open', instruction: 'This one is for Marilyn' },
      { id: 'hs9', text: 'Tell Marilyn something you hope she never forgets about herself.', type: 'open' },
    ],
    'prophecies': [
      { id: 'pr1', text: "What's an experience you'd like to have with Marilyn in the next decade?", type: 'open' },
      { id: 'pr2', text: "Describe Marilyn's next era in 3 words.", type: 'challenge', instruction: 'You can choose someone else to answer with you' },
      { id: 'pr3', text: 'What should Marilyn manifest this decade?', type: 'open', instruction: 'Also ask Marilyn what she is manifesting' },
      { id: 'pr4', text: 'Which fictional character would guide Marilyn through her 40s?', type: 'challenge', instruction: 'You can choose a challenger' },
      { id: 'pr5', text: "Where will we celebrate Marilyn's 50th?", type: 'open' },
      { id: 'pr6', text: 'Marilyn is in Times Square. What did she do to get herself there?', type: 'open' },
      { id: 'pr7', text: 'What unexpected thing will Marilyn become obsessed with in her 40s?', type: 'open' },
      { id: 'pr8', text: 'What big adventure will Marilyn go on in her 40s?', type: 'open' },
    ],
    'choose-your-destiny': [
      { id: 'cd1', text: 'Marilyn must choose ONE forever:', type: 'choose', options: ['Candlelit dinners', 'Wild dance floors', 'Long beach lunches', 'Late-night kitchen conversations'] },
      { id: 'cd2', text: 'Marilyn can instantly master one skill:', type: 'choose', options: ['Speaking every language', 'Singing beautifully', 'Reading minds', 'Never getting tired'] },
      { id: 'cd3', text: 'Marilyn can relive ONE year of her life. Which year is it?', type: 'open' },
      { id: 'cd4', text: 'Marilyn must permanently move to:', type: 'choose', options: ['Paris', 'Mexico City', 'Istanbul', 'New York', 'A tiny Greek island'] },
      { id: 'cd5', text: 'Marilyn, choose your signature future accessory:', type: 'choose', options: ['Oversized sunglasses', 'Silk scarves', 'Gold jewelry', 'Dramatic coats', 'A permanent wine glass'] },
      { id: 'cd6', text: "Marilyn's future home MUST include:", type: 'choose', options: ['A giant bathtub', 'Ocean view', 'Candlelit terrace', 'Secret library', 'Chaotic dinner table'] },
      { id: 'cd7', text: 'Marilyn, your next chapter feels most like:', type: 'choose', options: ['Moonlight', 'Fire', 'Velvet', 'Ocean air', 'Disco balls', 'Sparkles'] },
      { id: 'cd8', text: 'Marilyn, choose one:', type: 'choose', options: ['Forever aisle seat but janerik all year round', 'Unlimited mikado but have to take out the trash everyday', 'Always being asked to unmute on Zoom but have a slide maker ready', 'Monthly visits to Paris but the wine is mid'] },
      { id: 'cd9', text: 'Marilyn has to choose where we are ALL moving for retirement!', type: 'open' },
    ],
  };
}

// How long to keep a disconnected player before removing them (5 minutes)
const DISCONNECT_TIMEOUT = 5 * 60 * 1000;

io.on('connection', (socket) => {
  let currentRoom = null;
  let playerName = null;

  socket.on('create-room', (name) => {
    const code = generateCode();
    playerName = name;
    currentRoom = code;
    rooms[code] = {
      players: [{ id: socket.id, name, isMC: true, connected: true }],
      questions: getQuestions(),
      drawnCards: {},
      gameStarted: false,
      votes: {},
      currentTurn: null,
    };
    socket.join(code);
    socket.emit('room-created', { code, players: rooms[code].players });
  });

  socket.on('join-room', ({ name, code }) => {
    const room = rooms[code.toUpperCase()];
    if (!room) return socket.emit('error-msg', 'Room not found. Check the code and try again.');

    // Check if this player is rejoining (same name, disconnected)
    const existing = room.players.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (existing.connected) {
        return socket.emit('error-msg', 'That name is already taken. Pick another!');
      }
      // Rejoin: update their socket id and mark connected
      existing.id = socket.id;
      existing.connected = true;
      // Clear any pending removal timer
      if (existing.disconnectTimer) {
        clearTimeout(existing.disconnectTimer);
        delete existing.disconnectTimer;
      }
    } else {
      room.players.push({ id: socket.id, name, isMC: false, connected: true });
    }

    playerName = name;
    currentRoom = code.toUpperCase();
    socket.join(currentRoom);

    socket.emit('room-joined', {
      code: currentRoom,
      players: room.players,
      gameStarted: room.gameStarted,
      drawnCards: room.drawnCards,
      currentTurn: room.currentTurn,
    });
    socket.to(currentRoom).emit('player-joined', { name, players: room.players });
  });

  // Rejoin handler — client sends this automatically on reconnect
  socket.on('rejoin', ({ name, code }) => {
    const room = rooms[code];
    if (!room) return socket.emit('rejoin-failed');

    const existing = room.players.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (!existing) return socket.emit('rejoin-failed');

    // Update socket id and mark connected
    existing.id = socket.id;
    existing.connected = true;
    if (existing.disconnectTimer) {
      clearTimeout(existing.disconnectTimer);
      delete existing.disconnectTimer;
    }

    playerName = name;
    currentRoom = code;
    socket.join(code);

    socket.emit('room-joined', {
      code,
      players: room.players,
      gameStarted: room.gameStarted,
      drawnCards: room.drawnCards,
      currentTurn: room.currentTurn,
    });
    socket.to(code).emit('player-joined', { name, players: room.players });
  });

  socket.on('start-game', () => {
    const room = rooms[currentRoom];
    if (!room) return;
    room.gameStarted = true;
    const mc = room.players.find(p => p.isMC);
    room.currentTurn = mc ? mc.name : room.players[0].name;
    io.to(currentRoom).emit('game-started', { currentTurn: room.currentTurn });
  });

  socket.on('set-turn', (targetName) => {
    const room = rooms[currentRoom];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isMC) return;
    room.currentTurn = targetName;
    io.to(currentRoom).emit('turn-changed', { currentTurn: targetName });
  });

  socket.on('draw-card', (categoryId) => {
    const room = rooms[currentRoom];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    if (room.currentTurn && room.currentTurn !== player.name && !player.isMC) {
      return socket.emit('error-msg', "It's not your turn!");
    }

    const available = room.questions[categoryId];
    if (!available || available.length === 0)
      return socket.emit('error-msg', 'No more cards in this category!');

    const idx = Math.floor(Math.random() * available.length);
    const question = available.splice(idx, 1)[0];

    if (!room.drawnCards[categoryId]) room.drawnCards[categoryId] = [];
    room.drawnCards[categoryId].push(question.id);

    const remaining = {};
    for (const cat in room.questions) {
      remaining[cat] = room.questions[cat].length;
    }

    io.to(currentRoom).emit('card-drawn', {
      question,
      categoryId,
      drawnBy: playerName,
      remaining,
    });
  });

  socket.on('challenge-player', ({ targetName, questionText }) => {
    const room = rooms[currentRoom];
    if (!room) return;
    io.to(currentRoom).emit('player-challenged', {
      challenger: playerName,
      target: targetName,
      questionText,
    });
  });

  socket.on('cast-vote', ({ questionId, option }) => {
    const room = rooms[currentRoom];
    if (!room) return;
    if (!room.votes[questionId]) room.votes[questionId] = {};
    room.votes[questionId][socket.id] = option;

    const tally = {};
    for (const vote of Object.values(room.votes[questionId])) {
      tally[vote] = (tally[vote] || 0) + 1;
    }
    io.to(currentRoom).emit('vote-updated', { questionId, tally, totalVoters: Object.keys(room.votes[questionId]).length });
  });

  socket.on('disconnect', () => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Mark as disconnected but DON'T remove yet
    player.connected = false;

    // Give them 5 minutes to come back
    player.disconnectTimer = setTimeout(() => {
      if (!rooms[currentRoom]) return;
      // Still disconnected after timeout — remove them
      room.players = room.players.filter(p => p.id !== socket.id || p.connected);

      if (room.players.length === 0) {
        delete rooms[currentRoom];
        return;
      }

      // If MC left, promote someone
      if (!room.players.some(p => p.isMC)) {
        room.players[0].isMC = true;
      }

      io.to(currentRoom).emit('player-left', { name: playerName, players: room.players });
    }, DISCONNECT_TIMEOUT);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  const nets = require('os').networkInterfaces();
  let localIP = 'localhost';
  for (const iface of Object.values(nets)) {
    for (const cfg of iface) {
      if (cfg.family === 'IPv4' && !cfg.internal) { localIP = cfg.address; break; }
    }
  }
  console.log(`\n  Marilyn's 40th Birthday Game is running!\n`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${localIP}:${PORT}`);
  console.log(`\n  Share the Network URL with party guests!\n`);
});
