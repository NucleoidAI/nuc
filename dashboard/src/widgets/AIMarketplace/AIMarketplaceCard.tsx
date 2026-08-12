import AIEngineChart from "./Content";
import React from "react";
import useAIEngines from "../../hooks/useAIEngines";

import { Box, Dialog, DialogContent } from "@mui/material";

function AIMarketplaceCard({
  open,
  setOpen,
  isWizardEngine,
  handleEngineSelect,
  selectedEngineId,
}) {
  const { engines } = useAIEngines();

  const Content = () => {
    return (
      <DialogContent sx={{ marginY: 1 }}>
        <AIEngineChart
          handleEngineSelect={handleEngineSelect}
          isWizardEngine={isWizardEngine}
          selectedEngineId={selectedEngineId}
          data={engines}
        />
      </DialogContent>
    );
  };

  return (
    <>
      {isWizardEngine ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {Content()}
        </Box>
      ) : (
        <Dialog maxWidth={"xl"} open={open} onClose={() => setOpen(false)}>
          {Content()}
        </Dialog>
      )}
    </>
  );
}

export default AIMarketplaceCard;
