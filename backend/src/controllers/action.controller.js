const Action = require('../models/Action');

const getAll = async (req, res) => {
  try {
    const actions = await Action.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, actions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { project_id, name_ar, start_date, end_date } = req.body;
    const action = await Action.create({
      project_id,
      name_ar,
      start_date,
      end_date,
      status: 'pending',
      progress: 0,
      created_by: req.user.id,
    });
    res.status(201).json({ success: true, action });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create };