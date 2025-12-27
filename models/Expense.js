const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an expense title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY']
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
    enum: ['Travel', 'Meals', 'Office Supplies', 'Software', 'Marketing', 'Training', 'Equipment', 'Miscellaneous'],
    default: 'Miscellaneous'
  },
  subcategory: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please add a date'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other'],
    default: 'credit_card'
  },
  vendor: {
    name: {
      type: String,
      trim: true
    },
    contact: {
      phone: String,
      email: String
    }
  },
  receipt: {
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  isBillable: {
    type: Boolean,
    default: false
  },
  billableAmount: {
    type: Number,
    min: [0, 'Billable amount cannot be negative']
  },
  taxRate: {
    type: Number,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  taxAmount: {
    type: Number,
    min: [0, 'Tax amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    min: [0, 'Total amount cannot be negative']
  },
  opportunity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  project: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reimbursed'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  reimbursementDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ opportunity_id: 1 });
expenseSchema.index({ company: 1 });
expenseSchema.index({ createdAt: -1 });

// Virtual for calculated total with tax
expenseSchema.virtual('calculatedTotal').get(function() {
  if (this.totalAmount) return this.totalAmount;

  let total = this.amount;
  if (this.taxRate && this.taxRate > 0) {
    this.taxAmount = (this.amount * this.taxRate) / 100;
    total += this.taxAmount;
  }
  return total;
});

// Pre-save middleware to calculate totals
expenseSchema.pre('save', function(next) {
  // Calculate tax amount if tax rate is provided
  if (this.taxRate && this.taxRate > 0 && !this.taxAmount) {
    this.taxAmount = (this.amount * this.taxRate) / 100;
  }

  // Calculate total amount
  if (!this.totalAmount) {
    this.totalAmount = this.amount + (this.taxAmount || 0);
  }

  // Set billable amount to total if billable and not specified
  if (this.isBillable && !this.billableAmount) {
    this.billableAmount = this.totalAmount;
  }

  next();
});

// Static methods
expenseSchema.statics.findByDateRange = function(startDate, endDate, userId) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    },
    createdBy: userId
  })
  .populate('opportunity')
  .populate('company')
  .populate('contact')
  .sort({ date: -1 });
};

expenseSchema.statics.findByCategory = function(category, userId) {
  return this.find({
    category,
    createdBy: userId
  })
  .populate('opportunity')
  .sort({ date: -1 });
};

expenseSchema.statics.getExpenseSummary = async function(userId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        createdBy: mongoose.Types.ObjectId(userId),
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$totalAmount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$totalAmount' }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);
};

expenseSchema.statics.getMonthlyExpenses = async function(userId, year) {
  return await this.aggregate([
    {
      $match: {
        createdBy: mongoose.Types.ObjectId(userId),
        date: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalAmount: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

module.exports = mongoose.model('Expense', expenseSchema);