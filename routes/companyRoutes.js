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

<<<<<<< HEAD
// All routes require authentication
=======
// Get all companies for dropdown (public for now to fix auth issue)
router.get('/all', getAllCompanies);

// All other routes require authentication
>>>>>>> 52c36bae7ccd905b9092e37ff13c3ff68f315feb
router.use(protect);

router.route('/')
  .get(getCompanies)
  .post(createCompany);

router.route('/:id')
  .get(getCompany)
  .put(updateCompany)
  .delete(deleteCompany);

<<<<<<< HEAD
// Get all companies for dropdown
router.get('/all', getAllCompanies);

=======
>>>>>>> 52c36bae7ccd905b9092e37ff13c3ff68f315feb
// Company statistics
router.get('/stats/overview', getCompanyStats);

module.exports = router;