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
  tableName: "Command",
  timestamps: false,
  underscored: true,
})
class Command extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @IsIn([["KNOWLEDGE", "TASK", "SUPERVISING"]])
  @Column(DataType.STRING)
  declare type: "KNOWLEDGE" | "TASK" | "SUPERVISING";

  @AllowNull(true)
  @Column(DataType.UUID)
  declare referenceId: string | null;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare teamId: string | null;
}

export default Command;
