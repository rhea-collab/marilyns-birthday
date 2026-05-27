const socket = io();

let myName = '';
let isMC = false;
let currentTurn = null;
let players = [];
let currentQuestion = null;
let currentCategory = null;

const categoryImages = {
  'marilyn-trivia': 'images/marilyn-trivia.png',
  'cosmic-chaos': 'images/cosmic-chaos.png',
  'heart-strings': 'images/heart-strings.png',
  'prophecies': 'images/prophecies.png',
  'choose-your-destiny': 'images/choose-your-destiny.png',
};

const categoryInitialCounts = {
  'marilyn-trivia': 9,
  'cosmic-chaos': 11,
  'heart-strings': 9,
  'prophecies': 8,
  'choose-your-destiny': 9,
};

const typeBadgeLabels = {
  open: 'Open',
  challenge: 'Challenge',
  wildcard: 'Wild Card',
  debate: 'Debate',
  vote: 'Vote',
  choose: 'Marilyn Chooses',
};

// ==================
// SPARKLE BACKGROUND
// ==================
function createSparkles() {
  const container = document.getElementById('sparkles');
  const count = 35;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = Math.random() > 0.6 ? 'sparkle star' : 'sparkle';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.setProperty('--dur', (2 + Math.random() * 4) + 's');
    s.style.animationDelay = Math.random() * 4 + 's';
    if (s.classList.contains('star')) {
      const colors = ['#E87DA0', '#FFD700', '#8B45B8', '#5BC0B0', '#FF9800'];
      s.style.background = colors[Math.floor(Math.random() * colors.length)];
    }
    container.appendChild(s);
  }
}
createSparkles();

// ==================
// SCREEN NAVIGATION
// ==================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active', 'fade-in'));
  const screen = document.getElementById(id);
  screen.classList.add('active', 'fade-in');
}

// ==================
// WELCOME SCREEN
// ==================
document.getElementById('btn-create').addEventListener('click', () => {
  const name = document.getElementById('input-name').value.trim();
  if (!name) return showError('Please enter your name!');
  myName = name;
  socket.emit('create-room', name);
});

document.getElementById('btn-join').addEventListener('click', () => {
  const name = document.getElementById('input-name').value.trim();
  const code = document.getElementById('input-code').value.trim().toUpperCase();
  if (!name) return showError('Please enter your name!');
  if (!code || code.length < 4) return showError('Enter a 4-character room code.');
  myName = name;
  socket.emit('join-room', { name, code });
});

document.getElementById('input-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-create').click();
});

document.getElementById('input-code').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-join').click();
});

// ==================
// LOBBY
// ==================
socket.on('room-created', ({ code, players: p }) => {
  isMC = true;
  players = p;
  document.getElementById('room-code-display').textContent = code;
  renderPlayerList();
  document.getElementById('mc-controls').style.display = 'flex';
  document.getElementById('waiting-msg').style.display = 'none';
  showScreen('screen-lobby');
  initRemainingCounts(categoryInitialCounts);
});

socket.on('room-joined', ({ code, players: p, gameStarted, drawnCards, currentTurn: turn }) => {
  isMC = false;
  players = p;
  document.getElementById('room-code-display').textContent = code;
  renderPlayerList();
  document.getElementById('mc-controls').style.display = 'none';
  document.getElementById('waiting-msg').style.display = gameStarted ? 'none' : 'flex';

  if (gameStarted) {
    currentTurn = turn;
    const remaining = {};
    for (const cat in categoryInitialCounts) {
      remaining[cat] = categoryInitialCounts[cat] - (drawnCards[cat] ? drawnCards[cat].length : 0);
    }
    initRemainingCounts(remaining);
    updateTurnUI();
    showScreen('screen-game');
  } else {
    initRemainingCounts(categoryInitialCounts);
    showScreen('screen-lobby');
  }
});

socket.on('player-joined', ({ name, players: p }) => {
  players = p;
  renderPlayerList();
});

socket.on('player-left', ({ name, players: p }) => {
  players = p;
  const wasNotMC = !isMC;
  isMC = players.some(pl => pl.id === socket.id && pl.isMC);
  renderPlayerList();

  if (isMC && wasNotMC) {
    document.getElementById('mc-controls').style.display = 'flex';
    document.getElementById('waiting-msg').style.display = 'none';
  }
});

