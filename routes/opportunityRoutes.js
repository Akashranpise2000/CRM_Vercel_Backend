const express = require('express');
const {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getOpportunitiesByCompany,
  getPipelineSummary,
  getForecastData
} = require('../controllers/opportunityController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getOpportunities)
  .post(createOpportunity);

router.route('/:id')
  .get(getOpportunity)
  .put(updateOpportunity)
  .delete(deleteOpportunity);

// Get opportunities by company
router.get('/company/:companyId', getOpportunitiesByCompany);

// Pipeline and forecast data
router.get('/analytics/pipeline', getPipelineSummary);
router.get('/analytics/forecast', getForecastData);

module.exports = router;