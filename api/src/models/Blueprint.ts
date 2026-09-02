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

export type BlueprintContext = {
  agent: { name?: string; description?: string };
  knowledge: { type?: string; question?: string; text?: string }[];
  referenceBlueprint: { id?: string; title?: string; nodeCount: number } | null;
  supervising: { question?: string; status?: string } | null;
  userRequest: string;
  capturedAt: string;
};

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

  @AllowNull(true)
  @Column(DataType.JSONB)
  declare context: BlueprintContext | null;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare agentId: string;

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare blocking: boolean;

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