function renderPlayerList() {
  const list = document.getElementById('player-list');
  list.innerHTML = '';
  players.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'player-item';
    li.innerHTML = `
      <div class="player-avatar avatar-${i % 8}">${p.name[0].toUpperCase()}</div>
      <span>${p.name}${p.name === myName ? ' (you)' : ''}</span>
      ${p.isMC ? '<span class="mc-badge">MC</span>' : ''}
    `;
    list.appendChild(li);
  });
  document.getElementById('player-count-badge').textContent = `${players.length} player${players.length !== 1 ? 's' : ''}`;
}

// ==================
// TURN SYSTEM
// ==================
function updateTurnUI() {
  const banner = document.getElementById('turn-banner');
  const bannerText = document.getElementById('turn-banner-text');
  const grid = document.querySelector('.categories-grid');

  if (!currentTurn) {
    banner.style.display = 'none';
    grid.classList.remove('disabled');
    return;
  }

  const isMyTurn = currentTurn === myName;

  banner.style.display = 'flex';
  banner.classList.toggle('my-turn', isMyTurn);

  if (isMyTurn) {
    bannerText.textContent = "Your turn! Pick a category";
    grid.classList.remove('disabled');
  } else if (isMC) {
    bannerText.textContent = `${currentTurn}'s turn`;
    grid.classList.remove('disabled');
  } else {
    bannerText.textContent = `Waiting for ${currentTurn} to pick...`;
    grid.classList.add('disabled');
  }
}

socket.on('turn-changed', ({ currentTurn: turn }) => {
  currentTurn = turn;
  updateTurnUI();
  showScreen('screen-game');
});

// START GAME
document.getElementById('btn-start').addEventListener('click', () => {
  socket.emit('start-game');
});

socket.on('game-started', (data) => {
  currentTurn = data?.currentTurn || null;
  updateTurnUI();
  showScreen('screen-game');
});

// ==================
// CATEGORY SELECTION
// ==================
function initRemainingCounts(remaining) {
  for (const cat in remaining) {
    const badge = document.querySelector(`[data-remaining="${cat}"]`);
    if (badge) badge.textContent = remaining[cat];
    const card = document.querySelector(`[data-category="${cat}"]`);
    if (card) card.classList.toggle('empty', remaining[cat] <= 0);
  }
}

document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click', () => {
    const cat = card.dataset.category;
    socket.emit('draw-card', cat);
  });
});

// ==================
// CARD DRAWN
// ==================
socket.on('card-drawn', ({ question, categoryId, drawnBy, remaining }) => {
  currentQuestion = question;
  currentCategory = categoryId;

  initRemainingCounts(remaining);

  const cardInner = document.getElementById('card-inner');
  const cardBack = document.getElementById('card-back');
  const frontImg = document.getElementById('card-front-img');

  cardInner.classList.remove('flipped');
  frontImg.src = categoryImages[categoryId];

  cardBack.className = 'card-back cat-' + categoryId;

  document.getElementById('question-type-badge').textContent = typeBadgeLabels[question.type] || 'Open';
  document.getElementById('question-text').textContent = question.text;
  document.getElementById('drawn-by').textContent = `Drawn by ${drawnBy}`;

  // Set instruction — add voting hint for "choose" type
  let instruction = question.instruction || '';
  if (question.type === 'choose') {
    instruction = instruction || 'Vote for what you think Marilyn will pick!';
  }
  document.getElementById('question-instruction').textContent = instruction;

  // Challenge button
  const challengeBtn = document.getElementById('btn-challenge');
  challengeBtn.style.display = (question.type === 'challenge' || question.type === 'debate') ? 'inline-flex' : 'none';

  // Pick Next Player button (MC only)
  document.getElementById('btn-pick-next').style.display = isMC ? 'inline-flex' : 'none';

  // Build options (vote AND choose types both get voting UI)
  const optionsDiv = document.getElementById('question-options');
  const voteResults = document.getElementById('vote-results');
  optionsDiv.innerHTML = '';
  voteResults.innerHTML = '';

  if ((question.type === 'vote' || question.type === 'choose') && question.options) {
    question.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.dataset.option = opt;
      btn.innerHTML = `<span class="option-bullet"></span>${opt}<span class="vote-count"></span>`;
      btn.addEventListener('click', () => {
        optionsDiv.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        socket.emit('cast-vote', { questionId: question.id, option: opt });
      });
      optionsDiv.appendChild(btn);
    });
  }

  showScreen('screen-question');

  requestAnimationFrame(() => {
    setTimeout(() => {
      cardInner.classList.add('flipped');
    }, 400);
  });
});

