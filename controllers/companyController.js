const Company = require('../models/Company');
const { updateCompanyContacts } = require('../services/relationshipService');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
const getCompanies = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { search, industry, status } = req.query;

  let query = { createdBy: req.user.id };

  // Add search functionality
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { industry: new RegExp(search, 'i') },
      { sector: new RegExp(search, 'i') }
    ];
  }

  // Filter by industry
  if (industry) {
    query.industry = new RegExp(industry, 'i');
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  const companies = await Company.find(query)
    .populate('contacts', 'first_name last_name email phone position')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Company.countDocuments(query);

  res.status(200).json({
    success: true,
    data: companies,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Private
const getCompany = asyncHandler(async (req, res) => {
   const company = await Company.findOne({
     _id: req.params.id,
     createdBy: req.user.id
   }).populate('contacts', 'first_name last_name email phone position');

   if (!company) {
     return res.status(404).json({
       success: false,
       error: 'Company not found'
     });
   }

   res.status(200).json({
     success: true,
     data: company
   });
});

// @desc    Create company
// @route   POST /api/companies
// @access  Private
const createCompany = asyncHandler(async (req, res) => {
   const { contacts, ...companyData } = req.body;

   // Check for duplicate companies
   let duplicateQuery = { createdBy: req.user.id };

   // Check by name (required field)
   if (companyData.name) {
     duplicateQuery.name = new RegExp(`^${companyData.name.trim()}$`, 'i');
   }

   // Check by email if provided
   if (companyData.email && !companyData.name) {
     duplicateQuery.email = companyData.email.toLowerCase();
   }

   // Check by website if provided and no name/email match
   if (companyData.website && !companyData.name && !companyData.email) {
     duplicateQuery.website = new RegExp(`^${companyData.website.trim()}$`, 'i');
   }

   // If we have criteria to check, perform duplicate check
   if (Object.keys(duplicateQuery).length > 1) { // More than just createdBy
     const existingCompany = await Company.findOne(duplicateQuery);

     if (existingCompany) {
       return res.status(409).json({
         success: false,
         error: 'Company already exists in the system.',
         duplicate: {
           id: existingCompany._id,
           name: existingCompany.name,
           email: existingCompany.email,
           website: existingCompany.website,
           industry: existingCompany.industry
         }
       });
     }
   }

   const finalCompanyData = {
     ...companyData,
     contacts: contacts || [], // contacts should be array of ObjectIds
     createdBy: req.user.id
   };

   const company = await Company.create(finalCompanyData);

   // Link contacts to company if provided
   if (contacts && Array.isArray(contacts) && contacts.length > 0) {
     await updateCompanyContacts(company._id, contacts, req.user.id);
   }

   res.status(201).json({
     success: true,
     data: company
   });
});

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private
const updateCompany = asyncHandler(async (req, res) => {
   const company = await Company.findOne({ _id: req.params.id, createdBy: req.user.id });

   if (!company) {
     return res.status(404).json({
       success: false,
       error: 'Company not found'
     });
   }

   const { contacts, ...updateData } = req.body;

   // Update company data
   Object.assign(company, updateData);
   await company.save();

   // Handle contacts relationship change if contacts array is provided
   if (contacts !== undefined) {
     await updateCompanyContacts(req.params.id, contacts, req.user.id);
   }

   res.status(200).json({
     success: true,
     data: company
   });
});

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private
const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Company not found'
    });
  }

  await Company.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get all companies for dropdown
// @route   GET /api/companies/all
// @access  Public (for now to fix auth issue)
const getAllCompanies = asyncHandler(async (req, res) => {
  // If no user (public access), return empty array for security
  if (!req.user) {
    return res.status(200).json({
      success: true,
      data: [],
      count: 0
    });
  }

  const companies = await Company.find({
    createdBy: req.user.id
  })
  .select('name industry website phone sector placeOfOffice headOffice poc email')
  .sort({ name: 1 })
  .lean();

  // Filter out companies with empty required fields and format for dropdown
  const formattedCompanies = companies
    .filter(company => company.name && company.name.trim())
    .map(company => ({
      id: company._id,
      name: company.name,
      industry: company.industry || '',
      website: company.website || '',
      phone: company.phone || '',
      sector: company.sector || '',
      placeOfOffice: company.placeOfOffice || '',
      headOffice: company.headOffice || '',
      poc: company.poc || null,
      email: company.email || ''
    }));

  res.status(200).json({
    success: true,
    data: formattedCompanies,
    count: formattedCompanies.length
  });
});

// @desc    Get company statistics
// @route   GET /api/companies/stats
// @access  Private
const getCompanyStats = asyncHandler(async (req, res) => {
  const stats = await Company.getStatistics();

  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getAllCompanies,
  getCompanyStats
};