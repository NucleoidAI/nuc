import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from "@canmingir/link-express/sequelize";

@Table({
  tableName: "BlueprintMessage",
  timestamps: false,
  underscored: true,
})
class BlueprintMessage extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare blueprintId: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare content: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare role: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: Date;
}

export default BlueprintMessage;
