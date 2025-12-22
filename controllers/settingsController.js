const Settings = require('../models/Settings');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ createdBy: req.user.id });

  if (!settings) {
    // Create default settings if not exists
    settings = await Settings.createDefaultSettings(req.user.id, {
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar
    });
  }

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = asyncHandler(async (req, res) => {
  const { user_name, user_email, user_avatar, sectors, activity_types, defaultSettings } = req.body;

  const updateData = {};
  if (user_name) updateData.user_name = user_name;
  if (user_email) updateData.user_email = user_email;
  if (user_avatar !== undefined) updateData.user_avatar = user_avatar;
  if (sectors) updateData.sectors = sectors;
  if (activity_types) updateData.activity_types = activity_types;
  if (defaultSettings) updateData.defaultSettings = defaultSettings;

  let settings = await Settings.findOneAndUpdate(
    { createdBy: req.user.id },
    updateData,
    { new: true, runValidators: true, upsert: true }
  );

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Create default settings for user
// @route   POST /api/settings
// @access  Private
const createSettings = asyncHandler(async (req, res) => {
  const settingsExists = await Settings.findOne({ createdBy: req.user.id });

  if (settingsExists) {
    return res.status(400).json({
      success: false,
      error: 'Settings already exist for this user'
    });
  }

  const settings = await Settings.createDefaultSettings(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: settings
  });
});

module.exports = {
  getSettings,
  updateSettings,
  createSettings
};