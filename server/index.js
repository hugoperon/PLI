const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

console.log('SECRET_KEY chargée:', !!process.env.SECRET_KEY);

// Route de login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérification des champs requis
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    // Recherche de l'utilisateur
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error('Erreur SQL:', err);
        return res.status(500).json({ message: 'Erreur serveur' });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      const user = results[0];

      // Vérification du mot de passe
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      // Création du token JWT avec SECRET_KEY au lieu de JWT_SECRET
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          username: user.username 
        },
        process.env.SECRET_KEY, // Utilisation de SECRET_KEY
        { expiresIn: '24h' }
      );

      // Envoi de la réponse
      res.json({
        message: 'Connexion réussie',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      });
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route d'inscription
app.post('/api/signup', async (req, res) => {
  try {
    console.log('Données reçues:', req.body);
    const { username, email, password } = req.body;

    // Vérification des données
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, hashedPassword], (err, result) => {
      if (err) {
        console.error('Erreur SQL:', err);
        return res.status(500).json({ message: 'Erreur lors de l\'inscription' });
      }
      res.status(201).json({ 
        success: true,
        message: 'Inscription réussie',
        redirectUrl: '/login'
      });
    });

  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Middleware de vérification du token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Format de token invalide' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

// Route protégée pour les mangas
app.get('/api/mangas', verifyToken, (req, res) => {
  const query = 'SELECT * FROM mangas';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// Enregistrer l'historique de lecture
app.post('/api/reading-history', verifyToken, (req, res) => {
  const { manga_id } = req.body;
  const user_id = req.user.id;

  const query = 'INSERT INTO reading_history (user_id, manga_id) VALUES (?, ?)';
  db.query(query, [user_id, manga_id], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de l\'enregistrement' });
    }
    res.json({ message: 'Historique mis à jour' });
  });
});

// Obtenir les recommandations basées sur l'historique de lecture
app.get('/api/recommendations', verifyToken, (req, res) => {
  const user_id = req.user.id;

  const query = `
    WITH UserGenres AS (
      SELECT DISTINCT mg.genre
      FROM reading_history rh
      JOIN manga_genres mg ON rh.manga_id = mg.manga_id
      WHERE rh.user_id = ?
    )
    SELECT DISTINCT 
      m.*, 
      GROUP_CONCAT(DISTINCT mg.genre) as genres,
      COUNT(DISTINCT ug.genre) as matching_genres
    FROM mangas m
    JOIN manga_genres mg ON m.manga_id = mg.manga_id
    LEFT JOIN UserGenres ug ON mg.genre = ug.genre
    WHERE m.manga_id NOT IN (
      SELECT manga_id 
      FROM reading_history 
      WHERE user_id = ?
    )
    GROUP BY m.manga_id, m.title, m.description, m.image_url, m.read_url
    HAVING matching_genres > 0
    ORDER BY matching_genres DESC, m.title
    LIMIT 10
  `;

  db.query(query, [user_id, user_id], (err, results) => {
    if (err) {
      console.error('Erreur de recommandation:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// Obtenir les genres d'un manga
app.get('/api/manga/:id/genres', verifyToken, (req, res) => {
  const query = `
    SELECT genre 
    FROM manga_genres 
    WHERE manga_id = ?
  `;
  
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results.map(r => r.genre));
  });
});

app.listen(5000, () => {
  console.log('Serveur démarré sur le port 5000');
});