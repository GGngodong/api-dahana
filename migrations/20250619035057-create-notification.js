'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
      },
      type: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      notifiable_type: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      notifiable_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      }
    });

  
    await queryInterface.addIndex('notifications', ['notifiable_type', 'notifiable_id'], {
      name: 'notifications_notifiable_type_notifiable_id_index'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};
