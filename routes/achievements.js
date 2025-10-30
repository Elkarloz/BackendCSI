const express = require('express');
const router = express.Router();
const { listAchievements, listUserAchievements } = require('../controllers/achievementController');

// Public or protect with auth middleware if needed
router.get('/', listAchievements);
router.get('/users/:userId', listUserAchievements);

module.exports = router;


