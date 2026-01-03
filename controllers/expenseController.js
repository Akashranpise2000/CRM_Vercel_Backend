const Expense = require('../models/Expense');
const Settings = require('../models/Settings');
const smsService = require('../services/smsService');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all expenses for the authenticated user
// @route   GET /api/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const expenses = await Expense.find({ createdBy: req.user.id })
    .populate('opportunity_id', 'title')
    .populate('company', 'name')
    .populate('contact', 'name')
    .skip(skip)
    .limit(limit)
    .sort({ date: -1 });

  const total = await Expense.countDocuments({ createdBy: req.user.id });

  res.status(200).json({
    success: true,
    data: expenses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  })
  .populate('opportunity_id', 'title')
  .populate('company', 'name')
  .populate('contact', 'name')
  .populate('approvedBy', 'name');

  if (!expense) {
    return res.status(404).json({
      success: false,
      error: 'Expense not found'
    });
  }

  res.status(200).json({
    success: true,
    data: expense
  });
});

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
  const expenseData = {
    ...req.body,
    createdBy: req.user.id
  };

  const expense = await Expense.create(expenseData);

  await expense.populate('opportunity_id', 'title');
  await expense.populate('company', 'name');
  await expense.populate('contact', 'name');

  // Send SMS notification if enabled
  try {
    const settings = await Settings.findOne({ createdBy: req.user.id });

    if (settings?.smsSettings?.enabled &&
        settings.smsSettings.twilioAccountSid &&
        settings.smsSettings.twilioAuthToken &&
        settings.smsSettings.twilioPhoneNumber &&
        settings.smsSettings.recipientPhoneNumber) {

      // Initialize SMS service with user settings
      const initialized = smsService.initialize(
        settings.smsSettings.twilioAccountSid,
        settings.smsSettings.twilioAuthToken,
        settings.smsSettings.twilioPhoneNumber
      );

      if (initialized) {
        // Send SMS notification (non-blocking)
        const smsResult = await smsService.sendExpenseNotification(
          settings.smsSettings.recipientPhoneNumber,
          {
            title: expense.title,
            amount: expense.amount,
            category: expense.category
          }
        );

        console.log('SMS notification result:', smsResult);
      }
    }
  } catch (smsError) {
    // Log SMS error but don't fail the expense creation
    console.error('SMS notification failed:', smsError);
  }

  res.status(201).json({
    success: true,
    data: expense
  });
});

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!expense) {
    return res.status(404).json({
      success: false,
      error: 'Expense not found'
    });
  }

  // Update fields
  Object.keys(req.body).forEach(key => {
    if (req.body[key] !== undefined) {
      expense[key] = req.body[key];
    }
  });

  await expense.save();

  await expense.populate('opportunity_id', 'title');
  await expense.populate('company', 'name');
  await expense.populate('contact', 'name');
  await expense.populate('approvedBy', 'name');

  res.status(200).json({
    success: true,
    data: expense
  });
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

  if (!expense) {
    return res.status(404).json({
      success: false,
      error: 'Expense not found'
    });
  }

  await Expense.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get expenses by category
// @route   GET /api/expenses/category/:category
// @access  Private
const getExpensesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const expenses = await Expense.find({
    category,
    createdBy: req.user.id
  })
  .populate('opportunity_id', 'title')
  .populate('company', 'name')
  .populate('contact', 'name')
  .skip(skip)
  .limit(limit)
  .sort({ date: -1 });

  const total = await Expense.countDocuments({
    category,
    createdBy: req.user.id
  });

  res.status(200).json({
    success: true,
    data: expenses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get expense summary by category
// @route   GET /api/expenses/analytics/summary
// @access  Private
const getExpenseSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Please provide startDate and endDate query parameters'
    });
  }

  const summary = await Expense.getExpenseSummary(
    req.user.id,
    new Date(startDate),
    new Date(endDate)
  );

  res.status(200).json({
    success: true,
    data: summary
  });
});

// @desc    Get monthly expenses
// @route   GET /api/expenses/analytics/monthly
// @access  Private
const getMonthlyExpenses = asyncHandler(async (req, res) => {
  const { year } = req.query;

  if (!year) {
    return res.status(400).json({
      success: false,
      error: 'Please provide year query parameter'
    });
  }

  const monthlyData = await Expense.getMonthlyExpenses(req.user.id, parseInt(year));

  res.status(200).json({
    success: true,
    data: monthlyData
  });
});

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByCategory,
  getExpenseSummary,
  getMonthlyExpenses
};