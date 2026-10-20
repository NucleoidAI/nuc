import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from "@canmingir/link-express/sequelize";

@Table({
  tableName: "LogicRule",
  timestamps: false,
  underscored: true,
})
class LogicRule extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare blueprintId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description: string | null;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare code: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;
}

export default LogicRule;
