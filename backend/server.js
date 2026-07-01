const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const session = require('express-session'); // AJOUTÉ

dotenv.config();

const sequelize = require('./src/config/database');
const { errorHandler, notFound } = require('./src/middleware/error.middleware');
const { logRequest } = require('./src/middleware/logger.middleware');

// ============================================
// IMPORTER LES MODÈLES
// ============================================
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Axe = require('./src/models/Axe');
const Project = require('./src/models/Project');
const Action = require('./src/models/Action');
const Task = require('./src/models/Task');
const Message = require('./src/models/Message');
const Document = require('./src/models/Document');
const Correspondence = require('./src/models/Correspondence');
const Notification = require('./src/models/Notification');
const Subscription = require('./src/models/Subscription');
const Log = require('./src/models/Log');

// ============================================
// DÉFINIR LES ASSOCIATIONS
// ============================================
const models = { 
  User, 
  Category, 
  Axe, 
  Project, 
  Action, 
  Task, 
  Message, 
  Document, 
  Correspondence,
  Notification,
  Subscription,
  Log
};

Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// ============================================
// INITIALISER EXPRESS
// ============================================
const app = express();
const server = http.createServer(app);

// ============================================
// SOCKET.IO
// ============================================
const io = socketIo(server, {
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Nouvelle connexion socket:', socket.id);
  
  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`👤 Utilisateur ${userId} connecté`);
    io.emit('online-users', Array.from(onlineUsers.keys()));
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`👤 Utilisateur ${userId} déconnecté`);
        break;
      }
    }
    io.emit('online-users', Array.from(onlineUsers.keys()));
  });

  // Messages privés
  socket.on('private-message', (data) => {
    const { receiverId, message } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new-message', message);
    }
  });

  // Tâches assignées
  socket.on('task-assigned', (data) => {
    const { userId, task } = data;
    const userSocketId = onlineUsers.get(userId);
    if (userSocketId) {
      io.to(userSocketId).emit('new-task', task);
    }
  });

  // Notifications
  socket.on('notification', (data) => {
    const { userId, notification } = data;
    const userSocketId = onlineUsers.get(userId);
    if (userSocketId) {
      io.to(userSocketId).emit('new-notification', notification);
    }
  });
});

// ============================================
// MIDDLEWARES
// ============================================

// 🔥 CORS MIS À JOUR POUR NGORK
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'https://headlock-possible-exuberant.ngrok-free.dev',
  'https://*.ngrok-free.dev' // Permet tous les sous-domaines ngrok
];

app.use(cors({
  origin: function (origin, callback) {
    // Permettre les requêtes sans origin (comme les apps mobiles)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.includes(o.replace('*', '')))) {
      callback(null, true);
    } else if (origin.includes('ngrok-free.dev')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// 🔥 SESSION MIS À JOUR POUR NGORK
app.use(session({
  secret: process.env.SESSION_SECRET || 'task-tab-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // ⚠️ IMPORTANT : false pour ngrok (HTTPS non valide)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    sameSite: 'lax' // Permet les requêtes cross-origin
  }
}));

// Helmet avec CSP désactivé pour ngrok
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// LOGGING MIDDLEWARE (LOG & AUDIT)
// ============================================
app.use(logRequest);

// Headers supplémentaires pour ngrok
app.use((req, res, next) => {
  // Autoriser l'origine dynamique pour ngrok
  const origin = req.headers.origin;
  if (origin && origin.includes('ngrok-free.dev')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// FRONTEND - SERVIR LES FICHIERS STATIQUES
// ============================================
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  console.log('📁 Frontend path:', frontendPath);
} else {
  console.log('⚠️ Dossier frontend/dist non trouvé. Exécutez "npm run build" dans frontend');
}

// ============================================
// ROUTES API
// ============================================
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api/axes', require('./src/routes/axe.routes'));
app.use('/api/projects', require('./src/routes/project.routes'));
app.use('/api/actions', require('./src/routes/action.routes'));
app.use('/api/tasks', require('./src/routes/task.routes'));
app.use('/api/messages', require('./src/routes/message.routes'));
app.use('/api/documents', require('./src/routes/document.routes'));
app.use('/api/dashboard', require('./src/routes/dashboard.routes'));
app.use('/api/reports', require('./src/routes/report.routes'));
app.use('/api/calendar', require('./src/routes/calendar.routes'));
app.use('/api/categories', require('./src/routes/category.routes'));
app.use('/api/admin/dashboard', require('./src/routes/admin.dashboard.routes'));
app.use('/api/correspondence', require('./src/routes/correspondence.routes'));
app.use('/api/gantt', require('./src/routes/gantt.routes'));
app.use('/api/search', require('./src/routes/search.routes'));
app.use('/api/notifications', require('./src/routes/notification.routes'));
app.use('/api/logs', require('./src/routes/log.routes'));
app.use('/api/export', require('./src/routes/export.routes'));

// ============================================
// FALLBACK FRONTEND (toutes les routes non API)
// ============================================
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Route non trouvée' });
  }
  const indexHtml = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).send('Frontend non trouvé. Exécutez "npm run build" dans le dossier frontend');
  }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'TASK TAB API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use(notFound);
app.use(errorHandler);

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à MySQL établie avec succès');

    // Synchroniser les modèles
    await sequelize.sync({ alter: false });
    console.log('✅ Modèles synchronisés');

    // Démarrer le serveur
    server.listen(PORT, '0.0.0.0', () => { // Écoute sur toutes les interfaces
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`🔌 Socket.io prêt`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${process.env.DB_NAME || 'task_tab_db'}`);
    });
  } catch (error) {
    console.error('❌ Erreur de connexion à MySQL:', error);
    process.exit(1);
  }
}

startServer();

// ============================================
// EXPORTER POUR LES AUTRES FICHIERS
// ============================================
module.exports = { 
  io, 
  onlineUsers,
  app,
  server,
};