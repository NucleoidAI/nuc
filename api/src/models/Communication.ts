import {
  AllowNull,
  Column,
  DataType,
  Default,
  IsIn,
  Model,
  PrimaryKey,
  Table,
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
  declare blueprintId: string;

  declare Blueprint?: any;
}

export default Communication;
