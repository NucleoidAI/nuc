const platform = require("@canmingir/link-express");
const {
  Postgres: { sequelize },
} = platform.module();
const { DataTypes, UUIDV4 } = platform.require("sequelize");

const Colleague = sequelize.define("Colleague", {
  id: {
    type: DataTypes.UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  character: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Project",
      key: "id",
    },
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  aiEngineId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});

module.exports = Colleague;
