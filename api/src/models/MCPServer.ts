import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "@canmingir/link-express/sequelize";

@Table({
  tableName: "MCPServer",
  timestamps: false,
  underscored: true,
})
class MCPServer extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare mcpProviderId: string;
}

export default MCPServer;
