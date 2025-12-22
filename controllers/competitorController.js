const Competitor = require('../models/Competitor');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all competitors
// @route   GET /api/competitors
// @access  Private
const getCompetitors = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { search, status } = req.query;

  let query = { createdBy: req.user.id };

  // Add search functionality
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { strength: new RegExp(search, 'i') },
      { weakness: new RegExp(search, 'i') },
      { keyFeatures: new RegExp(search, 'i') }
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  const competitors = await Competitor.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Competitor.countDocuments(query);

  res.status(200).json({
    success: true,
    data: competitors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single competitor
// @route   GET /api/competitors/:id
// @access  Private
const getCompetitor = asyncHandler(async (req, res) => {
  const competitor = await Competitor.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!competitor) {
    return res.status(404).json({
      success: false,
      error: 'Competitor not found'
    });
  }

  res.status(200).json({
    success: true,
    data: competitor
  });
});

// @desc    Create competitor
// @route   POST /api/competitors
// @access  Private
const createCompetitor = asyncHandler(async (req, res) => {
  const competitorData = {
    ...req.body,
    createdBy: req.user.id
  };

  const competitor = await Competitor.create(competitorData);

  res.status(201).json({
    success: true,
    data: competitor
  });
});

// @desc    Update competitor
// @route   PUT /api/competitors/:id
// @access  Private
const updateCompetitor = asyncHandler(async (req, res) => {
  const competitor = await Competitor.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!competitor) {
    return res.status(404).json({
      success: false,
      error: 'Competitor not found'
    });
  }

  res.status(200).json({
    success: true,
    data: competitor
  });
});

// @desc    Delete competitor
// @route   DELETE /api/competitors/:id
// @access  Private
const deleteCompetitor = asyncHandler(async (req, res) => {
  const competitor = await Competitor.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!competitor) {
    return res.status(404).json({
      success: false,
      error: 'Competitor not found'
    });
  }

  await Competitor.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get competitor statistics
// @route   GET /api/competitors/stats
// @access  Private
const getCompetitorStats = asyncHandler(async (req, res) => {
  const stats = await Competitor.getStatistics();

  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  getCompetitors,
  getCompetitor,
  createCompetitor,
  updateCompetitor,
  deleteCompetitor,
  getCompetitorStats
};