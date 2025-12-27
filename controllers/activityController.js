const Activity = require('../models/Activity');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all activities
// @route   GET /api/activities
// @access  Private
const getActivities = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { contact, opportunity, company, status } = req.query;

  let query = { createdBy: req.user.id };

  // Filter by contact
  if (contact) {
    query.contact_id = contact;
  }

  // Filter by opportunity
  if (opportunity) {
    query.opportunity_id = opportunity;
  }

  // Filter by company
  if (company) {
    query.company_id = company;
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  const activities = await Activity.find(query)
    .populate('contact_id', 'first_name last_name email')
    .populate('company_id', 'name industry')
    .populate('opportunity_id', 'title amount')
    .skip(skip)
    .limit(limit)
    .sort({ start_time: -1 });

  const total = await Activity.countDocuments(query);

  res.status(200).json({
    success: true,
    data: activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single activity
// @route   GET /api/activities/:id
// @access  Private
const getActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  })
  .populate('contact_id', 'first_name last_name email phone')
  .populate('company_id', 'name industry website phone')
  .populate('opportunity_id', 'title amount status');

  if (!activity) {
    return res.status(404).json({
      success: false,
      error: 'Activity not found'
    });
  }

  res.status(200).json({
    success: true,
    data: activity
  });
});

// @desc    Create activity
// @route   POST /api/activities
// @access  Private
const createActivity = asyncHandler(async (req, res) => {
  const activityData = {
    ...req.body,
    createdBy: req.user.id
  };

  const activity = await Activity.create(activityData);

  await activity.populate('contact_id', 'first_name last_name email');
  await activity.populate('company_id', 'name industry');
  await activity.populate('opportunity_id', 'title amount');

  res.status(201).json({
    success: true,
    data: activity
  });
});

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private
const updateActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!activity) {
    return res.status(404).json({
      success: false,
      error: 'Activity not found'
    });
  }

  Object.assign(activity, req.body);
  await activity.save();

  await activity.populate('contact_id', 'first_name last_name email');
  await activity.populate('company_id', 'name industry');
  await activity.populate('opportunity_id', 'title amount');

  res.status(200).json({
    success: true,
    data: activity
  });
});

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private
const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!activity) {
    return res.status(404).json({
      success: false,
      error: 'Activity not found'
    });
  }

  await Activity.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get upcoming activities
// @route   GET /api/activities/upcoming/list
// @access  Private
const getUpcomingActivities = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const now = new Date();

  const activities = await Activity.find({
    createdBy: req.user.id,
    start_time: { $gte: now },
    status: 'scheduled'
  })
  .populate('contact_id', 'first_name last_name email')
  .populate('company_id', 'name industry')
  .populate('opportunity_id', 'title amount')
  .sort({ start_time: 1 })
  .limit(limit);

  res.status(200).json({
    success: true,
    data: activities
  });
});

// @desc    Get overdue activities
// @route   GET /api/activities/overdue/list
// @access  Private
const getOverdueActivities = asyncHandler(async (req, res) => {
  const now = new Date();

  const activities = await Activity.find({
    createdBy: req.user.id,
    start_time: { $lt: now },
    status: 'scheduled'
  })
  .populate('contact_id', 'first_name last_name email')
  .populate('company_id', 'name industry')
  .populate('opportunity_id', 'title amount')
  .sort({ start_time: -1 });

  res.status(200).json({
    success: true,
    data: activities
  });
});

// @desc    Get activities by date range
// @route   GET /api/activities/range/date
// @access  Private
const getActivitiesByDateRange = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: 'Start date and end date are required'
    });
  }

  const activities = await Activity.find({
    createdBy: req.user.id,
    start_time: {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    }
  })
  .populate('contact_id', 'first_name last_name email')
  .populate('company_id', 'name industry')
  .populate('opportunity_id', 'title amount')
  .sort({ start_time: 1 });

  res.status(200).json({
    success: true,
    data: activities
  });
});

module.exports = {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  getUpcomingActivities,
  getOverdueActivities,
  getActivitiesByDateRange
};