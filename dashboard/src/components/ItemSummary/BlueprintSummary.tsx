import React from "react";
import SummaryCard from "./SummaryCard";

import { Box, Chip, Stack, Typography } from "@mui/material";

const BlueprintSummary = ({ newItem, detailListSx }) => {
  return (
    <SummaryCard
      icon="mdi:sitemap-outline"
      label="Blueprints"
      size={{ xs: 12, md: 6 }}
    >
      <Stack
        spacing={1}
        sx={detailListSx}
        data-cy="item-summary-blueprint-area"
      >
        {newItem.blueprints?.map((blueprint) => (
          <Box
            key={blueprint.id}
            sx={{
              minWidth: 0,
              flexShrink: 0,
              border: "1px solid",
              borderRadius: 2,
              p: 1,
              borderColor: "divider",
            }}
          >
            <Chip
              size="small"
              variant="outlined"
              color="default"
              label={blueprint.title}
              sx={{ maxWidth: "100%" }}
            />
            {blueprint.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, wordBreak: "break-word" }}
              >
                {blueprint.description}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </SummaryCard>
  );
};

export default BlueprintSummary;
