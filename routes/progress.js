const express = require('express');
const router = express.Router();

const {
	submitExercise,
	getUserProgressSummary,
	getUserLevelDetail,
	getLevelRanking
} = require('../controllers/progressController');

// POST /exercise/submit
router.post('/exercise/submit', submitExercise);

// GET /progress/:user_id
router.get('/progress/:user_id', getUserProgressSummary);

// GET /progress/:user_id/:level_id
router.get('/progress/:user_id/:level_id', getUserLevelDetail);

// GET /ranking/:level_id
router.get('/ranking/:level_id', getLevelRanking);

module.exports = router;


