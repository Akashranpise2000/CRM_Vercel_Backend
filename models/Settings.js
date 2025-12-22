const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  user_name: {
    type: String,
    required: [true, 'Please add a user name'],
    trim: true,
    maxlength: [50, 'User name cannot be more than 50 characters']
  },
  user_email: {
    type: String,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  user_avatar: {
    type: String,
    default: null
  },
  sectors: [{
    type: String,
    trim: true
  }],
  activity_types: [{
    type: String,
    trim: true,
    enum: ['call', 'email', 'meeting', 'demo', 'proposal', 'follow_up', 'task', 'note', 'other']
  }],
  defaultSettings: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY']
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
settingsSchema.index({ createdBy: 1 }, { unique: true });
settingsSchema.index({ createdAt: -1 });

// Pre-save middleware to set default values
settingsSchema.pre('save', function(next) {
  // Set default sectors if not provided
  if (!this.sectors || this.sectors.length === 0) {
    this.sectors = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Energy', 'Other'];
  }

  // Set default activity types if not provided
  if (!this.activity_types || this.activity_types.length === 0) {
    this.activity_types = ['call', 'email', 'meeting', 'task', 'note'];
  }

  next();
});

// Static method to get user settings
settingsSchema.statics.getUserSettings = function(userId) {
  return this.findOne({ createdBy: userId });
};

// Static method to create default settings for user
settingsSchema.statics.createDefaultSettings = function(userId, userData = {}) {
  return this.create({
    user_name: userData.name || 'User',
    user_email: userData.email || null,
    user_avatar: userData.avatar || null,
    createdBy: userId
  });
};

module.exports = mongoose.model('Settings', settingsSchema);