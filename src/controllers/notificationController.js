const { Op } = require('sequelize');
const { Notification } = require('../models');
const { createAndSend } = require('../services/notificationService');

exports.index = async (req, res) => {
  const userId = req.user.id;

  // 1) Fetch all notifications for this user, newest first
  const notifications = await Notification.findAll({
    where: {
      notifiable_type: 'User',
      notifiable_id:   userId
    },
    order: [['created_at','DESC']]
  });

  // 2) Count unread
  const unreadCount = await Notification.count({
    where: {
      notifiable_type: 'User',
      notifiable_id:   userId,
      read_at:         { [Op.is]: null }
    }
  });

  return res.json({
    status: 'success',
    data: {
      notifications,
      unread_count: unreadCount
    }
  });
};

exports.markAsRead = async (req, res) => {
  const userId = req.user.id;
  const id     = req.params.id;

  await Notification.update(
    { read_at: new Date() },
    {
      where: {
        id,
        notifiable_type: 'User',
        notifiable_id:   userId
      }
    }
  );

  return res.json({ status: 'success' });
};

exports.detail = async (req, res) => {
  const userId = req.user.id;
  const id     = req.params.id;

  const notif = await Notification.findOne({
    where: {
      id,
      notifiable_type: 'User',
      notifiable_id:   userId
    }
  });
  if (!notif) {
    return res.status(404).json({
      status: 'error',
      message: 'Notification not found'
    });
  }

  return res.json({
    status: 'success',
    data:   notif
  });
};

exports.delete = async (req, res) => {
  const userId = req.user.id;
  const id     = req.params.id;

  const result = await Notification.destroy({
    where: {
      id,
      notifiable_type: 'User',
      notifiable_id:   userId
    }
  });
  if (!result) {
    return res.status(404).json({
      status: 'error',
      message: 'Notification not found'
    });
  }

  return res.json({
    status: 'success',
    message: 'Notification deleted successfully'
  });
};
