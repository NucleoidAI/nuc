import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  AllowNull,
} from "@canmingir/link-express/sequelize";

@Table({
  tableName: "AIEngine",
  timestamps: false,
  underscored: true,
})
class AIEngine extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare vendor: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare avatar: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare description: string;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  declare price: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare model: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;
}

export default AIEngine;
