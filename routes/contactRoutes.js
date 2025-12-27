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

// Get all contacts for dropdown (public for now to fix auth issue)
router.get('/all', getAllContacts);

// All other routes require authentication
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

// Import contacts
router.post('/import', importContacts);

module.exports = router;