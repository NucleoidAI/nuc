import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  AllowNull,
  ForeignKey,
} from "@canmingir/link-express/sequelize";

import AIEngine from "./AIEngine";

export interface ColleagueAttributes {
  id: string;
  name: string;
  avatar: string;
  character: string;
  title: string;
  role: string;
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
  declare avatar: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare character: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare role: string;

  @ForeignKey(() => AIEngine)
  @Column(DataType.UUID)
  declare aiEngineId: string;

  @Column(DataType.UUID)
  declare teamId: string;
}

export default Colleague;
