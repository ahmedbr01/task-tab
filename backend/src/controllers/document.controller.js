const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

// Récupérer tous les documents
const getAll = async (req, res) => {
  try {
    const documents = await Document.findAll({
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, documents });
  } catch (error) {
    console.error('❌ Erreur getAll documents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer les documents d'une tâche
const getByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const documents = await Document.findAll({
      where: { task_id: taskId },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, documents });
  } catch (error) {
    console.error('❌ Erreur getByTask:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload d'un document
const uploadFile = async (req, res) => {
  try {
    const { task_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé',
      });
    }

    const document = await Document.create({
      user_id: req.user.id,
      task_id: task_id || null,
      name: file.originalname,
      file_path: file.path,
      file_size: file.size,
      mime_type: file.mimetype,
      extension: path.extname(file.originalname).substring(1),
    });

    res.status(201).json({
      success: true,
      document,
      message: 'Fichier uploadé avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Télécharger un document
const downloadFile = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé sur le serveur',
      });
    }

    res.download(document.file_path, document.name);
  } catch (error) {
    console.error('❌ Erreur download:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer un document
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    await document.destroy();

    res.json({
      success: true,
      message: 'Document supprimé avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur delete:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAll,
  getByTask,
  uploadFile,
  downloadFile,
  deleteDocument,
};