// backend/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();

router.get('/users', (req, res) => {
  res.json({ message: 'Admin users list' });
});

router.post('/users', (req, res) => {
  res.json({ message: 'Admin user created' });
});

module.exports = router;