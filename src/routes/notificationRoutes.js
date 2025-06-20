const express = require('express');
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/notificationController');

const router = express.Router();
router.use(auth);

// GET /api/notifications
router.get('/notifications', ctrl.index);

// PATCH /api/notifications/:id/read
router.patch('/notifications/:id/read', ctrl.markAsRead);

// GET /api/notifications/:id
router.get('/notifications/:id', ctrl.detail);

// DELETE /api/notifications/delete/:id
router.delete('/notifications/delete/:id', ctrl.delete);

module.exports = router;
