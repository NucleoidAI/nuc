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
  tableName: "TaskBluePrint",
  timestamps: false,
  underscored: true,
})
class TaskBluePrint extends Model {
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

export default TaskBluePrint;
