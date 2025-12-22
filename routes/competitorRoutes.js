const express = require('express');
const {
  getCompetitors,
  getCompetitor,
  createCompetitor,
  updateCompetitor,
  deleteCompetitor,
  getCompetitorStats
} = require('../controllers/competitorController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getCompetitors)
  .post(createCompetitor);

router.route('/:id')
  .get(getCompetitor)
  .put(updateCompetitor)
  .delete(deleteCompetitor);

router.route('/stats')
  .get(getCompetitorStats);

module.exports = router;