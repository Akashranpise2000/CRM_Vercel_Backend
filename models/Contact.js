const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, 'Please add a first name'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  last_name: {
    type: String,
    required: [true, 'Please add a last name'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
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
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot be more than 100 characters']
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  avatar_url: {
    type: String,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
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
contactSchema.index({ email: 1 });
contactSchema.index({ company_id: 1 });
contactSchema.index({ createdBy: 1 });
contactSchema.index({ first_name: 1, last_name: 1 });
contactSchema.index({ createdAt: -1 });

// Virtual for full name
contactSchema.virtual('fullName').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

// Virtual for associated opportunities count
contactSchema.virtual('opportunitiesCount', {
  ref: 'Opportunity',
  localField: '_id',
  foreignField: 'contact',
  count: true
});

// Pre-remove middleware to handle cascading deletes
contactSchema.pre('remove', async function(next) {
  try {
    // Remove associated opportunities
    await mongoose.model('Opportunity').deleteMany({ contact: this._id });
    // Remove associated activities
    await mongoose.model('Activity').deleteMany({ contact: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to find contacts by company
contactSchema.statics.findByCompany = function(companyId) {
  return this.find({ company_id: companyId, isActive: true });
};

// Static method to search contacts
contactSchema.statics.searchContacts = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { first_name: regex },
      { last_name: regex },
      { email: regex },
      { position: regex }
    ],
    isActive: true
  });
};

module.exports = mongoose.model('Contact', contactSchema);