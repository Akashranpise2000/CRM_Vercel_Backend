const express = require('express');
const {
  getSettings,
  updateSettings,
  createSettings
} = require('../controllers/settingsController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getSettings)
  .post(createSettings)
  .put(updateSettings);

module.exports = router;