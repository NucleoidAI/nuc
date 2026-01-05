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
  tableName: "MCP",
  timestamps: false,
  underscored: true,
})
class MCP extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare mcpId: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare refreshToken: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare colleagueId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare teamId: string | null;

  declare colleague?: any;
}

export default MCP;
