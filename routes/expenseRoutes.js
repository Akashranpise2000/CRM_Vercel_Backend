const express = require('express');
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByCategory,
  getExpenseSummary,
  getMonthlyExpenses
} = require('../controllers/expenseController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense);

// Category-based routes
router.get('/category/:category', getExpensesByCategory);

// Analytics routes
router.get('/analytics/summary', getExpenseSummary);
router.get('/analytics/monthly', getMonthlyExpenses);

module.exports = router;