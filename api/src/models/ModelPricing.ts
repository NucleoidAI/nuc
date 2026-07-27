import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  AllowNull,
} from "@canmingir/link-express/sequelize";

@Table({
  tableName: "ModelPricing",
  timestamps: false,
  underscored: true,
  indexes: [{ unique: true, fields: ["provider", "model"] }],
})
class ModelPricing extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare provider: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare model: string;

  // USD per 1M prompt tokens
  @AllowNull(false)
  @Column(DataType.FLOAT)
  declare inputPricePerMillion: number;

  // USD per 1M completion tokens
  @AllowNull(false)
  @Column(DataType.FLOAT)
  declare outputPricePerMillion: number;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;
}

export default ModelPricing;
