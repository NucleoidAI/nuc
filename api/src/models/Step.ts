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
  tableName: "Step",
  timestamps: false,
  underscored: true,
})
class Step extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare action: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare parameters: any;

  @AllowNull(true)
  @Column(DataType.BLOB)
  declare result: Buffer | null;

  @AllowNull(true)
  @Column(DataType.STRING(100))
  declare comment: string | null;

  @AllowNull(false)
  @Default("IN_PROGRESS")
  @IsIn([["IN_PROGRESS", "SUPERVISED_NEEDED", "COMPLETED", "FAILED"]])
  @Column(DataType.STRING)
  declare status: "IN_PROGRESS" | "SUPERVISED_NEEDED" | "COMPLETED" | "FAILED";

  @AllowNull(false)
  @Column(DataType.UUID)
  declare taskId: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  declare task?: any;
}

export default Step;
