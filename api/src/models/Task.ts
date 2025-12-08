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
  tableName: "Task",
  timestamps: false,
  underscored: true,
})
class Task extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare description: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare result: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare comment: string | null;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(true)
  @Default("IN_PROGRESS")
  @IsIn([["IN_PROGRESS", "COMPLETED", "FAILED"]])
  @Column(DataType.STRING)
  declare status: "IN_PROGRESS" | "COMPLETED" | "FAILED";

  @AllowNull(true)
  @Column(DataType.UUID)
  declare colleagueId: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare responsibilityId: string | null;

  declare colleague?: any;

  declare responsibility?: any;
}

export default Task;
