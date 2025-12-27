const Opportunity = require('../models/Opportunity');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all opportunities
// @route   GET /api/opportunities
// @access  Private
const getOpportunities = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { search, status, company_id } = req.query;

  let query = { createdBy: req.user.id };

  // Add search functionality
  if (search) {
    query.$or = [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') }
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by company
  if (company_id) {
    query.company_id = company_id;
  }

  const opportunities = await Opportunity.find(query)
    .populate('company_id', 'name industry')
    .populate('contact_id', 'first_name last_name email')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

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
  .populate('company_id', 'name industry website phone')
  .populate('contact_id', 'first_name last_name email phone position');

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
  const opportunityData = {
    ...req.body,
    createdBy: req.user.id
  };

  const opportunity = await Opportunity.create(opportunityData);

  await opportunity.populate('company_id', 'name industry');
  await opportunity.populate('contact_id', 'first_name last_name email');

  res.status(201).json({
    success: true,
    data: opportunity
  });
});

// @desc    Update opportunity
// @route   PUT /api/opportunities/:id
// @access  Private
const updateOpportunity = asyncHandler(async (req, res) => {
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

  Object.assign(opportunity, req.body);
  await opportunity.save();

  await opportunity.populate('company_id', 'name industry');
  await opportunity.populate('contact_id', 'first_name last_name email');

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

  await Opportunity.findByIdAndDelete(req.params.id);

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
  .populate('contact_id', 'first_name last_name email')
  .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: opportunities
  });
});

// @desc    Get pipeline summary
// @route   GET /api/opportunities/analytics/pipeline
// @access  Private
const getPipelineSummary = asyncHandler(async (req, res) => {
  const pipeline = await Opportunity.aggregate([
    { $match: { createdBy: req.user.id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$amount' },
        avgValue: { $avg: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: pipeline
  });
});

// @desc    Get forecast data
// @route   GET /api/opportunities/analytics/forecast
// @access  Private
const getForecastData = asyncHandler(async (req, res) => {
  const forecast = await Opportunity.aggregate([
    { $match: { createdBy: req.user.id, status: { $ne: 'closed_win' }, status: { $ne: 'lost' } } },
    {
      $group: {
        _id: '$forecast',
        count: { $sum: 1 },
        totalValue: { $sum: '$forecast_amount' },
        avgValue: { $avg: '$forecast_amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

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