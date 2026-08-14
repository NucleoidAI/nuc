import AIEngineChart from "./Content";
import React from "react";
import useAIEngines from "../../hooks/useAIEngines";

import {
  Box,
  Dialog,
  DialogContent,
  TextField,
  Typography,
} from "@mui/material";

function AIMarketplaceCard({
  open,
  setOpen,
  isWizardEngine,
  handleEngineSelect,
  selectedEngineId = "",
}) {
  const { engines: fetchedEngines } = useAIEngines();
  const [search, setSearch] = React.useState("");

  const filteredEngines = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return fetchedEngines;
    }

    return fetchedEngines?.filter((engine) =>
      [engine?.vendor, engine?.model, engine?.description]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    );
  }, [fetchedEngines, search]);

  const Content = () => {
    return (
      <DialogContent
        sx={{ marginY: 1, gap: 1, display: "flex", flexDirection: "column" }}
      >
        <TextField
          sx={{ marginTop: 1 }}
          label="Search Engines"
          fullWidth
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Box
          sx={{
            ...(isWizardEngine && {
              height: 200,
              overflowY: "auto",
              pr: 0.5,
            }),
          }}
        >
          {filteredEngines?.length ? (
            <AIEngineChart
              handleEngineSelect={handleEngineSelect}
              isWizardEngine={isWizardEngine}
              selectedEngineId={selectedEngineId}
              data={filteredEngines}
            />
          ) : (
            <Typography
              sx={{ paddingY: 4, textAlign: "center" }}
              color="text.secondary"
            >
              No engines match your search.
            </Typography>
          )}
        </Box>
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
            alignItems: "stretch",
            justifyContent: "flex-start",
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
