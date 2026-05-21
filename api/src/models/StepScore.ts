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
  tableName: "StepScore",
  timestamps: false,
  underscored: true,
})
class StepScore extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare taskId: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare stepId: string | null;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare parameters: object | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare output: string | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare hallucinationScore: number | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare superviseScore: number | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare resultScore: number | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare knowledgeScore: number | null;

  @AllowNull(false)
  @IsIn([["COMPLETED", "FAILED", "SUPERVISED"]])
  @Column(DataType.STRING)
  declare status: "COMPLETED" | "FAILED" | "SUPERVISED";

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  declare task?: any;

  declare step?: any;
}

export default StepScore;
