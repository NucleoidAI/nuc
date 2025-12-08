import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  AllowNull,
} from "@canmingir/link-express/sequelize";

import Node from "../schemas/Node";

@Table({
  tableName: "Responsibility",
  timestamps: false,
  underscored: true,
})
class Responsibility extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare description: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare colleagueId: string;

  @AllowNull(true)
  @Column({
    type: DataType.JSONB,
    validate: {
      isValidNodes(value: any) {
        if (value) {
          for (const node of value) {
            const validatedNode = Node.safeParse(node);

            if (!validatedNode.success) {
              throw new Error(validatedNode.error.message);
            }
          }
        }
      },
    },
  })
  declare nodes: any[] | null;

  declare colleague?: any;

  declare communications?: any[];
}

export default Responsibility;
