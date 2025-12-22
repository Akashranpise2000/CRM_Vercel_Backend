const express = require('express');
const {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  getUpcomingActivities,
  getOverdueActivities,
  getActivitiesByDateRange
} = require('../controllers/activityController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getActivities)
  .post(createActivity);

router.route('/:id')
  .get(getActivity)
  .put(updateActivity)
  .delete(deleteActivity);

// Special activity routes
router.get('/upcoming/list', getUpcomingActivities);
router.get('/overdue/list', getOverdueActivities);
router.get('/range/date', getActivitiesByDateRange);

module.exports = router;