const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an opportunity title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [0, 'Amount cannot be negative']
  },
  forecastAmount: {
    type: Number,
    min: [0, 'Forecast amount cannot be negative'],
    default: function() {
      return this.amount;
    }
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY']
  },
  status: {
    type: String,
    enum: ['quality', 'meet_contact', 'meet_present', 'purpose', 'negotiate', 'closed_win', 'lost', 'not_responding', 'remarks'],
    default: 'quality',
    required: true
  },
  stage: {
    type: String,
    enum: ['lead', 'meet_contact', 'meet_present', 'not_responding'],
    default: 'lead'
  },
  status_remarks: {
    type: String,
    maxlength: [500, 'Status remarks cannot be more than 500 characters']
  },
  forecast: {
    type: String,
    enum: ['omitted', 'in-pipeline', 'bestcase', 'commit', 'closed'],
    default: 'in-pipeline'
  },
  importance: {
    type: Number,
    enum: [1, 2, 3],
    default: 2
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  probability: {
    type: Number,
    min: [0, 'Probability cannot be less than 0'],
    max: [100, 'Probability cannot be more than 100'],
    default: 0
  },
  close_date: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value >= new Date();
      },
      message: 'Close date must be in the future'
    }
  },
  open_date: {
    type: Date,
    default: Date.now
  },
  key_person_name: {
    type: String,
    trim: true,
    maxlength: [100, 'Key person name cannot be more than 100 characters']
  },
  products_pitched: [{
    type: String,
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
  }],
  sector: {
    type: String,
    trim: true,
    maxlength: [50, 'Sector cannot be more than 50 characters']
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'cold_call', 'email', 'social_media', 'trade_show', 'advertising', 'other'],
    default: 'other'
  },
  competitors: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    strength: {
      type: String,
      enum: ['weak', 'moderate', 'strong'],
      default: 'moderate'
    }
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  nextSteps: [{
    description: String,
    dueDate: Date,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Please associate an opportunity with a company']
  },
  contact_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  owner: {
    type: String,
    trim: true,
    default: 'Sales Team'
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
  notes: [{
    content: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
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
opportunitySchema.index({ company_id: 1 });
opportunitySchema.index({ contact_id: 1 });
opportunitySchema.index({ status: 1 });
opportunitySchema.index({ priority: 1 });
opportunitySchema.index({ sector: 1 });
opportunitySchema.index({ createdBy: 1 });
opportunitySchema.index({ close_date: 1 });
opportunitySchema.index({ createdAt: -1 });

// Virtual for deal value calculation
opportunitySchema.virtual('weightedValue').get(function() {
  return (this.amount * this.probability) / 100;
});

// Virtual for days until close
opportunitySchema.virtual('daysToClose').get(function() {
  if (!this.close_date) return null;
  const today = new Date();
  const closeDate = new Date(this.close_date);
  const diffTime = closeDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
opportunitySchema.pre('save', function(next) {
  // Auto-update forecast amount if not set
  if (!this.forecastAmount) {
    this.forecastAmount = this.amount;
  }

  // Auto-set probability based on status if not set
  if (this.probability === 0) {
    switch (this.status) {
      case 'lead':
        this.probability = 10;
        break;
      case 'qualified':
        this.probability = 30;
        break;
      case 'proposal':
        this.probability = 60;
        break;
      case 'negotiation':
        this.probability = 80;
        break;
      case 'won':
        this.probability = 100;
        break;
      case 'lost':
        this.probability = 0;
        break;
    }
  }

  next();
});

// Static methods
opportunitySchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('company_id').populate('contact_id');
};

opportunitySchema.statics.findByCompany = function(companyId) {
  return this.find({ company_id: companyId }).populate('contact_id');
};

opportunitySchema.statics.getPipelineSummary = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$amount' },
        avgProbability: { $avg: '$probability' },
        weightedValue: {
          $sum: { $multiply: ['$amount', { $divide: ['$probability', 100] }] }
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

opportunitySchema.statics.getForecastByMonth = async function() {
  return await this.aggregate([
    {
      $match: {
        close_date: { $exists: true },
        status: { $nin: ['won', 'lost'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$close_date' },
          month: { $month: '$close_date' }
        },
        totalValue: { $sum: '$forecastAmount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

module.exports = mongoose.model('Opportunity', opportunitySchema);