const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  industry: {
    type: String,
    trim: true,
    maxlength: [50, 'Industry cannot be more than 50 characters']
  },
  website: {
    type: String,
    trim: true,
    match: [
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
      'Please add a valid website URL'
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  logo_url: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  sector: {
    type: String,
    trim: true
  },
  placeOfOffice: {
    type: String,
    trim: true
  },
  headOffice: {
    type: String,
    trim: true
  },
  poc: {
    name: {
      type: String,
      trim: true
    },
    importance: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  }],
  employeeCount: {
    type: Number,
    min: [0, 'Employee count cannot be negative']
  },
  revenue: {
    type: Number,
    min: [0, 'Revenue cannot be negative']
  },
  foundedYear: {
    type: Number,
    min: [1800, 'Founded year must be valid'],
    max: [new Date().getFullYear(), 'Founded year cannot be in the future']
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'prospect', 'customer', 'former'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastContacted: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ status: 1 });
companySchema.index({ createdBy: 1 });
companySchema.index({ createdAt: -1 });

// Virtual for associated contacts count
companySchema.virtual('contactsCount', {
  ref: 'Contact',
  localField: '_id',
  foreignField: 'company_id',
  count: true
});

// Virtual for associated opportunities count
companySchema.virtual('opportunitiesCount', {
  ref: 'Opportunity',
  localField: '_id',
  foreignField: 'company',
  count: true
});

// Pre-remove middleware to handle cascading deletes
companySchema.pre('remove', async function(next) {
  try {
    // Update associated contacts to remove company reference
    await mongoose.model('Contact').updateMany(
      { company_id: this._id },
      { $unset: { company_id: 1 } }
    );
    // Remove associated opportunities
    await mongoose.model('Opportunity').deleteMany({ company: this._id });
    // Remove associated activities
    await mongoose.model('Activity').deleteMany({ company: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to find companies by industry
companySchema.statics.findByIndustry = function(industry) {
  return this.find({ industry: new RegExp(industry, 'i'), status: 'active' });
};

// Static method to search companies
companySchema.statics.searchCompanies = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { name: regex },
      { industry: regex },
      { sector: regex }
    ],
    status: 'active'
  });
};

// Static method to get company statistics
companySchema.statics.getStatistics = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$revenue' }
      }
    }
  ]);
};

module.exports = mongoose.model('Company', companySchema);