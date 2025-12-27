const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Company = require('../models/Company');
const Opportunity = require('../models/Opportunity');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
const getLeads = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, priority, source } = req.query;

  let query = { createdBy: req.user.id };

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
    .sort({ created_at: -1 });

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

  Object.assign(lead, req.body);
  await lead.save();

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

  await Lead.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get hot leads
// @route   GET /api/leads/hot/list
// @access  Private
const getHotLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.find({
    createdBy: req.user.id,
    status: 'Hot',
    priority: 'high'
  }).sort({ created_at: -1 });

  res.status(200).json({
    success: true,
    data: leads
  });
});

// @desc    Convert lead to contact/company/opportunity
// @route   POST /api/leads/:id/convert
// @access  Private
const convertLead = asyncHandler(async (req, res) => {
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

  const { create_company, create_opportunity } = req.body;
  const result = { contact: null, company: null, opportunity: null };

  // Create contact
  const contactData = {
    first_name: lead.name.split(' ')[0] || '',
    last_name: lead.name.split(' ').slice(1).join(' ') || '',
    email: lead.email,
    phone: lead.phone,
    position: lead.position,
    createdBy: req.user.id
  };

  const contact = await Contact.create(contactData);
  result.contact = contact;

  // Create company if requested
  if (create_company && lead.company) {
    const companyData = {
      name: lead.company,
      industry: lead.industry,
      website: lead.website,
      email: lead.email,
      createdBy: req.user.id
    };

    const company = await Company.create(companyData);
    contact.company_id = company._id;
    await contact.save();
    result.company = company;
  }

  // Create opportunity if requested
  if (create_opportunity && lead.value) {
    const opportunityData = {
      title: `Lead conversion: ${lead.name}`,
      amount: lead.value,
      contact_id: contact._id,
      company_id: result.company?._id,
      status: 'quality',
      createdBy: req.user.id
    };

    const opportunity = await Opportunity.create(opportunityData);
    result.opportunity = opportunity;
  }

  // Update lead status
  lead.status = 'Won';
  await lead.save();

  res.status(200).json({
    success: true,
    data: result,
    message: 'Lead converted successfully'
  });
});

// @desc    Get lead statistics
// @route   GET /api/leads/analytics/stats
// @access  Private
const getLeadStats = asyncHandler(async (req, res) => {
  const stats = await Lead.aggregate([
    { $match: { createdBy: req.user.id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get lead conversion rate
// @route   GET /api/leads/analytics/conversion
// @access  Private
const getConversionRate = asyncHandler(async (req, res) => {
  const totalLeads = await Lead.countDocuments({ createdBy: req.user.id });
  const convertedLeads = await Lead.countDocuments({
    createdBy: req.user.id,
    status: { $in: ['Won', 'won'] }
  });

  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      totalLeads,
      convertedLeads,
      conversionRate: Math.round(conversionRate * 100) / 100
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