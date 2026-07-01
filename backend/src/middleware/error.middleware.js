const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur'
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
};

module.exports = { errorHandler, notFound };