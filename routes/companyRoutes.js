const express = require('express');
const {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getAllCompanies,
  getCompanyStats
} = require('../controllers/companyController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all companies for dropdown (public for now to fix auth issue)
router.get('/all', getAllCompanies);

// All other routes require authentication
router.use(protect);

router.route('/')
  .get(getCompanies)
  .post(createCompany);

router.route('/:id')
  .get(getCompany)
  .put(updateCompany)
  .delete(deleteCompany);

// Company statistics
router.get('/stats/overview', getCompanyStats);

module.exports = router;