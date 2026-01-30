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
  tableName: "AgentKnowledge",
  timestamps: false,
  underscored: true,
})
class AgentKnowledge extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare knowledgeId: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare organizationId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare agentId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare teamId: string | null;

  declare agent?: any;

  declare knowledge?: any;
}

export default AgentKnowledge;
