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
  tableName: "MCPServerAssignment",
  timestamps: false,
  underscored: true,
})
class MCPServerAssignment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare serverId: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare teamId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare agentId: string | null;
}

export default MCPServerAssignment;
