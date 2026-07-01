const Correspondence = require('../models/Correspondence');
const PDFGenerator = require('../services/pdfGenerator');
const { Op } = require('sequelize');

// Générer une référence unique
const generateReference = async (type) => {
  const year = new Date().getFullYear();
  const prefix = {
    internal_pdg: 'N/PDG',
    internal_director: 'N/DIR',
    external_minister: 'C/MIN',
    external_partner: 'C/PAR',
  };

  const lastCorrespondence = await Correspondence.findOne({
    where: {
      type: type,
      created_at: {
        [Op.between]: [
          new Date(year, 0, 1),
          new Date(year, 11, 31, 23, 59, 59)
        ]
      }
    },
    order: [['created_at', 'DESC']],
  });

  let number = 1;
  if (lastCorrespondence) {
    const lastRef = lastCorrespondence.reference;
    const match = lastRef.match(/\/(\d+)\//);
    if (match) {
      number = parseInt(match[1]) + 1;
    }
  }

  return `${prefix[type]}/${String(number).padStart(4, '0')}/${year}`;
};

// Récupérer toutes les correspondances
const getAll = async (req, res) => {
  try {
    const correspondence = await Correspondence.findAll({
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, correspondence });
  } catch (error) {
    console.error('❌ Erreur getAll:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer une correspondance par ID
const getById = async (req, res) => {
  try {
    const correspondence = await Correspondence.findByPk(req.params.id);
    if (!correspondence) {
      return res.status(404).json({ success: false, message: 'Correspondance non trouvée' });
    }
    res.json({ success: true, correspondence });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Créer une correspondance
const create = async (req, res) => {
  try {
    const { type, language, title, content, recipient, recipient_position } = req.body;

    if (!type || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Type, titre et contenu sont requis',
      });
    }

    const reference = await generateReference(type);

    const correspondence = await Correspondence.create({
      user_id: req.user.id,
      reference,
      type,
      language: language || 'ar',
      title,
      content,
      recipient: recipient || null,
      recipient_position: recipient_position || null,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      correspondence,
      message: 'Correspondance créée avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur création correspondance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mettre à jour une correspondance
const update = async (req, res) => {
  try {
    const correspondence = await Correspondence.findByPk(req.params.id);
    if (!correspondence) {
      return res.status(404).json({ success: false, message: 'Correspondance non trouvée' });
    }

    await correspondence.update(req.body);
    await correspondence.reload();

    res.json({
      success: true,
      correspondence,
      message: 'Correspondance mise à jour avec succès',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Générer le PDF
const generatePDF = async (req, res) => {
  try {
    const correspondence = await Correspondence.findByPk(req.params.id);
    if (!correspondence) {
      return res.status(404).json({ success: false, message: 'Correspondance non trouvée' });
    }

    const pdfPath = await PDFGenerator.generateCorrespondence(correspondence);

    await correspondence.update({
      status: 'generated',
      generated_at: new Date(),
      file_path: pdfPath,
    });

    res.json({
      success: true,
      pdfPath,
      message: 'PDF généré avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Télécharger le PDF
const downloadPDF = async (req, res) => {
  try {
    const correspondence = await Correspondence.findByPk(req.params.id);
    if (!correspondence) {
      return res.status(404).json({ success: false, message: 'Correspondance non trouvée' });
    }

    if (!correspondence.file_path) {
      return res.status(404).json({ success: false, message: 'PDF non généré' });
    }

    res.download(correspondence.file_path, `correspondance-${correspondence.reference}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer une correspondance
const deleteCorrespondence = async (req, res) => {
  try {
    const correspondence = await Correspondence.findByPk(req.params.id);
    if (!correspondence) {
      return res.status(404).json({ success: false, message: 'Correspondance non trouvée' });
    }

    await correspondence.destroy();
    res.json({ success: true, message: 'Correspondance supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  generatePDF,
  downloadPDF,
  delete: deleteCorrespondence,
};