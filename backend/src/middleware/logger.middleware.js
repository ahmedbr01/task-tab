const Log = require('../models/Log');

// Middleware pour logger toutes les requêtes
const logRequest = async (req, res, next) => {
  const start = Date.now();
  
  // Capturer la réponse
  const originalSend = res.send;
  let responseBody = null;
  
  res.send = function(data) {
    responseBody = data;
    return originalSend.call(this, data);
  };

  // Continuer le traitement
  res.on('finish', async () => {
    try {
      // Ne pas logger les requêtes de santé et les assets
      if (req.path === '/health' || req.path.startsWith('/assets/')) {
        return;
      }

      const duration = Date.now() - start;
      
      // Log des actions importantes
      const importantActions = ['POST', 'PUT', 'DELETE', 'PATCH'];
      if (importantActions.includes(req.method) || req.path.startsWith('/api/')) {
        
        await Log.create({
          user_id: req.user?.id || null,
          username: req.user?.username || 'anonymous',
          action: req.method,
          table_name: req.path.split('/')[2] || null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.headers['user-agent'] || null,
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: duration,
        });
      }
    } catch (error) {
      console.error('❌ Erreur logging:', error);
    }
  });

  next();
};

// Logger spécifique pour les actions CRUD
const logAction = async (action, tableName, recordId, oldData = null, newData = null, req = null) => {
  try {
    await Log.create({
      user_id: req?.user?.id || null,
      username: req?.user?.username || 'system',
      action: action,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      ip_address: req?.ip || req?.connection?.remoteAddress || null,
      user_agent: req?.headers?.['user-agent'] || null,
      method: req?.method || null,
      url: req?.originalUrl || null,
    });
  } catch (error) {
    console.error('❌ Erreur logAction:', error);
  }
};

module.exports = {
  logRequest,
  logAction,
};