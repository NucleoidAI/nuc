import TaskTree from "./TaskTree";
import { useMemo } from "react";

const FlowDialog = ({
  open,
  setOpen,
  steps,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  steps: Array<{
    comment: string;
    createdAt: string;
    status: string;
    result: string | object | unknown[];
  }>;
}) => {
  const treeData = useMemo(() => {
    if (!steps || steps.length === 0) return null;

    const sortedSteps = [...steps].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const root = {
      ...sortedSteps[0],
      nodeId: `node-0`,
      children: [],
    };

    let currentNode = root;
    for (let i = 1; i < sortedSteps.length; i++) {
      const newNode = {
        ...sortedSteps[i],
        nodeId: `node-${i}`,
        children: [],
      };
      currentNode.children = [newNode];
      currentNode = newNode;
    }

    return root;
  }, [steps]);

  if (!treeData) return null;

  return <TaskTree open={open} setOpen={setOpen} treeData={treeData} />;
};

export default FlowDialog;
