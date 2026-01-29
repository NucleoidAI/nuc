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
  tableName: "TeamMessage",
  timestamps: false,
  underscored: true,
})
class TeamMessage extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @IsIn([["SYSTEM", "USER", "ASSISTANT"]])
  @Column(DataType.STRING)
  declare role: "SYSTEM" | "USER" | "ASSISTANT";

  @AllowNull(true)
  @Column(DataType.UUID)
  declare agentId: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(1000))
  declare content: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare userId: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare command: string | null;

  @AllowNull(true)
  @IsIn([["RECEIVED", "READ"]])
  @Column(DataType.STRING)
  declare status: "RECEIVED" | "READ" | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare knowledgeId: string | null;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare teamId: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare replyTo: string | null;

  declare colleague?: any;

  declare knowledge?: any;

  declare replyToMessage?: any;
}

export default TeamMessage;
