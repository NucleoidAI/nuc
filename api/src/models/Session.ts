import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  IsIn,
} from "sequelize-typescript";

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
  declare colleagueId: string;

  declare colleague?: any;

  declare conversations?: any[];
}

export default Session;
