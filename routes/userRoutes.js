const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  changePassword
} = require('../controllers/userController');

const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin only routes
router.route('/')
  .get(authorize('admin'), getUsers)
  .post(authorize('admin'), createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(authorize('admin'), deleteUser);

// Profile routes (current user)
router.route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

// Password change
router.put('/change-password', changePassword);

module.exports = router;