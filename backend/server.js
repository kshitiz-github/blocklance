const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Initialize SQLite database
const db = new sqlite3.Database('./freelance.db');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT UNIQUE NOT NULL,
      username TEXT,
      bio TEXT,
      skills TEXT,
      portfolio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Job metadata table
  db.run(`
    CREATE TABLE IF NOT EXISTS job_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      category TEXT,
      skills_required TEXT,
      deadline DATE,
      attachments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_address TEXT NOT NULL,
      receiver_address TEXT NOT NULL,
      job_id INTEGER,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Reviews table  
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      reviewer_address TEXT NOT NULL,
      reviewed_address TEXT NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Files/IPFS hashes table
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      milestone_index INTEGER,
      file_hash TEXT NOT NULL,
      file_name TEXT,
      file_type TEXT,
      uploaded_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes

// User routes
app.post('/api/users', (req, res) => {
  const { wallet_address, username, bio, skills, portfolio } = req.body;
  
  db.run(
    `INSERT OR REPLACE INTO users (wallet_address, username, bio, skills, portfolio) 
     VALUES (?, ?, ?, ?, ?)`,
    [wallet_address, username, bio, skills, portfolio],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, wallet_address });
    }
  );
});

app.get('/api/users/:address', (req, res) => {
  const { address } = req.params;
  
  db.get(
    `SELECT * FROM users WHERE wallet_address = ?`,
    [address],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(row || {});
    }
  );
});

// Job metadata routes
app.post('/api/jobs/metadata', (req, res) => {
  const { job_id, category, skills_required, deadline, attachments } = req.body;
  
  db.run(
    `INSERT INTO job_metadata (job_id, category, skills_required, deadline, attachments) 
     VALUES (?, ?, ?, ?, ?)`,
    [job_id, category, skills_required, deadline, JSON.stringify(attachments)],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/jobs/metadata/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  db.get(
    `SELECT * FROM job_metadata WHERE job_id = ?`,
    [jobId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(row || {});
    }
  );
});

// Search jobs by category or skills
app.get('/api/jobs/search', (req, res) => {
  const { category, skills } = req.query;
  let query = `SELECT * FROM job_metadata WHERE 1=1`;
  const params = [];
  
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  if (skills) {
    query += ` AND skills_required LIKE ?`;
    params.push(`%${skills}%`);
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Messages routes
app.post('/api/messages', (req, res) => {
  const { sender_address, receiver_address, job_id, message } = req.body;
  
  db.run(
    `INSERT INTO messages (sender_address, receiver_address, job_id, message) 
     VALUES (?, ?, ?, ?)`,
    [sender_address, receiver_address, job_id, message],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/messages/:address', (req, res) => {
  const { address } = req.params;
  
  db.all(
    `SELECT * FROM messages 
     WHERE sender_address = ? OR receiver_address = ? 
     ORDER BY created_at DESC`,
    [address, address],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.get('/api/messages/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  db.all(
    `SELECT * FROM messages WHERE job_id = ? ORDER BY created_at ASC`,
    [jobId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Reviews routes
app.post('/api/reviews', (req, res) => {
  const { job_id, reviewer_address, reviewed_address, rating, comment } = req.body;
  
  db.run(
    `INSERT INTO reviews (job_id, reviewer_address, reviewed_address, rating, comment) 
     VALUES (?, ?, ?, ?, ?)`,
    [job_id, reviewer_address, reviewed_address, rating, comment],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/reviews/:address', (req, res) => {
  const { address } = req.params;
  
  db.all(
    `SELECT * FROM reviews WHERE reviewed_address = ? ORDER BY created_at DESC`,
    [address],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Calculate average rating
      const avgRating = rows.length > 0 
        ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length 
        : 0;
      
      res.json({ reviews: rows, averageRating: avgRating });
    }
  );
});

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { job_id, milestone_index, uploaded_by } = req.body;
  
  // In production, you would upload to IPFS here and get the hash
  // For demo, we'll use the local file path
  const file_hash = req.file.filename; // In production, this would be IPFS hash
  
  db.run(
    `INSERT INTO files (job_id, milestone_index, file_hash, file_name, file_type, uploaded_by) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [job_id, milestone_index, file_hash, req.file.originalname, req.file.mimetype, uploaded_by],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        id: this.lastID,
        file_hash,
        file_url: `/uploads/${req.file.filename}`
      });
    }
  );
});

app.get('/api/files/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  db.all(
    `SELECT * FROM files WHERE job_id = ? ORDER BY created_at DESC`,
    [jobId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Statistics routes
app.get('/api/stats', (req, res) => {
  const stats = {};
  
  db.get(`SELECT COUNT(*) as total_users FROM users`, (err, row) => {
    stats.totalUsers = row ? row.total_users : 0;
    
    db.get(`SELECT COUNT(*) as total_jobs FROM job_metadata`, (err, row) => {
      stats.totalJobs = row ? row.total_jobs : 0;
      
      db.get(`SELECT COUNT(*) as total_reviews FROM reviews`, (err, row) => {
        stats.totalReviews = row ? row.total_reviews : 0;
        
        db.get(`SELECT AVG(rating) as avg_rating FROM reviews`, (err, row) => {
          stats.averageRating = row ? row.avg_rating : 0;
          
          res.json(stats);
        });
      });
    });
  });
});

// Categories
app.get('/api/categories', (req, res) => {
  const categories = [
    'Web Development',
    'Mobile Development', 
    'UI/UX Design',
    'Graphic Design',
    'Content Writing',
    'Digital Marketing',
    'Video Editing',
    'Translation',
    'Data Entry',
    'Other'
  ];
  res.json(categories);
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Database: freelance.db`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close(() => {
    console.log('Database connection closed.');
    process.exit(0);
  });
});
