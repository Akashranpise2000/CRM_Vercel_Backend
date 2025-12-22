const express = require('express');
const { importData, validateImportData } = require('../controllers/importController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', importData);
router.post('/validate', validateImportData);

module.exports = router;