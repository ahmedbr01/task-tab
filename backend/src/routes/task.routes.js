const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const taskController = require('../controllers/task.controller');
const Task = require('../models/Task');

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', auth, taskController.getAll);
router.get('/my-tasks', auth, taskController.getMyTasks);
router.get('/stats', auth, taskController.getStats);
router.get('/:id', auth, taskController.getById);

// Création de tâche - accessible à tous (membres inclus)
router.post('/', auth, taskController.create);

// Mise à jour du statut - accessible à tous
router.put('/:id/status', auth, taskController.updateStatus);

// Mise à jour complète - accessible à tous
router.put('/:id', auth, taskController.update);

// ============================================
// 🔥 SUPPRESSION - Admin ou créateur de la tâche
// ============================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tâche non trouvée' 
      });
    }

    // Vérifier si l'utilisateur est admin ou le créateur de la tâche
    if (req.user.role !== 'admin' && task.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer cette tâche'
      });
    }

    await task.destroy();
    
    res.json({ 
      success: true, 
      message: 'Tâche supprimée avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur suppression tâche:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erreur serveur' 
    });
  }
});

module.exports = router;