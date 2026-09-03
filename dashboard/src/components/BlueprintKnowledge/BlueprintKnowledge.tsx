import CloseIcon from "@mui/icons-material/Close";
import Knowledge from "../../widgets/Knowledge/Knowledge";
import React from "react";

import {
  GlassCard,
  GlassCardContent,
} from "@canmingir/link/platform/components";
import { IconButton, Tooltip } from "@mui/material";

const BlueprintKnowledge = ({
  setShowKnowledge,
  selectedItem,
  agentId,
  teamId,
  onItemAdded,
}) => {
  return (
    <GlassCard
      sx={{
        mt: -0.5,
        height: "85vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <GlassCardContent>
        <Tooltip title="Close" placement="right">
          <IconButton
            size="small"
            onClick={() => setShowKnowledge(false)}
            sx={{ position: "absolute", top: 8, right: 8, zIndex: 99 }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
        <Knowledge
          agentId={selectedItem?.agentId || agentId}
          blueprintId={selectedItem?.id}
          teamId={teamId}
          onItemAdded={onItemAdded}
        />
      </GlassCardContent>
    </GlassCard>
  );
};

export default BlueprintKnowledge;
