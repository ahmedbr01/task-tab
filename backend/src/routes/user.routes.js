const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// ============================================
// RÉCUPÉRER LES UTILISATEURS ACTIFS (ACCESSIBLE À TOUS)
// ============================================
router.get('/active', auth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      where: { 
        is_active: true,
        id: { [Op.ne]: req.user.id } // Exclure l'utilisateur connecté
      },
      order: [['full_name', 'ASC']],
    });
    console.log(`👥 ${users.length} utilisateurs actifs trouvés pour ${req.user.username}`);
    res.json({ success: true, users });
  } catch (error) {
    console.error('❌ Erreur GET active users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// RÉCUPÉRER TOUS LES UTILISATEURS (ADMIN SEULEMENT)
// ============================================
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });
    console.log(`👥 ${users.length} utilisateurs trouvés`);
    res.json({ success: true, users });
  } catch (error) {
    console.error('❌ Erreur GET users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// RÉCUPÉRER UN UTILISATEUR PAR ID
// ============================================
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Erreur GET user by id:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// CRÉER UN UTILISATEUR (ADMIN SEULEMENT)
// ============================================
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    console.log('📝 Création utilisateur:', req.body);
    
    const { username, password, full_name, email, phone, role } = req.body;
    
    if (!username || !password || !full_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs requis doivent être remplis',
      });
    }
    
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur ou email déjà utilisé',
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({
      username,
      password_hash: hashedPassword,
      full_name,
      email,
      phone: phone || null,
      role: role || 'member',
      is_active: true,
    });
    
    const userData = user.toJSON();
    delete userData.password_hash;
    
    res.status(201).json({ success: true, user: userData });
  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// METTRE À JOUR UN UTILISATEUR (ADMIN SEULEMENT)
// ============================================
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    const { full_name, email, phone, role, is_active } = req.body;
    
    await user.update({
      full_name: full_name || user.full_name,
      email: email || user.email,
      phone: phone || user.phone,
      role: role || user.role,
      is_active: is_active !== undefined ? is_active : user.is_active,
    });
    
    const userData = user.toJSON();
    delete userData.password_hash;
    
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('❌ Erreur mise à jour utilisateur:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// 🔥 SUPPRIMER UN UTILISATEUR (ADMIN SEULEMENT)
// ============================================
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // Empêcher la suppression de son propre compte
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte',
      });
    }
    
    // Empêcher la suppression du dernier administrateur
    if (user.role === 'admin') {
      const adminCount = await User.count({ 
        where: { role: 'admin', is_active: true } 
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer le dernier administrateur',
        });
      }
    }
    
    // Supprimer l'utilisateur
    await user.destroy();
    
    res.json({ 
      success: true, 
      message: `Utilisateur "${user.username}" supprimé avec succès` 
    });
  } catch (error) {
    console.error('❌ Erreur suppression utilisateur:', error);
    
    // Gérer les erreurs de contrainte étrangère
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur a des données associées (messages, tâches, etc.). Supprimez d\'abord ses relations.',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erreur serveur' 
    });
  }
});

module.exports = router;