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

export interface ColleagueAttributes {
  id: string;
  name: string;
  icon: string;
  aiEngineId: string;
  teamId: string;
}

@Table({
  tableName: "Colleague",
  timestamps: false,
  underscored: true,
})
class Colleague extends Model<ColleagueAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
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

export default Colleague;
