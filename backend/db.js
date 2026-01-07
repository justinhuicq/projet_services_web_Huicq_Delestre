const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'trivia.db');

// Connexion à la base de données
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la DB:', err.message);
  } else {
    console.log('✅ Connecté à la base de données SQLite');
  }
});

// Initialisation de la base de données
function initDB() {
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      reponse1 TEXT NOT NULL,
      reponse2 TEXT NOT NULL,
      reponse3 TEXT NOT NULL,
      reponse4 TEXT NOT NULL,
      bonne_reponse INTEGER NOT NULL CHECK(bonne_reponse BETWEEN 1 AND 4)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Erreur création table:', err.message);
    } else {
      console.log('✅ Table "questions" prête');
      checkAndSeedQuestions();
    }
  });
}

// Vérifier et ajouter des questions par défaut si la table est vide
function checkAndSeedQuestions() {
  db.get('SELECT COUNT(*) as count FROM questions', (err, row) => {
    if (err) {
      console.error('❌ Erreur comptage:', err.message);
      return;
    }
    
    if (row.count === 0) {
      console.log('📝 Ajout de questions par défaut...');
      seedQuestions();
    } else {
      console.log(`✅ ${row.count} question(s) disponible(s)`);
    }
  });
}

// Remplir la base avec des questions de test
function seedQuestions() {
  const questions = [
    {
      question: "Quelle est la capitale de la France ?",
      reponse1: "Paris", reponse2: "Lyon", reponse3: "Marseille", reponse4: "Toulouse",
      bonne_reponse: 1
    },
    {
      question: "Combien y a-t-il de planètes dans le système solaire ?",
      reponse1: "7", reponse2: "8", reponse3: "9", reponse4: "10",
      bonne_reponse: 2
    },
    {
      question: "Qui a peint la Joconde ?",
      reponse1: "Picasso", reponse2: "Van Gogh", reponse3: "Léonard de Vinci", reponse4: "Michel-Ange",
      bonne_reponse: 3
    },
    {
      question: "Quel est le plus grand océan du monde ?",
      reponse1: "Atlantique", reponse2: "Indien", reponse3: "Arctique", reponse4: "Pacifique",
      bonne_reponse: 4
    },
    {
      question: "En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?",
      reponse1: "1965", reponse2: "1969", reponse3: "1972", reponse4: "1975",
      bonne_reponse: 2
    },
    {
      question: "Quelle est la langue la plus parlée au monde (natifs) ?",
      reponse1: "Anglais", reponse2: "Espagnol", reponse3: "Mandarin", reponse4: "Hindi",
      bonne_reponse: 3
    },
    {
      question: "Combien de continents y a-t-il sur Terre ?",
      reponse1: "5", reponse2: "6", reponse3: "7", reponse4: "8",
      bonne_reponse: 3
    },
    {
      question: "Quel est l'élément chimique dont le symbole est 'O' ?",
      reponse1: "Or", reponse2: "Oxygène", reponse3: "Osmium", reponse4: "Ozone",
      bonne_reponse: 2
    },
    {
      question: "Qui a écrit 'Les Misérables' ?",
      reponse1: "Émile Zola", reponse2: "Victor Hugo", reponse3: "Alexandre Dumas", reponse4: "Gustave Flaubert",
      bonne_reponse: 2
    },
    {
      question: "Quelle est la vitesse de la lumière dans le vide (environ) ?",
      reponse1: "300 000 km/s", reponse2: "150 000 km/s", reponse3: "500 000 km/s", reponse4: "1 000 000 km/s",
      bonne_reponse: 1
    },
    {
      question: "Combien y a-t-il de joueurs dans une équipe de football ?",
      reponse1: "9", reponse2: "10", reponse3: "11", reponse4: "12",
      bonne_reponse: 3
    },
    {
      question: "Quelle est la monnaie utilisée au Japon ?",
      reponse1: "Yuan", reponse2: "Won", reponse3: "Yen", reponse4: "Baht",
      bonne_reponse: 3
    },
    {
      question: "Quel est le plus petit pays du monde ?",
      reponse1: "Monaco", reponse2: "Vatican", reponse3: "Saint-Marin", reponse4: "Liechtenstein",
      bonne_reponse: 2
    },
    {
      question: "Combien de côtés a un hexagone ?",
      reponse1: "4", reponse2: "5", reponse3: "6", reponse4: "7",
      bonne_reponse: 3
    },
    {
      question: "Quelle est la plus haute montagne du monde ?",
      reponse1: "K2", reponse2: "Mont Blanc", reponse3: "Everest", reponse4: "Kilimandjaro",
      bonne_reponse: 3
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO questions (question, reponse1, reponse2, reponse3, reponse4, bonne_reponse)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  questions.forEach(q => {
    stmt.run(q.question, q.reponse1, q.reponse2, q.reponse3, q.reponse4, q.bonne_reponse);
  });

  stmt.finalize((err) => {
    if (err) {
      console.error('❌ Erreur insertion:', err.message);
    } else {
      console.log(`✅ ${questions.length} questions ajoutées`);
    }
  });
}

// Récupérer des questions aléatoires
function getRandomQuestions(count) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM questions ORDER BY RANDOM() LIMIT ?`, [count], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = { initDB, getRandomQuestions };
