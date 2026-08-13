import AIEngineIcon from "../../widgets/AIMarketplace/AIEngineIcon";
import AIMarketplaceItem from "../../widgets/AIMarketplace/AIMarketplaceItem";
import React from "react";
import SummaryCard from "./SummaryCard";

import { Avatar, Box, Stack, Typography } from "@mui/material";

const EngineSummary = ({ newItem }) => {
  return (
    <SummaryCard icon="mdi:text-box-outline" label="AI Engine">
      <Box data-cy="item-summary-engine-area">
        {newItem.engine ? (
          <AIMarketplaceItem engine={newItem.engine} />
        ) : (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2.5}
            alignItems="center"
            textAlign={{ xs: "center", sm: "left" }}
          >
            <Avatar
              sx={{
                width: 72,
                height: 72,
                flexShrink: 0,
                color: "inherit",
                bgcolor: "background.neutral",
              }}
            >
              <AIEngineIcon
                vendor={newItem.engineName}
                width={40}
                height={40}
              />
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" sx={{ wordBreak: "break-word" }}>
                {newItem.engineName}
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>
    </SummaryCard>
  );
};

export default EngineSummary;
