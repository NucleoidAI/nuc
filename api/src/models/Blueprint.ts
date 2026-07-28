import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from "@canmingir/link-express/sequelize";

import Node from "../schemas/Node";

@Table({
  tableName: "Blueprint",
  timestamps: false,
  underscored: true,
})
class Blueprint extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare description: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare skill: string | null;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare agentId: string;

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare blocking: boolean;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare force: boolean;

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

  declare agent?: any;

  declare communications?: any[];
}

export default Blueprint;
