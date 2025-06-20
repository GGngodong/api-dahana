const admin = require('firebase-admin');
const { Notification, User } = require('../models');

/**
 * Create a database notification and send an FCM message.
 * @param {object} opts
 * @param {string} opts.notifiableType  e.g. 'User'
 * @param {number|string} opts.notifiableId
 * @param {string} opts.type           e.g. 'admin_permit_letter'
 * @param {object} opts.data           payload stored in `data` column
 * @param {{ title: string, body: string }} opts.fcmNotif
 */
async function createAndSend({ notifiableType, notifiableId, type, data, fcmNotif }) {
  // 1) Write to DB
  const notification = await Notification.create({
    id:           require('uuid').v4(),
    notifiable_type: notifiableType,
    notifiable_id:   notifiableId,
    type,
    data:         JSON.stringify(data),
  });

  // 2) Send FCM if the user has an FCM token
  const user = await User.findByPk(notifiableId);
  if (user && user.deviceToken) {
    await admin.messaging().send({
      token: user.deviceToken,
      data:  { ...data, type },
      notification: {
        title: fcmNotif.title,
        body:  fcmNotif.body,
      }
    });
  }

  return notification;
}

module.exports = { createAndSend };
