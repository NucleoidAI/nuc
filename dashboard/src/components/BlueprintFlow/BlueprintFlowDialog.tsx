import BlueprintFlowWidget from "../../widgets/BlueprintFlowWidget/BlueprintFlowWidget";
import { DrawerLayout } from "@canmingir/link/layouts";
import { FlowDefinition } from "./helper";
import React from "react";

interface AIResponse {
  flow: FlowDefinition;
}

interface Blueprint {
  id: string;
  title: string;
  description: string;
  agentId: string;
}

interface BlueprintFlowDialogProps {
  flowDialogOpen: boolean;
  handleFlowDialogClose: () => void;
  selectedItem: Blueprint;
  aiResponse?: AIResponse;
  setAiResponse?: (response: AIResponse | null) => void;
  taskId?: string;
}

const BlueprintFlowDialog = ({
  flowDialogOpen,
  handleFlowDialogClose,
  selectedItem,
  aiResponse,
  setAiResponse,
  taskId,
}: BlueprintFlowDialogProps) => {
  return (
    <DrawerLayout
      open={flowDialogOpen}
      onClose={handleFlowDialogClose}
      mode="fullscreen"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
    >
      {selectedItem && (
        <BlueprintFlowWidget
          aiResponse={aiResponse}
          setAiResponse={setAiResponse}
          blueprint={selectedItem}
          taskId={taskId}
          readOnly={true}
        />
      )}
    </DrawerLayout>
  );
};

export default BlueprintFlowDialog;
