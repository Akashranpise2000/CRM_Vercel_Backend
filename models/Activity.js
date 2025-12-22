const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an activity title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  type: {
    type: String,
    required: [true, 'Please specify activity type'],
    enum: ['call', 'email', 'meeting', 'demo', 'proposal', 'follow_up', 'task', 'note', 'other', 'visit'],
    default: 'task'
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'overdue'],
    default: 'scheduled',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  start_time: {
    type: Date,
    required: [true, 'Please add a start time']
  },
  end_time: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value >= this.start_time;
      },
      message: 'End time must be after start time'
    }
  },
  duration: {
    type: Number, // in minutes
    min: [0, 'Duration cannot be negative']
  },
  location: {
    type: String,
    trim: true
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  recurrence: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    interval: {
      type: Number,
      min: 1,
      default: 1
    },
    endDate: Date,
    count: Number // number of occurrences
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'popup', 'sms'],
      default: 'popup'
    },
    minutes: {
      type: Number,
      min: 0,
      default: 15
    }
  }],
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'tentative'],
      default: 'pending'
    }
  }],
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  contact_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  opportunity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  outcome: {
    type: String,
    maxlength: [500, 'Outcome cannot be more than 500 characters']
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
activitySchema.index({ start_time: 1 });
activitySchema.index({ end_time: 1 });
activitySchema.index({ type: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ assignedTo: 1 });
activitySchema.index({ company_id: 1 });
activitySchema.index({ contact_id: 1 });
activitySchema.index({ opportunity_id: 1 });
activitySchema.index({ createdBy: 1 });
activitySchema.index({ createdAt: -1 });

// Virtual for duration calculation
activitySchema.virtual('calculatedDuration').get(function() {
  if (this.end_time && this.start_time) {
    return Math.round((this.end_time.getTime() - this.start_time.getTime()) / (1000 * 60));
  }
  return this.duration || 0;
});

// Virtual for overdue status
activitySchema.virtual('isOverdue').get(function() {
  return this.status === 'scheduled' && this.start_time < new Date();
});

// Pre-save middleware
activitySchema.pre('save', function(next) {
  // Auto-calculate duration if end_time is provided
  if (this.end_time && this.start_time && !this.duration) {
    this.duration = Math.round((this.end_time.getTime() - this.start_time.getTime()) / (1000 * 60));
  }

  // Auto-set status to overdue if past due
  if (this.status === 'scheduled' && this.start_time < new Date()) {
    this.status = 'overdue';
  }

  next();
});

// Static methods
activitySchema.statics.findUpcoming = function(limit = 10) {
  return this.find({
    start_time: { $gte: new Date() },
    status: 'scheduled'
  })
  .populate('company_id')
  .populate('contact_id')
  .populate('opportunity_id')
  .populate('assignedTo')
  .sort({ start_time: 1 })
  .limit(limit);
};

activitySchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    start_time: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .populate('company_id')
  .populate('contact_id')
  .populate('opportunity_id')
  .populate('assignedTo')
  .sort({ start_time: 1 });
};

activitySchema.statics.findOverdue = function() {
  return this.find({
    start_time: { $lt: new Date() },
    status: 'scheduled'
  })
  .populate('company_id')
  .populate('contact_id')
  .populate('opportunity_id')
  .populate('assignedTo')
  .sort({ start_time: 1 });
};

activitySchema.statics.getActivityStats = async function(userId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        createdBy: mongoose.Types.ObjectId(userId),
        start_time: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('Activity', activitySchema);