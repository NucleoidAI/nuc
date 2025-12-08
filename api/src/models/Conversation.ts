import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  AllowNull,
  IsIn,
} from "@canmingir/link-express/sequelize";

@Table({
  tableName: "Conversation",
  timestamps: false,
  underscored: true,
})
class Conversation extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @IsIn([["ASSISTANT", "USER"]])
  @Column(DataType.STRING)
  declare role: "ASSISTANT" | "USER";

  @AllowNull(true)
  @Column(DataType.STRING(1000))
  declare content: string | null;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare sessionId: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  declare session?: any;
}

export default Conversation;
