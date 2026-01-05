import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  AllowNull,
  IsIn,
} from "@canmingir/link-express/sequelize";

@Table({
  tableName: "Communication",
  timestamps: false,
  underscored: true,
})
class Communication extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @IsIn([["WHATSAPP", "SLACK", "EMAIL"]])
  @Column(DataType.STRING)
  declare channelType: "WHATSAPP" | "SLACK" | "EMAIL";

  @AllowNull(false)
  @Column(DataType.STRING)
  declare channelCode: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare taskBluePrintId: string;

  declare taskBluePrint?: any;
}

export default Communication;
