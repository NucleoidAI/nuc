import {
  AllowNull,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "@canmingir/link-express/sequelize";

import AIEngine from "./AIEngine";

export interface AgentAttributes {
  id: string;
  name: string;
  icon: string;
  aiEngineId: string;
  teamId: string;
  description: string;
}

@Table({
  tableName: "Agent",
  timestamps: false,
  underscored: true,
})
class Agent extends Model<AgentAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare description: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare icon: string;

  @ForeignKey(() => AIEngine)
  @Column(DataType.UUID)
  declare aiEngineId: string;

  @Column(DataType.UUID)
  declare teamId: string;
}

export default Agent;
