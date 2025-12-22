const Lead = require('../models/Lead');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
const getLeads = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { search, status, priority, source } = req.query;

  let query = { createdBy: req.user.id };

  // Add search functionality
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { company: new RegExp(search, 'i') },
      { position: new RegExp(search, 'i') }
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

  // Filter by source
  if (source) {
    query.source = source;
  }

  const leads = await Lead.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ score: -1, createdAt: -1 });

  const total = await Lead.countDocuments(query);

  res.status(200).json({
    success: true,
    data: leads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!lead) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  res.status(200).json({
    success: true,
    data: lead
  });
});

// @desc    Create lead
// @route   POST /api/leads
// @access  Private
const createLead = asyncHandler(async (req, res) => {
  const leadData = {
    ...req.body,
    createdBy: req.user.id
  };

  const lead = await Lead.create(leadData);

  res.status(201).json({
    success: true,
    data: lead
  });
});

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!lead) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  res.status(200).json({
    success: true,
    data: lead
  });
});

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!lead) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  await lead.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get hot leads
// @route   GET /api/leads/hot
// @access  Private
const getHotLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.findHotLeads();

  res.status(200).json({
    success: true,
    data: leads
  });
});

// @desc    Convert lead to contact/company/opportunity
// @route   POST /api/leads/:id/convert
// @access  Private
const convertLead = asyncHandler(async (req, res) => {
  const { contactData, companyData, opportunityData } = req.body;

  const lead = await Lead.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!lead) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  const convertedData = {
    convertedAt: new Date(),
    convertedBy: req.user.id
  };

  // Create contact if provided
  if (contactData) {
    const Contact = require('../models/Contact');
    const contact = await Contact.create({
      ...contactData,
      createdBy: req.user.id
    });
    convertedData.contact = contact._id;
  }

  // Create company if provided
  if (companyData) {
    const Company = require('../models/Company');
    const company = await Company.create({
      ...companyData,
      createdBy: req.user.id
    });
    convertedData.company = company._id;
  }

  // Create opportunity if provided
  if (opportunityData) {
    const Opportunity = require('../models/Opportunity');
    const opportunity = await Opportunity.create({
      ...opportunityData,
      createdBy: req.user.id
    });
    convertedData.opportunity = opportunity._id;
  }

  // Update lead with conversion data
  lead.convertedTo = convertedData;
  await lead.save();

  res.status(200).json({
    success: true,
    data: {
      lead,
      converted: convertedData
    }
  });
});

// @desc    Get lead statistics
// @route   GET /api/leads/stats
// @access  Private
const getLeadStats = asyncHandler(async (req, res) => {
  const stats = await Lead.getLeadStats(req.user.id);

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get lead conversion rate
// @route   GET /api/leads/conversion-rate
// @access  Private
const getConversionRate = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = end_date ? new Date(end_date) : new Date();

  const rate = await Lead.getConversionRate(req.user.id, startDate, endDate);

  res.status(200).json({
    success: true,
    data: {
      conversionRate: rate,
      period: {
        start: startDate,
        end: endDate
      }
    }
  });
});

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getHotLeads,
  convertLead,
  getLeadStats,
  getConversionRate
};