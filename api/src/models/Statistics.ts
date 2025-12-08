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
  tableName: "Statistics",
  timestamps: false,
  underscored: true,
})
class Statistics extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare responseRate: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare supervisingRate: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare knowledgeSize: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare taskCount: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare totalMessages: number;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare teamId: string;
}

export default Statistics;
