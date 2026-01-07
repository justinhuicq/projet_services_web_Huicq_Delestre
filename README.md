# Projet Trivia Real-Time - EPSI Bachelor 3

Jeu de quiz en temps réel utilisant React, Node.js, Socket.io et SQLite.

**Auteurs :** [Vos noms ici]

## 🛠 Technologies

- **Frontend :** React, Vite, TailwindCSS, Socket.io-client
- **Backend :** Node.js, Express, Socket.io, SQLite3

## 📦 Installation

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## 🚀 Lancement

### 1. Démarrer le serveur backend

```bash
cd backend
npm start
```

Le serveur démarre sur `http://localhost:3001`

### 2. Démarrer le client frontend

Dans un autre terminal :

```bash
cd frontend
npm run dev
```

Le frontend s'ouvre sur `http://localhost:5173`

## 🎮 Comment jouer

1. **Créer une partie :** Choisissez un pseudo et le nombre de questions
2. **Inviter des joueurs :** Partagez le code de session affiché
3. **Rejoindre :** Les autres joueurs entrent le code et leur pseudo
4. **Lancer :** L'hôte démarre la partie
5. **Répondre :** Chaque joueur répond aux questions avec chronomètre
6. **Résultats :** Classement final affiché à la fin

## 📊 Règles de scoring

- **10 points :** Réponse correcte en moins de 5 secondes
- **5 points :** Réponse correcte entre 5 et 10 secondes
- **2 points :** Réponse correcte après 10 secondes
- **0 point :** Réponse incorrecte

## 📂 Structure du projet

```
TP/
├── backend/
│   ├── server.js         # Serveur Express + Socket.io
│   ├── db.js             # Gestion SQLite
│   ├── package.json
│   └── trivia.db         # Base de données (générée auto)
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   └── index.css
│   ├── App.jsx           # Application React principale
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## ✅ Fonctionnalités implémentées

- ✅ Backend Node.js avec Socket.io
- ✅ Base SQLite avec questions aléatoires
- ✅ Génération de codes de session uniques
- ✅ Lobby multi-joueurs en temps réel
- ✅ Chronomètre 10 secondes par question
- ✅ Calcul des points selon le temps
- ✅ Classement en direct
- ✅ Page de résultats finale
- ✅ Communication temps réel via WebSockets

## 🎯 Conformité au sujet

Le projet respecte toutes les spécifications du TP EPSI :
- Serveur Node.js avec Socket.io ✅
- Base SQLite avec structure demandée ✅
- Gestion des sessions et codes uniques ✅
- Chronomètre et système de scoring ✅
- Interface complète (création, jonction, jeu, résultats) ✅

---

**EPSI - Bachelor 3 - Atelier Services Web**
