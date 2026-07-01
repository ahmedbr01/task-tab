const Log = require('../models/Log');
const User = require('../models/User');
const { Op } = require('sequelize');

// Récupérer tous les logs avec pagination et filtres
const getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const action = req.query.action || '';
    const username = req.query.username || '';
    const dateFrom = req.query.dateFrom || '';
    const dateTo = req.query.dateTo || '';
    const tableName = req.query.tableName || '';

    // Construire la condition
    const where = {};
    if (action) where.action = action;
    if (username) where.username = { [Op.like]: `%${username}%` };
    if (tableName) where.table_name = tableName;
    if (dateFrom && dateTo) {
      where.created_at = {
        [Op.between]: [
          new Date(dateFrom),
          new Date(dateTo + 'T23:59:59')
        ]
      };
    }

    const { count, rows } = await Log.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // Statistiques
    const stats = {
      total: await Log.count(),
      today: await Log.count({
        where: {
          created_at: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      byAction: await Log.findAll({
        attributes: ['action', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
        group: ['action'],
        order: [[require('sequelize').literal('count'), 'DESC']],
        limit: 10,
      }),
      byUser: await Log.findAll({
        attributes: ['username', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
        group: ['username'],
        where: { username: { [Op.ne]: null } },
        order: [[require('sequelize').literal('count'), 'DESC']],
        limit: 10,
      }),
    };

    res.json({
      success: true,
      logs: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('❌ Erreur getLogs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer les statistiques des logs
const getLogStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);
    const startOfMonth = new Date(today);
    startOfMonth.setDate(1);

    const stats = {
      total: await Log.count(),
      today: await Log.count({
        where: {
          created_at: {
            [Op.gte]: new Date(today.setHours(0, 0, 0, 0))
          }
        }
      }),
      week: await Log.count({
        where: {
          created_at: {
            [Op.gte]: startOfWeek
          }
        }
      }),
      month: await Log.count({
        where: {
          created_at: {
            [Op.gte]: startOfMonth
          }
        }
      }),
      byAction: await Log.findAll({
        attributes: ['action', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
        group: ['action'],
        order: [[require('sequelize').literal('count'), 'DESC']],
        limit: 10,
      }),
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Erreur getLogStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Nettoyer les logs (uniquement admin)
const cleanLogs = async (req, res) => {
  try {
    const { days } = req.body;
    const deleteDays = days || 30;

    const deleted = await Log.destroy({
      where: {
        created_at: {
          [Op.lt]: new Date(new Date().setDate(new Date().getDate() - deleteDays))
        }
      }
    });

    res.json({
      success: true,
      message: `${deleted} logs supprimés (plus de ${deleteDays} jours)`,
    });
  } catch (error) {
    console.error('❌ Erreur cleanLogs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Exporter les logs en CSV
const exportLogs = async (req, res) => {
  try {
    const logs = await Log.findAll({
      order: [['created_at', 'DESC']],
      limit: 10000,
    });

    const csv = [
      ['Date', 'Utilisateur', 'Action', 'Table', 'Record', 'IP', 'Statut', 'Durée']
    ];

    logs.forEach(log => {
      csv.push([
        log.created_at.toISOString(),
        log.username || '-',
        log.action,
        log.table_name || '-',
        log.record_id || '-',
        log.ip_address || '-',
        log.status || '-',
        log.duration || '-',
      ]);
    });

    const csvContent = csv.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('❌ Erreur exportLogs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLogs,
  getLogStats,
  cleanLogs,
  exportLogs,
};