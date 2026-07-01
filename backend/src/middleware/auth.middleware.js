const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'task_tab_super_secret_key_for_jwt_2026';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Pas de token Bearer');
      return res.status(401).json({ success: false, message: 'Veuillez vous authentifier' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log('🔍 Recherche utilisateur ID:', decoded.id);
    
    const user = await User.findByPk(decoded.id);
    
    console.log('👤 Utilisateur trouvé:', user ? user.username : '❌ Non trouvé');
    console.log('📊 Statut is_active:', user ? user.is_active : 'N/A');
    
    if (!user) {
      console.log('❌ Utilisateur ID', decoded.id, 'non trouvé dans la base');
      return res.status(401).json({ success: false, message: 'Veuillez vous authentifier' });
    }
    
    // Vérifier si le compte est actif (tolérer null comme actif)
    if (user.is_active === false || user.is_active === 0) {
      console.log('❌ Utilisateur inactif');
      return res.status(401).json({ success: false, message: 'Compte désactivé' });
    }

    console.log('✅ Auth réussie pour:', user.username);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erreur auth:', error.message);
    res.status(401).json({ success: false, message: 'Veuillez vous authentifier' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    next();
  };
};

module.exports = { auth, authorize };