import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  IsIn,
} from "@canmingir/link-express/sequelize";

@Table({
  tableName: "Session",
  timestamps: false,
  underscored: true,
})
class Session extends Model {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @IsIn([["CHAT", "EMAIL"]])
  @Column(DataType.STRING)
  declare type: "CHAT" | "EMAIL";

  @AllowNull(false)
  @Column(DataType.UUID)
  declare agentId: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare blueprintId: string | null;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare variables: Record<string, unknown> | null;

  declare agent?: any;

  declare conversations?: any[];
}

export default Session;
