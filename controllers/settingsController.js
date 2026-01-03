const Settings = require('../models/Settings');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ createdBy: req.user.id });

  // If no settings exist, create default settings
  if (!settings) {
    settings = await Settings.create({
      user_name: req.user.name || 'User',
      user_email: req.user.email || null,
      createdBy: req.user.id,
      sectors: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Energy', 'Education', 'Retail', 'Media'],
      activity_types: ['call', 'email', 'meeting', 'demo', 'proposal', 'follow_up']
    });
  }

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Create user settings
// @route   POST /api/settings
// @access  Private
const createSettings = asyncHandler(async (req, res) => {
  // Check if settings already exist
  const existingSettings = await Settings.findOne({ createdBy: req.user.id });

  if (existingSettings) {
    return res.status(400).json({
      success: false,
      error: 'Settings already exist for this user'
    });
  }

  const settingsData = {
    ...req.body,
    createdBy: req.user.id
  };

  const settings = await Settings.create(settingsData);

  res.status(201).json({
    success: true,
    data: settings
  });
});

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ createdBy: req.user.id });

  if (!settings) {
    // Create settings if they don't exist
    settings = await Settings.create({
      ...req.body,
      createdBy: req.user.id
    });
  } else {
    // Update existing settings
    Object.assign(settings, req.body);
    await settings.save();
  }

  res.status(200).json({
    success: true,
    data: settings
  });
});

module.exports = {
  getSettings,
  createSettings,
  updateSettings
};