import {
  AllowNull,
  Column,
  DataType,
  Default,
  IsIn,
  Model,
  PrimaryKey,
  Table,
} from "@canmingir/link-express/sequelize";

@Table({
  tableName: "Supervising",
  timestamps: false,
  underscored: true,
})
class Supervising extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare sessionId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare conversationId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare blueprintId: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare taskId: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare stepId: string;

  @AllowNull(false)
  @Column(DataType.STRING(1000))
  declare question: string;

  @AllowNull(true)
  @Column(DataType.STRING(1000))
  declare answer: string | null;

  @AllowNull(false)
  @Default("IN_PROGRESS")
  @IsIn([["IN_PROGRESS", "ANSWERED"]])
  @Column(DataType.STRING)
  declare status: "IN_PROGRESS" | "ANSWERED";

  @AllowNull(false)
  @Column(DataType.UUID)
  declare agentId: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  declare session?: any;

  declare conversation?: any;

  declare Agent?: any;

  declare blueprint?: any;
}

export default Supervising;
