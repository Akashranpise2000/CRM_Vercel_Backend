const express = require('express');
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getContactsByCompany,
  getAllContacts,
  importContacts
} = require('../controllers/contactController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

<<<<<<< HEAD
// All routes require authentication
=======
// Get all contacts for dropdown (public for now to fix auth issue)
router.get('/all', getAllContacts);

// All other routes require authentication
>>>>>>> 52c36bae7ccd905b9092e37ff13c3ff68f315feb
router.use(protect);

router.route('/')
  .get(getContacts)
  .post(createContact);

router.route('/:id')
  .get(getContact)
  .put(updateContact)
  .delete(deleteContact);

// Get contacts by company
router.get('/company/:companyId', getContactsByCompany);

<<<<<<< HEAD
// Get all contacts for dropdown
router.get('/all', getAllContacts);

=======
>>>>>>> 52c36bae7ccd905b9092e37ff13c3ff68f315feb
// Import contacts
router.post('/import', importContacts);

module.exports = router;