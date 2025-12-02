import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import AIEngine from "./AIEngine";
import { Project } from "@canmingir/link-express/models";

@Table({
  tableName: "Colleague",
  timestamps: false,
  underscored: true,
})
class Colleague extends Model {
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

  @BelongsTo(() => AIEngine)
  declare AIEngine: AIEngine;

  @ForeignKey(() => Project)
  @Column(DataType.UUID)
  declare teamId: string;

  @BelongsTo(() => Project)
  declare project: Project;
}

export default Colleague;
