require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, initializeDatabase } = require('./database');

const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '..')));

// Serve music files
app.use('/music', express.static(path.join(__dirname, '../music')));

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

// Middleware to verify admin token
function verifyAdminToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.admin = decoded;
    next();
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../music'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const connection = await pool.getConnection();
    const [existingUser] = await connection.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    
    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    await connection.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
    connection.release();

    res.json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
    connection.release();

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const user = users[0];
    const passwordMatch = await bcryptjs.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, userId: user.id });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Admin Login
app.post('/api/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const connection = await pool.getConnection();
    const [admins] = await connection.query('SELECT * FROM admins WHERE username = ?', [username]);
    connection.release();

    if (admins.length === 0) {
      return res.status(400).json({ error: 'Invalid admin username or password' });
    }

    const admin = admins[0];
    const passwordMatch = await bcryptjs.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid admin username or password' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Admin login successful', token, adminId: admin.id });
  } catch (error) {
    console.error('Error logging in admin:', error);
    res.status(500).json({ error: 'Failed to admin login' });
  }
});

app.get('/api/songs', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const connection = await pool.getConnection();
    const [songs] = await connection.query(`
      SELECT s.*, CASE WHEN uf.song_id IS NOT NULL THEN TRUE ELSE FALSE END AS favorite
      FROM songs s
      LEFT JOIN user_favorites uf ON s.id = uf.song_id AND uf.user_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);
    connection.release();
    res.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// Verify Token
app.post('/api/verify-token', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Verify Admin Token
app.post('/api/verify-admin-token', verifyAdminToken, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

// Admin: Upload Song (Admin only)
app.post('/api/upload', verifyAdminToken, upload.single('song'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const title = req.body.title || req.file.originalname.replace(/\.[^.]+$/, '');
  const artist = req.body.artist || 'Unknown Artist';
  const filename = req.file.filename;
  const src = `/music/${filename}`;
  const cover = req.body.cover || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmZmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

  try {
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO songs (title, artist, filename, src, cover) VALUES (?, ?, ?, ?, ?)',
      [title, artist, filename, src, cover]
    );
    connection.release();
    res.json({ message: 'Song uploaded successfully', song: { title, artist, src, cover, favorite: false } });
  } catch (error) {
    console.error('Error saving song to database:', error);
    res.status(500).json({ error: 'Failed to save song metadata' });
  }
});

// Admin: Get all users
app.get('/api/admin/users', verifyAdminToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC');
    connection.release();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Delete user
app.delete('/api/admin/users/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM users WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin: Get all songs
app.get('/api/admin/songs', verifyAdminToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [songs] = await connection.query('SELECT * FROM songs ORDER BY created_at DESC');
    connection.release();
    res.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// Admin: Delete song
app.delete('/api/admin/songs/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [songs] = await connection.query('SELECT filename FROM songs WHERE id = ?', [id]);
    
    if (songs.length > 0) {
      const filePath = path.join(__dirname, '../music', songs[0].filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await connection.query('DELETE FROM songs WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ error: 'Failed to delete song' });
  }
});

// Get user's favorites
app.get('/api/user/favorites', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const connection = await pool.getConnection();
    const [favorites] = await connection.query(`
      SELECT s.* FROM songs s
      INNER JOIN user_favorites uf ON s.id = uf.song_id
      WHERE uf.user_id = ?
      ORDER BY uf.created_at DESC
    `, [userId]);
    connection.release();
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Add to favorites
app.post('/api/user/favorites/:songId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const songId = req.params.songId;
    const connection = await pool.getConnection();
    await connection.query('INSERT IGNORE INTO user_favorites (user_id, song_id) VALUES (?, ?)', [userId, songId]);
    connection.release();
    res.json({ message: 'Added to favorites' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove from favorites
app.delete('/api/user/favorites/:songId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const songId = req.params.songId;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM user_favorites WHERE user_id = ? AND song_id = ?', [userId, songId]);
    connection.release();
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

async function startServer() {
  await initializeDatabase();
  
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`MySQL connected to: ${process.env.DB_HOST || 'localhost'}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
