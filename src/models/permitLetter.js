// src/models/PermitLetter.js
const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

class PermitLetter extends Model {}

PermitLetter.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    uraian: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    no_surat: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    kategori_permit_letter: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sub_kategori_permit_letter: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status_tahapan: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    nama_pt: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tanggal: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    produk_no_surat_mabes: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    dokumen: {
      type: DataTypes.TEXT, // encrypted path may be longer
      allowNull: true,
    },
    released_dokumen: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    upload_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "PermitLetter",
    tableName: "permit_letters",
    underscored: true,
    timestamps: true,
  }
);

// Association: each PermitLetter belongs to one User
PermitLetter.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

module.exports = PermitLetter;
