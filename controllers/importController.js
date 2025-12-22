const Contact = require('../models/Contact');
const Company = require('../models/Company');
const Opportunity = require('../models/Opportunity');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Import bulk data
// @route   POST /api/import
// @access  Private
const importData = asyncHandler(async (req, res) => {
  const { companies = [], contacts = [], opportunities = [] } = req.body;

  const results = {
    companies: { success: 0, failed: 0, errors: [] },
    contacts: { success: 0, failed: 0, errors: [] },
    opportunities: { success: 0, failed: 0, errors: [] }
  };

  // Import companies using bulk insert for better performance
  if (companies.length > 0) {
    try {
      const companiesToInsert = companies.map(companyData => ({
        ...companyData,
        createdBy: req.user.id
      }));
      const insertedCompanies = await Company.insertMany(companiesToInsert, { ordered: false });
      results.companies.success = insertedCompanies.length;
    } catch (error) {
      // Handle bulk insert errors
      if (error.writeErrors) {
        results.companies.success = error.result.nInserted || 0;
        results.companies.failed = error.writeErrors.length;
        results.companies.errors = error.writeErrors.map(err => ({
          data: companies[err.index],
          error: err.errmsg
        }));
      } else {
        results.companies.failed = companies.length;
        results.companies.errors.push({
          data: companies,
          error: error.message
        });
      }
    }
  }

  // Import contacts using bulk insert for better performance
  if (contacts.length > 0) {
    try {
      const contactsToInsert = contacts.map(contactData => ({
        ...contactData,
        createdBy: req.user.id
      }));
      const insertedContacts = await Contact.insertMany(contactsToInsert, { ordered: false });
      results.contacts.success = insertedContacts.length;
    } catch (error) {
      // Handle bulk insert errors
      if (error.writeErrors) {
        results.contacts.success = error.result.nInserted || 0;
        results.contacts.failed = error.writeErrors.length;
        results.contacts.errors = error.writeErrors.map(err => ({
          data: contacts[err.index],
          error: err.errmsg
        }));
      } else {
        results.contacts.failed = contacts.length;
        results.contacts.errors.push({
          data: contacts,
          error: error.message
        });
      }
    }
  }

  // Import opportunities using bulk insert for better performance
  if (opportunities.length > 0) {
    try {
      const opportunitiesToInsert = opportunities.map(opportunityData => ({
        ...opportunityData,
        createdBy: req.user.id
      }));
      const insertedOpportunities = await Opportunity.insertMany(opportunitiesToInsert, { ordered: false });
      results.opportunities.success = insertedOpportunities.length;
    } catch (error) {
      // Handle bulk insert errors
      if (error.writeErrors) {
        results.opportunities.success = error.result.nInserted || 0;
        results.opportunities.failed = error.writeErrors.length;
        results.opportunities.errors = error.writeErrors.map(err => ({
          data: opportunities[err.index],
          error: err.errmsg
        }));
      } else {
        results.opportunities.failed = opportunities.length;
        results.opportunities.errors.push({
          data: opportunities,
          error: error.message
        });
      }
    }
  }

  console.log('Import completed:', results);

  res.status(201).json({
    success: true,
    message: 'Import completed',
    results
  });
});

// @desc    Validate import data
// @route   POST /api/import/validate
// @access  Private
const validateImportData = asyncHandler(async (req, res) => {
  const { companies = [], contacts = [], opportunities = [] } = req.body;

  const validation = {
    companies: { valid: 0, invalid: 0, errors: [] },
    contacts: { valid: 0, invalid: 0, errors: [] },
    opportunities: { valid: 0, invalid: 0, errors: [] }
  };

  // Validate companies
  companies.forEach((company, index) => {
    const errors = [];
    if (!company.name || company.name.trim().length === 0) {
      errors.push('Company name is required');
    }
    if (errors.length > 0) {
      validation.companies.invalid++;
      validation.companies.errors.push({ index, errors });
    } else {
      validation.companies.valid++;
    }
  });

  // Validate contacts
  contacts.forEach((contact, index) => {
    const errors = [];
    if (!contact.first_name || contact.first_name.trim().length === 0) {
      errors.push('First name is required');
    }
    if (!contact.last_name || contact.last_name.trim().length === 0) {
      errors.push('Last name is required');
    }
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errors.push('Invalid email format');
    }
    if (errors.length > 0) {
      validation.contacts.invalid++;
      validation.contacts.errors.push({ index, errors });
    } else {
      validation.contacts.valid++;
    }
  });

  // Validate opportunities
  opportunities.forEach((opportunity, index) => {
    const errors = [];
    if (!opportunity.title || opportunity.title.trim().length === 0) {
      errors.push('Opportunity title is required');
    }
    if (typeof opportunity.amount !== 'number' || opportunity.amount < 0) {
      errors.push('Valid amount is required');
    }
    if (errors.length > 0) {
      validation.opportunities.invalid++;
      validation.opportunities.errors.push({ index, errors });
    } else {
      validation.opportunities.valid++;
    }
  });

  res.status(200).json({
    success: true,
    validation
  });
});

module.exports = {
  importData,
  validateImportData
};