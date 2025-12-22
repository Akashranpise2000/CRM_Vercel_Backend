const express = require('express');
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getHotLeads,
  convertLead,
  getLeadStats,
  getConversionRate
} = require('../controllers/leadController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getLeads)
  .post(createLead);

router.route('/:id')
  .get(getLead)
  .put(updateLead)
  .delete(deleteLead);

// Lead conversion
router.post('/:id/convert', convertLead);

// Special lead routes
router.get('/hot/list', getHotLeads);
router.get('/analytics/stats', getLeadStats);
router.get('/analytics/conversion', getConversionRate);

module.exports = router;