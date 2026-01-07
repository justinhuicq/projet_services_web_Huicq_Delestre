import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

export default function App() {
  const [view, setView] = useState('home');
  const [session, setSession] = useState(null);
  const [nickname, setNickname] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [error, setError] = useState(null);
  
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [timer, setTimer] = useState(10);
  
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    socket.on('session-created', (data) => { setSession(data); setView('lobby'); });
    socket.on('session-updated', (data) => { setSession(data); });
    socket.on('game-started', (data) => { 
      setSession(data); 
      setView('game'); 
      resetRound();
    });
    socket.on('reveal-answer', ({ session: updatedSession, correct }) => {
      setSession(updatedSession);
      setCorrectAnswer(correct);
      clearInterval(timerIntervalRef.current);
    });
    socket.on('game-over', (data) => { setSession(data); setView('result'); });
    socket.on('error-msg', (msg) => setError(msg));

    return () => socket.off();
  }, []);

  const resetRound = () => {
    setTimer(10);
    setHasAnswered(false);
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    startTimeRef.current = Date.now();
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          if (!hasAnswered) handleAnswer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (view === 'game' && session?.currentQuestion !== undefined) {
      resetRound();
    }
  }, [session?.currentQuestion]);

  const handleAnswer = (index) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    setSelectedAnswer(index);
    const timeSpent = Date.now() - startTimeRef.current;
    socket.emit('submit-answer', { code: session.code, answerIndex: index, timeSpent });
  };

  // Page d'accueil
  if (view === 'home') return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2">Trivia</h1>
          <p className="text-neutral-500 text-sm">Quiz multijoueur en temps réel</p>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={() => setView('create')} 
            className="w-full bg-neutral-900 text-white py-3.5 px-6 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
          >
            Créer une partie
          </button>
          <button 
            onClick={() => setView('join')} 
            className="w-full bg-white text-neutral-900 py-3.5 px-6 rounded-lg font-medium border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            Rejoindre
          </button>
        </div>
      </div>
    </div>
  );

  // Création ou jonction
  if (view === 'create' || view === 'join') return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <button 
          onClick={() => setView('home')} 
          className="text-neutral-500 text-sm mb-8 hover:text-neutral-700 transition-colors"
        >
          ← Retour
        </button>
        
        <h2 className="text-2xl font-semibold text-neutral-900 mb-8">
          {view === 'create' ? 'Nouvelle partie' : 'Rejoindre une partie'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Pseudo</label>
            <input 
              className="w-full bg-white border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow" 
              placeholder="Ton pseudo" 
              value={nickname} 
              onChange={e => setNickname(e.target.value)} 
            />
          </div>
          
          {view === 'create' ? (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Nombre de questions</label>
              <input 
                className="w-full bg-white border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow" 
                type="number" 
                min="1"
                max="15"
                value={numQuestions} 
                onChange={e => setNumQuestions(e.target.value)} 
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Code de la partie</label>
              <input 
                className="w-full bg-white border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900 placeholder-neutral-400 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow" 
                placeholder="ABC123" 
                value={sessionCode} 
                onChange={e => setSessionCode(e.target.value.toUpperCase())} 
              />
            </div>
          )}
          
          {error && <p className="text-red-600 text-sm">{error}</p>}
          
          <button 
            className="w-full bg-neutral-900 text-white py-3.5 px-6 rounded-lg font-medium hover:bg-neutral-800 transition-colors mt-6"
            onClick={() => view === 'create' 
              ? socket.emit('create-session', {nickname, numQuestions}) 
              : socket.emit('join-session', {code: sessionCode, nickname})
            }
          >
            {view === 'create' ? 'Créer' : 'Rejoindre'}
          </button>
        </div>
      </div>
    </div>
  );

  // Lobby
  if (view === 'lobby') return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <p className="text-neutral-500 text-sm mb-2">Code de la partie</p>
          <div className="text-4xl font-mono font-bold tracking-widest text-neutral-900">{session?.code}</div>
        </div>
        
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-sm font-medium text-neutral-500">{session?.players.length} joueur{session?.players.length > 1 ? 's' : ''}</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {session?.players.map((p, i) => (
              <div key={i} className="px-4 py-3 flex justify-between items-center">
                <span className="text-neutral-900">{p.nickname}</span>
                {p.id === session.host && (
                  <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">Hôte</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {session?.host === socket.id ? (
          <button 
            className="w-full bg-neutral-900 text-white py-3.5 px-6 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            onClick={() => socket.emit('start-game', {code: session.code})}
          >
            Lancer la partie
          </button>
        ) : (
          <p className="text-center text-neutral-500 text-sm">En attente du lancement...</p>
        )}
      </div>
    </div>
  );

  // Jeu
  if (view === 'game' && session) {
    const q = session.questions[session.currentQuestion];
    const currentPlayer = session.players.find(p => p.id === socket.id);
    
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <span className="text-sm text-neutral-500">
              Question {session.currentQuestion + 1}/{session.questions.length}
            </span>
            <span className="text-sm text-neutral-500">
              {currentPlayer?.score || 0} pts
            </span>
          </div>
          
          {/* Timer */}
          <div className="flex justify-center mb-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold border-4 transition-colors ${
              timer <= 3 ? 'border-red-500 text-red-500' : 'border-neutral-200 text-neutral-900'
            }`}>
              {timer}
            </div>
          </div>
          
          {/* Question */}
          <h2 className="text-xl md:text-2xl font-medium text-neutral-900 text-center mb-10 leading-relaxed">
            {q.question}
          </h2>
          
          {/* Réponses */}
          <div className="grid grid-cols-1 gap-3">
            {[1,2,3,4].map(idx => {
              const answerIndex = idx - 1;
              const isCorrect = correctAnswer === answerIndex;
              const isSelected = selectedAnswer === answerIndex;
              const isWrong = isSelected && correctAnswer !== null && !isCorrect;
              
              let buttonClass = "w-full p-4 rounded-xl text-left transition-all border-2 ";
              
              if (isCorrect) {
                buttonClass += "bg-emerald-50 border-emerald-500 text-emerald-900";
              } else if (isWrong) {
                buttonClass += "bg-red-50 border-red-500 text-red-900";
              } else if (isSelected) {
                buttonClass += "bg-neutral-100 border-neutral-900 text-neutral-900";
              } else {
                buttonClass += "bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300";
              }
              
              return (
                <button 
                  key={idx} 
                  disabled={hasAnswered} 
                  onClick={() => handleAnswer(answerIndex)} 
                  className={buttonClass}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-600">
                      {String.fromCharCode(64 + idx)}
                    </span>
                    <span className="font-medium">{q[`reponse${idx}`]}</span>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Bouton suivant */}
          {session.host === socket.id && correctAnswer !== null && (
            <div className="mt-10 text-center">
              <button 
                className="bg-neutral-900 text-white py-3 px-8 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
                onClick={() => socket.emit('next-question', {code: session.code})}
              >
                Question suivante →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Résultats
  if (view === 'result') {
    const sortedPlayers = [...(session?.players || [])].sort((a,b) => b.score - a.score);
    
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Partie terminée</h1>
            <p className="text-neutral-500 text-sm">Classement final</p>
          </div>
          
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mb-8">
            {sortedPlayers.map((p, i) => (
              <div 
                key={i} 
                className={`px-4 py-4 flex justify-between items-center ${
                  i !== sortedPlayers.length - 1 ? 'border-b border-neutral-100' : ''
                } ${i === 0 ? 'bg-amber-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    i === 0 ? 'bg-amber-400 text-white' : 
                    i === 1 ? 'bg-neutral-300 text-neutral-700' : 
                    i === 2 ? 'bg-amber-600 text-white' : 
                    'bg-neutral-100 text-neutral-600'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-medium text-neutral-900">{p.nickname}</span>
                </div>
                <span className="font-semibold text-neutral-900">{p.score} pts</span>
              </div>
            ))}
          </div>
          
          <button 
            className="w-full bg-neutral-900 text-white py-3.5 px-6 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            onClick={() => window.location.reload()}
          >
            Nouvelle partie
          </button>
        </div>
      </div>
    );
  }

  return null;
}
