import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
} from "@canmingir/link-express/sequelize";

@Table({
  tableName: "TeamDetails",
  timestamps: false,
  underscored: true,
})
class TeamDetails extends Model {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare coach: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare coachAvatar: string;
}

export default TeamDetails;
