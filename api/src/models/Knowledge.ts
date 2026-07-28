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
  tableName: "Knowledge",
  timestamps: false,
  underscored: true,
})
class Knowledge extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @IsIn([["URL", "TEXT", "QA", "TASK", "DATA"]])
  @Column(DataType.STRING)
  declare type: "URL" | "TEXT" | "QA" | "TASK" | "DATA";

  @AllowNull(true)
  @Column(DataType.STRING)
  declare question: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare answer: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare url: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare text: string | null;

  @AllowNull(true)
  @Column(DataType.BLOB)
  declare content: Buffer | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare taskId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare blueprintId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare organizationId: string | null;
  dat;
  @AllowNull(false)
  @Default("COMPLETED")
  @IsIn([["IN_PROGRESS", "COMPLETED"]])
  @Column(DataType.STRING)
  declare status: "IN_PROGRESS" | "COMPLETED";

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  declare task?: any;

  declare AgentKnowledge?: any;
}

export default Knowledge;
