const Contact = require('../models/Contact');
const { linkContactToCompany, updateContactCompany } = require('../services/relationshipService');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Private
const getContacts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { search, company, status } = req.query;

  let query = { createdBy: req.user.id };

  // Add search functionality
  if (search) {
    query.$or = [
      { first_name: new RegExp(search, 'i') },
      { last_name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { position: new RegExp(search, 'i') }
    ];
  }

  // Filter by company
  if (company) {
    query.company_id = company;
  }

  // Filter by active status
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  const contacts = await Contact.find(query)
    .populate('company_id', 'name industry')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await Contact.countDocuments(query);

  res.status(200).json({
    success: true,
    data: contacts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single contact
// @route   GET /api/contacts/:id
// @access  Private
const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  }).populate('company_id', 'name industry website phone');

  if (!contact) {
    return res.status(404).json({
      success: false,
      error: 'Contact not found'
    });
  }

  res.status(200).json({
    success: true,
    data: contact
  });
});

// @desc    Create contact
// @route   POST /api/contacts
// @access  Private
const createContact = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, phone } = req.body;

  // Check for duplicate contacts
  let duplicateQuery = { createdBy: req.user.id };

  // Check by email if provided
  if (email) {
    duplicateQuery.email = email;
  }

  // Check by phone if provided and no email match
  if (phone && !email) {
    duplicateQuery.phone = phone;
  }

  // Check by name if neither email nor phone provided
  if (!email && !phone && first_name && last_name) {
    duplicateQuery.first_name = new RegExp(`^${first_name}$`, 'i');
    duplicateQuery.last_name = new RegExp(`^${last_name}$`, 'i');
  }

  // If we have criteria to check, perform duplicate check
  if (Object.keys(duplicateQuery).length > 1) { // More than just createdBy
    const existingContact = await Contact.findOne(duplicateQuery);

    if (existingContact) {
      return res.status(409).json({
        success: false,
        error: 'Contact already exists in the system.',
        duplicate: {
          id: existingContact._id,
          name: `${existingContact.first_name} ${existingContact.last_name}`,
          email: existingContact.email,
          phone: existingContact.phone
        }
      });
    }
  }

  const contactData = {
    ...req.body,
    createdBy: req.user.id
  };

  const contact = await Contact.create(contactData);

  // Link to company if company_id is provided
  if (contactData.company_id) {
    await linkContactToCompany(contact._id, contactData.company_id, req.user.id);
  }

  await contact.populate('company_id', 'name industry');

  res.status(201).json({
    success: true,
    data: contact
  });
});

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
const updateContact = asyncHandler(async (req, res) => {
   const contact = await Contact.findOne({ _id: req.params.id, createdBy: req.user.id });

   if (!contact) {
     return res.status(404).json({
       success: false,
       error: 'Contact not found'
     });
   }

   const oldCompanyId = contact.company_id;
   const newCompanyId = req.body.company_id;

   // Update contact
   Object.assign(contact, req.body);
   await contact.save();

   // Handle company relationship change
   if (newCompanyId !== oldCompanyId) {
     await updateContactCompany(req.params.id, newCompanyId, req.user.id);
   }

   await contact.populate('company_id', 'name industry');

   res.status(200).json({
     success: true,
     data: contact
   });
});

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      error: 'Contact not found'
    });
  }

  await Contact.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get contacts by company
// @route   GET /api/contacts/company/:companyId
// @access  Private
const getContactsByCompany = asyncHandler(async (req, res) => {
  const contacts = await Contact.find({
    company_id: req.params.companyId,
    createdBy: req.user.id,
    isActive: true
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: contacts
  });
});

// @desc    Get all contacts for dropdown
// @route   GET /api/contacts/all
<<<<<<< HEAD
// @access  Private
const getAllContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find({
    createdBy: req.user.id,
=======
// @access  Public (for now to fix auth issue)
const getAllContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find({
>>>>>>> 52c36bae7ccd905b9092e37ff13c3ff68f315feb
    isActive: true
  })
  .populate('company_id', 'name industry')
  .select('first_name last_name email phone position')
  .sort({ first_name: 1, last_name: 1 })
  .lean();

  // Filter out contacts with empty required fields and format for dropdown
  const formattedContacts = contacts
    .filter(contact => contact.first_name && contact.last_name && contact.email)
    .map(contact => ({
      id: contact._id,
      name: `${contact.first_name} ${contact.last_name}`,
      email: contact.email,
      phone: contact.phone || '',
      position: contact.position || '',
      company: contact.company_id ? {
        id: contact.company_id._id,
        name: contact.company_id.name,
        industry: contact.company_id.industry
      } : null
    }));

  res.status(200).json({
    success: true,
    data: formattedContacts,
    count: formattedContacts.length
  });
});

// @desc    Bulk import contacts
// @route   POST /api/contacts/import
// @access  Private
const importContacts = asyncHandler(async (req, res) => {
  const { contacts } = req.body;

  if (!Array.isArray(contacts)) {
    return res.status(400).json({
      success: false,
      error: 'Contacts must be an array'
    });
  }

  const contactsToCreate = contacts.map(contact => ({
    ...contact,
    createdBy: req.user.id
  }));

  const createdContacts = await Contact.insertMany(contactsToCreate);

  res.status(201).json({
    success: true,
    data: createdContacts,
    count: createdContacts.length
  });
});

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getContactsByCompany,
  getAllContacts,
  importContacts
};