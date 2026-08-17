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
            spacing={1}
            alignItems="center"
            textAlign={{ xs: "center", sm: "left" }}
          >
            <Avatar
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                color: "inherit",
                bgcolor: "background.neutral",
              }}
            >
              <AIEngineIcon
                vendor={newItem.engineName}
                width={32}
                height={32}
              />
            </Avatar>

            <Box>
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
