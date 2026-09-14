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
  agent?: { name?: string | null; description?: string | null };
  knowledge?: {
    type?: string | null;
    question?: string | null;
    text?: string | null;
  }[];
  referenceBlueprint?: {
    id?: string | null;
    title?: string | null;
    nodeCount: number;
  } | null;
  supervising?: { question?: string | null; status?: string | null } | null;
  userRequest?: string | null;
  capturedAt?: string | null;
  [key: string]: unknown;
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

  @Default("NORMAL")
  @AllowNull(false)
  @Column(DataType.STRING)
  declare executionMode: "NORMAL" | "LITE";

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
