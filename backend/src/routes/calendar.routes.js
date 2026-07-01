const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const calendarController = require('../controllers/calendar.controller');

console.log('📋 Routes calendar chargées');

router.get('/tasks', auth, calendarController.getTasks);
router.get('/events', auth, calendarController.getEvents);

module.exports = router;