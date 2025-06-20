"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("permit_letters", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      uraian: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      no_surat: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: "no_surat_permit_letter_unique",
      },
      tanggal: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      kategori_permit_letter: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      sub_kategori_permit_letter: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      status_tahapan: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      note: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      upload_status: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      nama_pt: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      produk_no_surat_mabes: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: "produk_no_surat_mabes_unique",
      },
      dokumen: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      released_dokumen: {
        type: Sequelize.STRING(225),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('permit_letters');
  },
};
