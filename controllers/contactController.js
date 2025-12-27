const Contact = require('../models/Contact');
const {
  linkContactToCompany,
  updateContactCompany
} = require('../services/relationshipService');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Get all contacts (paginated)
 * @route   GET /api/contacts
 * @access  Private
 */
const getContacts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { search, company, status } = req.query;

  let query = { createdBy: req.user.id };

  if (search) {
    query.$or = [
      { first_name: new RegExp(search, 'i') },
      { last_name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { position: new RegExp(search, 'i') }
    ];
  }

  if (company) query.company_id = company;

  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;

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

/**
 * @desc    Get single contact
 * @route   GET /api/contacts/:id
 * @access  Private
 */
const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  }).populate('company_id', 'name industry website phone');

  if (!contact) {
    return res.status(404).json({ success: false, error: 'Contact not found' });
  }

  res.status(200).json({ success: true, data: contact });
});

/**
 * @desc    Create contact
 * @route   POST /api/contacts
 * @access  Private
 */
const createContact = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, phone } = req.body;

  let duplicateQuery = { createdBy: req.user.id };

  if (email) duplicateQuery.email = email;
  else if (phone) duplicateQuery.phone = phone;
  else if (first_name && last_name) {
    duplicateQuery.first_name = new RegExp(`^${first_name}$`, 'i');
    duplicateQuery.last_name = new RegExp(`^${last_name}$`, 'i');
  }

  if (Object.keys(duplicateQuery).length > 1) {
    const existing = await Contact.findOne(duplicateQuery);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Contact already exists',
        duplicate: {
          id: existing._id,
          name: `${existing.first_name} ${existing.last_name}`,
          email: existing.email,
          phone: existing.phone
        }
      });
    }
  }

  const contact = await Contact.create({
    ...req.body,
    createdBy: req.user.id
  });

  if (contact.company_id) {
    await linkContactToCompany(contact._id, contact.company_id, req.user.id);
  }

  await contact.populate('company_id', 'name industry');

  res.status(201).json({ success: true, data: contact });
});

/**
 * @desc    Update contact
 * @route   PUT /api/contacts/:id
 * @access  Private
 */
const updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!contact) {
    return res.status(404).json({ success: false, error: 'Contact not found' });
  }

  const oldCompanyId = contact.company_id?.toString();
  const newCompanyId = req.body.company_id;

  Object.assign(contact, req.body);
  await contact.save();

  if (newCompanyId && newCompanyId !== oldCompanyId) {
    await updateContactCompany(contact._id, newCompanyId, req.user.id);
  }

  await contact.populate('company_id', 'name industry');

  res.status(200).json({ success: true, data: contact });
});

/**
 * @desc    Delete contact
 * @route   DELETE /api/contacts/:id
 * @access  Private
 */
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!contact) {
    return res.status(404).json({ success: false, error: 'Contact not found' });
  }

  await contact.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

/**
 * @desc    Get contacts by company
 * @route   GET /api/contacts/company/:companyId
 * @access  Private
 */
const getContactsByCompany = asyncHandler(async (req, res) => {
  const contacts = await Contact.find({
    company_id: req.params.companyId,
    createdBy: req.user.id,
    isActive: true
  }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: contacts });
});

/**
 * @desc    Get all contacts (dropdown)
 * @route   GET /api/contacts/all
 * @access  Private
 */
const getAllContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find({
    createdBy: req.user.id,
    isActive: true
  })
    .populate('company_id', 'name industry')
    .select('first_name last_name email phone position company_id')
    .sort({ first_name: 1, last_name: 1 })
    .lean();

  const formatted = contacts
    .filter(c => c.first_name && c.last_name && c.email)
    .map(c => ({
      id: c._id,
      name: `${c.first_name} ${c.last_name}`,
      email: c.email,
      phone: c.phone || '',
      position: c.position || '',
      company: c.company_id
        ? {
            id: c.company_id._id,
            name: c.company_id.name,
            industry: c.company_id.industry
          }
        : null
    }));

  res.status(200).json({
    success: true,
    data: formatted,
    count: formatted.length
  });
});

/**
 * @desc    Bulk import contacts
 * @route   POST /api/contacts/import
 * @access  Private
 */
const importContacts = asyncHandler(async (req, res) => {
  const { contacts } = req.body;

  if (!Array.isArray(contacts)) {
    return res.status(400).json({
      success: false,
      error: 'Contacts must be an array'
    });
  }

  const created = await Contact.insertMany(
    contacts.map(c => ({ ...c, createdBy: req.user.id }))
  );

  res.status(201).json({
    success: true,
    data: created,
    count: created.length
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