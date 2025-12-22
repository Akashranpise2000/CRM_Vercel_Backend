const Expense = require('../models/Expense');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { category, start_date, end_date, opportunity_id } = req.query;

  let query = { createdBy: req.user.id };

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Filter by opportunity
  if (opportunity_id) {
    query.opportunity_id = opportunity_id;
  }

  // Filter by date range
  if (start_date || end_date) {
    query.date = {};
    if (start_date) query.date.$gte = new Date(start_date);
    if (end_date) query.date.$lte = new Date(end_date);
  }

  const expenses = await Expense.find(query)
    .populate('opportunity_id', 'title')
    .populate('company', 'name')
    .skip(skip)
    .limit(limit)
    .sort({ date: -1 });

  const total = await Expense.countDocuments(query);

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
  .populate('company', 'name');

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

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
<<<<<<< HEAD
  const expenseData = {
    ...req.body,
=======
  const { company_id, ...expenseFields } = req.body;

  const expenseData = {
    ...expenseFields,
    company: company_id,
>>>>>>> 52c36bae7ccd905b9092e37ff13c3ff68f315feb
    createdBy: req.user.id
  };

  const expense = await Expense.create(expenseData);

  await expense.populate('opportunity_id', 'title');
  await expense.populate('company', 'name');

  res.status(201).json({
    success: true,
    data: expense
  });
});

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
<<<<<<< HEAD
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    req.body,
=======
  const { company_id, ...updateFields } = req.body;

  const updateData = {
    ...updateFields,
    ...(company_id !== undefined && { company: company_id })
  };

  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    updateData,
>>>>>>> 52c36bae7ccd905b9092e37ff13c3ff68f315feb
    { new: true, runValidators: true }
  )
  .populate('opportunity_id', 'title')
  .populate('company', 'name');

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

  await expense.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get expenses by category
// @route   GET /api/expenses/category/:category
// @access  Private
const getExpensesByCategory = asyncHandler(async (req, res) => {
  const expenses = await Expense.findByCategory(req.params.category, req.user.id);

  res.status(200).json({
    success: true,
    data: expenses
  });
});

// @desc    Get expense summary
// @route   GET /api/expenses/summary
// @access  Private
const getExpenseSummary = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const startDate = start_date ? new Date(start_date) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = end_date ? new Date(end_date) : new Date();

  const summary = await Expense.getExpenseSummary(req.user.id, startDate, endDate);

  res.status(200).json({
    success: true,
    data: summary
  });
});

// @desc    Get monthly expense data
// @route   GET /api/expenses/monthly
// @access  Private
const getMonthlyExpenses = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();

  const monthlyData = await Expense.getMonthlyExpenses(req.user.id, year);

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