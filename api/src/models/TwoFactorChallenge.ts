import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
} from "@canmingir/link-express/sequelize";

@Table({
  tableName: "TwoFactorChallenge",
  timestamps: false,
  underscored: true,
})
class TwoFactorChallenge extends Model {
  @PrimaryKey
  @Column(DataType.UUID)
  declare stepId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare tokenHash: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare expiresAt: Date;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare consumed: boolean;
}
export default TwoFactorChallenge;
