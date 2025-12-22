const Activity = require('../models/Activity');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all activities
// @route   GET /api/activities
// @access  Private
const getActivities = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { type, status, company_id, contact_id, opportunity_id, start_date, end_date } = req.query;

  let query = { createdBy: req.user.id };

  // Filter by type
  if (type) {
    query.type = type;
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by company
  if (company_id) {
    query.company_id = company_id;
  }

  // Filter by contact
  if (contact_id) {
    query.contact_id = contact_id;
  }

  // Filter by opportunity
  if (opportunity_id) {
    query.opportunity_id = opportunity_id;
  }

  // Filter by date range
  if (start_date || end_date) {
    query.start_time = {};
    if (start_date) query.start_time.$gte = new Date(start_date);
    if (end_date) query.start_time.$lte = new Date(end_date);
  }

  const activities = await Activity.find(query)
    .populate('company_id', 'name')
    .populate('contact_id', 'first_name last_name')
    .populate('opportunity_id', 'title')
    .populate('assignedTo', 'name')
    .skip(skip)
    .limit(limit)
    .sort({ start_time: -1 })
    .lean(); // Use lean() for better performance

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
  .populate('company_id')
  .populate('contact_id')
  .populate('opportunity_id')
  .populate('assignedTo', 'name');

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

  await activity.populate('company_id', 'name');
  await activity.populate('contact_id', 'first_name last_name');
  await activity.populate('opportunity_id', 'title');

  res.status(201).json({
    success: true,
    data: activity
  });
});

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private
const updateActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    req.body,
    { new: true, runValidators: true }
  )
  .populate('company_id', 'name')
  .populate('contact_id', 'first_name last_name')
  .populate('opportunity_id', 'title');

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

  await activity.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get upcoming activities
// @route   GET /api/activities/upcoming
// @access  Private
const getUpcomingActivities = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const activities = await Activity.findUpcoming(limit);

  res.status(200).json({
    success: true,
    data: activities
  });
});

// @desc    Get overdue activities
// @route   GET /api/activities/overdue
// @access  Private
const getOverdueActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.findOverdue();

  res.status(200).json({
    success: true,
    data: activities
  });
});

// @desc    Get activities by date range
// @route   GET /api/activities/range
// @access  Private
const getActivitiesByDateRange = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: 'Start date and end date are required'
    });
  }

  const activities = await Activity.findByDateRange(
    new Date(start_date),
    new Date(end_date)
  );

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