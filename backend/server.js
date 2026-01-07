const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { initDB, getRandomQuestions } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = 3001;

// Structure de données pour les sessions
const sessions = new Map();

// Génération de code de session unique
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Calcul des points selon le temps de réponse
function calculatePoints(timeSpent) {
  const seconds = timeSpent / 1000;
  if (seconds < 5) return 10;
  if (seconds <= 10) return 5;
  return 2;
}

// Initialisation de la base de données
initDB();

io.on('connection', (socket) => {
  console.log(`Nouveau client connecté: ${socket.id}`);

  // Créer une nouvelle session
  socket.on('create-session', async ({ nickname, numQuestions }) => {
    const code = generateCode();
    const questions = await getRandomQuestions(numQuestions);
    
    const session = {
      code,
      host: socket.id,
      players: [{ id: socket.id, nickname, score: 0 }],
      questions,
      currentQuestion: 0,
      started: false,
      answersReceived: 0
    };
    
    sessions.set(code, session);
    socket.join(code);
    
    socket.emit('session-created', session);
    console.log(`Session créée: ${code} par ${nickname}`);
  });

  // Rejoindre une session existante
  socket.on('join-session', ({ code, nickname }) => {
    const session = sessions.get(code);
    
    if (!session) {
      socket.emit('error-msg', 'Session introuvable');
      return;
    }
    
    if (session.started) {
      socket.emit('error-msg', 'La partie a déjà commencé');
      return;
    }
    
    const existingPlayer = session.players.find(p => p.nickname === nickname);
    if (existingPlayer) {
      socket.emit('error-msg', 'Ce pseudo est déjà pris');
      return;
    }
    
    session.players.push({ id: socket.id, nickname, score: 0 });
    socket.join(code);
    
    io.to(code).emit('session-updated', session);
    console.log(`${nickname} a rejoint la session ${code}`);
  });

  // Démarrer la partie
  socket.on('start-game', ({ code }) => {
    const session = sessions.get(code);
    
    if (!session || session.host !== socket.id) {
      socket.emit('error-msg', 'Non autorisé');
      return;
    }
    
    session.started = true;
    session.currentQuestion = 0;
    session.answersReceived = 0;
    
    io.to(code).emit('game-started', session);
    console.log(`Partie démarrée pour la session ${code}`);
  });

  // Soumettre une réponse
  socket.on('submit-answer', ({ code, answerIndex, timeSpent }) => {
    const session = sessions.get(code);
    
    if (!session) return;
    
    const player = session.players.find(p => p.id === socket.id);
    if (!player) return;
    
    const currentQ = session.questions[session.currentQuestion];
    const isCorrect = answerIndex === currentQ.bonne_reponse - 1;
    
    if (isCorrect) {
      const points = calculatePoints(timeSpent);
      player.score += points;
    }
    
    session.answersReceived++;
    
    // Si tout le monde a répondu ou le temps est écoulé
    if (session.answersReceived >= session.players.length) {
      revealAnswer(code);
    }
  });

  // Passer à la question suivante
  socket.on('next-question', ({ code }) => {
    const session = sessions.get(code);
    
    if (!session || session.host !== socket.id) return;
    
    session.currentQuestion++;
    session.answersReceived = 0;
    
    if (session.currentQuestion >= session.questions.length) {
      // Partie terminée
      session.players.sort((a, b) => b.score - a.score);
      io.to(code).emit('game-over', session);
      console.log(`Partie terminée pour la session ${code}`);
    } else {
      // Question suivante
      io.to(code).emit('game-started', session);
    }
  });

  // Révéler la bonne réponse
  function revealAnswer(code) {
    const session = sessions.get(code);
    if (!session) return;
    
    const currentQ = session.questions[session.currentQuestion];
    const correct = currentQ.bonne_reponse - 1;
    
    io.to(code).emit('reveal-answer', { session, correct });
  }

  // Déconnexion
  socket.on('disconnect', () => {
    console.log(`Client déconnecté: ${socket.id}`);
    
    // Nettoyer les sessions
    for (const [code, session] of sessions.entries()) {
      const playerIndex = session.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        session.players.splice(playerIndex, 1);
        
        if (session.players.length === 0) {
          sessions.delete(code);
          console.log(`Session ${code} supprimée (vide)`);
        } else {
          io.to(code).emit('session-updated', session);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
