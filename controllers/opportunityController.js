const Opportunity = require('../models/Opportunity');
const Company = require('../models/Company');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all opportunities
// @route   GET /api/opportunities
// @access  Private
const getOpportunities = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { search, status, priority, company_id } = req.query;

  let query = { createdBy: req.user.id };

  // Add search functionality
  if (search) {
    query.$or = [
      { title: new RegExp(search, 'i') },
      { sector: new RegExp(search, 'i') }
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by priority
  if (priority) {
    query.priority = priority;
  }

  // Filter by company
  if (company_id) {
    query.company_id = company_id;
  }

  const opportunities = await Opportunity.find(query)
    .populate('company_id', 'name industry')
    .populate('contact_id', 'first_name last_name')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await Opportunity.countDocuments(query);

  res.status(200).json({
    success: true,
    data: opportunities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single opportunity
// @route   GET /api/opportunities/:id
// @access  Private
const getOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  })
  .populate('company_id')
  .populate('contact_id');

  if (!opportunity) {
    return res.status(404).json({
      success: false,
      error: 'Opportunity not found'
    });
  }

  res.status(200).json({
    success: true,
    data: opportunity
  });
});

// @desc    Create opportunity
// @route   POST /api/opportunities
// @access  Private
const createOpportunity = asyncHandler(async (req, res) => {
  const { company_data, ...opportunityFields } = req.body;

  let companyId = opportunityFields.company_id;

  // If company_data is provided, create the company first
  if (company_data) {
    const company = await Company.create({
      ...company_data,
      createdBy: req.user.id
    });
    companyId = company._id;
  }

  const opportunityData = {
    ...opportunityFields,
    company_id: companyId,
    createdBy: req.user.id
  };

  const opportunity = await Opportunity.create(opportunityData);

  await opportunity.populate('company_id', 'name industry');
  await opportunity.populate('contact_id', 'first_name last_name');

  res.status(201).json({
    success: true,
    data: opportunity
  });
});

// @desc    Update opportunity
// @route   PUT /api/opportunities/:id
// @access  Private
const updateOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    req.body,
    { new: true, runValidators: true }
  )
  .populate('company_id', 'name industry')
  .populate('contact_id', 'first_name last_name');

  if (!opportunity) {
    return res.status(404).json({
      success: false,
      error: 'Opportunity not found'
    });
  }

  res.status(200).json({
    success: true,
    data: opportunity
  });
});

// @desc    Delete opportunity
// @route   DELETE /api/opportunities/:id
// @access  Private
const deleteOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!opportunity) {
    return res.status(404).json({
      success: false,
      error: 'Opportunity not found'
    });
  }

  await opportunity.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get opportunities by company
// @route   GET /api/opportunities/company/:companyId
// @access  Private
const getOpportunitiesByCompany = asyncHandler(async (req, res) => {
  const opportunities = await Opportunity.find({
    company_id: req.params.companyId,
    createdBy: req.user.id
  })
  .populate('contact_id', 'first_name last_name')
  .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: opportunities
  });
});

// @desc    Get pipeline summary
// @route   GET /api/opportunities/pipeline
// @access  Private
const getPipelineSummary = asyncHandler(async (req, res) => {
  const pipeline = await Opportunity.getPipelineSummary();

  res.status(200).json({
    success: true,
    data: pipeline
  });
});

// @desc    Get forecast data
// @route   GET /api/opportunities/forecast
// @access  Private
const getForecastData = asyncHandler(async (req, res) => {
  const currentYear = new Date().getFullYear();
  const forecast = await Opportunity.getForecastByMonth(currentYear);

  res.status(200).json({
    success: true,
    data: forecast
  });
});

module.exports = {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getOpportunitiesByCompany,
  getPipelineSummary,
  getForecastData
};