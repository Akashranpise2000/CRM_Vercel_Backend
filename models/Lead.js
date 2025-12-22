const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a lead name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot be more than 100 characters']
  },
  website: {
    type: String,
    trim: true,
    match: [
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
      'Please add a valid website URL'
    ]
  },
  industry: {
    type: String,
    trim: true,
    maxlength: [50, 'Industry cannot be more than 50 characters']
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'advertising', 'cold_call', 'trade_show', 'email_campaign', 'content_download', 'webinar', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'cold', 'warm', 'hot'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  value: {
    type: Number,
    min: [0, 'Value cannot be negative']
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  timeline: {
    type: String,
    enum: ['immediate', '1-3_months', '3-6_months', '6-12_months', '12+_months', 'not_sure'],
    default: 'not_sure'
  },
  requirements: [{
    type: String,
    trim: true
  }],
  painPoints: [{
    type: String,
    trim: true
  }],
  competitors: [{
    name: String,
    notes: String
  }],
  score: {
    type: Number,
    min: [0, 'Score cannot be less than 0'],
    max: [100, 'Score cannot be more than 100'],
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  lastContacted: {
    type: Date,
    default: null
  },
  nextFollowUp: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value >= new Date();
      },
      message: 'Next follow-up date must be in the future'
    }
  },
  assigned_to: {
    type: String,
    trim: true,
    default: 'Sales Team'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  convertedTo: {
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity'
    },
    convertedAt: Date,
    convertedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  activities: [{
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'note'],
      required: true
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    outcome: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ assigned_to: 1 });
leadSchema.index({ createdBy: 1 });
leadSchema.index({ score: -1 });
leadSchema.index({ createdAt: -1 });

// Virtual for lead quality based on score
leadSchema.virtual('quality').get(function() {
  if (this.score >= 80) return 'hot';
  if (this.score >= 60) return 'warm';
  return 'cold';
});

// Virtual for days since last contact
leadSchema.virtual('daysSinceLastContact').get(function() {
  if (!this.lastContacted) return null;
  const today = new Date();
  const lastContact = new Date(this.lastContacted);
  const diffTime = today.getTime() - lastContact.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
leadSchema.pre('save', function(next) {
  // Auto-update status based on activities
  if (this.activities && this.activities.length > 0) {
    const hasRecentActivity = this.activities.some(activity => {
      const activityDate = new Date(activity.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return activityDate >= weekAgo;
    });

    if (hasRecentActivity && this.status === 'new') {
      this.status = 'contacted';
    }
  }

  next();
});

// Static methods
leadSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

leadSchema.statics.findHotLeads = function() {
  return this.find({
    $or: [
      { score: { $gte: 80 } },
      { status: 'hot' },
      { priority: 'high' }
    ]
  })
  .sort({ score: -1, createdAt: -1 });
};

leadSchema.statics.searchLeads = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { name: regex },
      { email: regex },
      { company: regex },
      { position: regex }
    ]
  })
  .sort({ createdAt: -1 });
};

leadSchema.statics.getLeadStats = async function(userId) {
  return await this.aggregate([
    {
      $match: { createdBy: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        avgScore: { $avg: '$score' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

leadSchema.statics.getConversionRate = async function(userId, startDate, endDate) {
  const converted = await this.countDocuments({
    createdBy: userId,
    'convertedTo.convertedAt': {
      $gte: startDate,
      $lte: endDate
    }
  });

  const total = await this.countDocuments({
    createdBy: userId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  });

  return total > 0 ? (converted / total) * 100 : 0;
};

module.exports = mongoose.model('Lead', leadSchema);