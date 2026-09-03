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
  tableName: "MCPToolArg",
  timestamps: false,
  underscored: true,
})
class MCPToolArg extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare serverId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare tool: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare key: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare value: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare teamId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare agentId: string | null;
}

export default MCPToolArg;