// VOTE UPDATES
socket.on('vote-updated', ({ questionId, tally, totalVoters }) => {
  if (!currentQuestion || currentQuestion.id !== questionId) return;

  const optionBtns = document.querySelectorAll('#question-options .option-btn');
  optionBtns.forEach(btn => {
    const opt = btn.dataset.option;
    const count = tally[opt] || 0;
    const countSpan = btn.querySelector('.vote-count');
    if (countSpan) countSpan.textContent = count > 0 ? count : '';
  });
});

// ==================
// PICK NEXT PLAYER (MC)
// ==================
document.getElementById('btn-pick-next').addEventListener('click', () => {
  const modal = document.getElementById('modal-turn');
  const list = document.getElementById('turn-player-list');
  list.innerHTML = '';

  players.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'challenge-item';
    li.innerHTML = `<div class="player-avatar avatar-${i % 8}">${p.name[0].toUpperCase()}</div>${p.name}${p.isMC ? ' <span class="mc-badge" style="margin-left:auto">MC</span>' : ''}`;
    li.addEventListener('click', () => {
      socket.emit('set-turn', p.name);
      modal.style.display = 'none';
    });
    list.appendChild(li);
  });

  modal.style.display = 'flex';
});

document.getElementById('btn-cancel-turn').addEventListener('click', () => {
  document.getElementById('modal-turn').style.display = 'none';
});

document.getElementById('modal-turn').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.style.display = 'none';
  }
});

// ==================
// CHALLENGE FLOW
// ==================
document.getElementById('btn-challenge').addEventListener('click', () => {
  const modal = document.getElementById('modal-challenge');
  const list = document.getElementById('challenge-player-list');
  list.innerHTML = '';

  players.forEach((p, i) => {
    if (p.name === myName) return;
    const li = document.createElement('li');
    li.className = 'challenge-item';
    li.innerHTML = `<div class="player-avatar avatar-${i % 8}">${p.name[0].toUpperCase()}</div>${p.name}`;
    li.addEventListener('click', () => {
      socket.emit('challenge-player', {
        targetName: p.name,
        questionText: currentQuestion ? currentQuestion.text : '',
      });
      modal.style.display = 'none';
    });
    list.appendChild(li);
  });

  modal.style.display = 'flex';
});

document.getElementById('btn-cancel-challenge').addEventListener('click', () => {
  document.getElementById('modal-challenge').style.display = 'none';
});

document.getElementById('modal-challenge').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.style.display = 'none';
  }
});

socket.on('player-challenged', ({ challenger, target }) => {
  const toast = document.getElementById('challenge-toast');
  const msg = document.getElementById('toast-message');

  if (target === myName) {
    msg.textContent = `${challenger} challenged YOU!`;
  } else {
    msg.textContent = `${challenger} challenged ${target}!`;
  }

  toast.style.display = 'block';
  toast.style.animation = 'none';
  toast.offsetHeight;
  toast.style.animation = '';

  setTimeout(() => { toast.style.display = 'none'; }, 4000);
});

// ==================
// ERROR HANDLING
// ==================
socket.on('error-msg', (msg) => showError(msg));

function showError(msg) {
  const toast = document.getElementById('error-toast');
  document.getElementById('error-message').textContent = msg;
  toast.style.display = 'block';
  toast.style.animation = 'none';
  toast.offsetHeight;
  toast.style.animation = '';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ==================
// RECONNECTION
// ==================
socket.on('disconnect', () => {
  showError('Connection lost. Reconnecting...');
});

socket.on('connect', () => {
  if (myName && document.getElementById('screen-welcome').classList.contains('active') === false) {
    showError('Reconnected! You may need to rejoin the game.');
  }
});
