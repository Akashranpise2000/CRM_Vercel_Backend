const mongoose = require('mongoose');

const competitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a competitor name'],
    trim: true,
    maxlength: [100, 'Competitor name cannot be more than 100 characters']
  },
  strength: {
    type: String,
    trim: true,
    maxlength: [500, 'Strength description cannot be more than 500 characters']
  },
  weakness: {
    type: String,
    trim: true,
    maxlength: [500, 'Weakness description cannot be more than 500 characters']
  },
  positionVsYou: {
    type: String,
    trim: true,
    maxlength: [200, 'Position description cannot be more than 200 characters']
  },
  status: {
    type: String,
    enum: ['Equal', 'Superior', 'Inferior'],
    default: 'Equal'
  },
  marketShare: {
    type: Number,
    min: [0, 'Market share cannot be negative'],
    max: [100, 'Market share cannot exceed 100%']
  },
  pricingModel: {
    type: String,
    trim: true,
    maxlength: [200, 'Pricing model description cannot be more than 200 characters']
  },
  keyFeatures: {
    type: String,
    trim: true,
    maxlength: [1000, 'Key features description cannot be more than 1000 characters']
  },
  customerBase: {
    type: String,
    trim: true,
    maxlength: [500, 'Customer base description cannot be more than 500 characters']
  },
  recentDevelopments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Recent developments description cannot be more than 1000 characters']
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
competitorSchema.index({ name: 1 });
competitorSchema.index({ status: 1 });
competitorSchema.index({ createdBy: 1 });
competitorSchema.index({ createdAt: -1 });

// Static method to search competitors
competitorSchema.statics.searchCompetitors = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { name: regex },
      { strength: regex },
      { weakness: regex },
      { keyFeatures: regex }
    ]
  });
};

// Static method to get competitor statistics
competitorSchema.statics.getStatistics = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Competitor', competitorSchema);