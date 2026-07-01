const Category = require('../models/Category');

// Récupérer toutes les catégories
const getAll = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC']],
    });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer toutes les catégories (y compris inactives)
const getAllAdmin = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['display_order', 'ASC']],
    });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer une catégorie par ID
const getById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Créer une catégorie
const create = async (req, res) => {
  try {
    const { name_ar, color, icon, display_order } = req.body;
    
    const category = await Category.create({
      name_ar,
      color: color || '#22c55e',
      icon: icon || '📋',
      display_order: display_order || 0,
      is_active: true,
    });
    
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mettre à jour une catégorie
const update = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    
    await category.update(req.body);
    await category.reload();
    
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer une catégorie
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    
    await category.destroy();
    res.json({ success: true, message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAll,
  getAllAdmin,
  getById,
  create,
  update,
  delete: deleteCategory,
};