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
  tableName: "LLMLog",
  timestamps: false,
  underscored: true,
})
class LLMLog extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare provider: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare model: string | null;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare messages: unknown;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare response: unknown;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare inputTokens: number | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare outputTokens: number | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare totalTokens: number | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare cost: number | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare durationMs: number | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare error: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare source: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare agentId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare sessionId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare taskId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare teamId: string | null;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;
}

export default LLMLog;
