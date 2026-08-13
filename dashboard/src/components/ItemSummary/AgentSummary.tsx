import { Iconify } from "@canmingir/link/platform/components";
import React from "react";
import SummaryCard from "./SummaryCard";
import { cleanIconName } from "../../utils/cleanIconName";

import { Avatar, Box, Divider, Stack, Typography } from "@mui/material";

const AgentSummary = ({ newItem, team }) => {
  return (
    <SummaryCard icon="mdi:text-box-outline" label="Name">
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
          <Iconify
            icon={cleanIconName(newItem.icon)}
            width={40}
            height={40}
            style={{ objectFit: "contain" }}
          />
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h5"
            sx={{ wordBreak: "break-word" }}
            data-cy="item-summary-name-area"
          >
            {newItem.name}
          </Typography>
          {team?.name && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ wordBreak: "break-word" }}
              data-cy="item-summary-team-area"
            >
              {team.name}
            </Typography>
          )}
        </Box>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" spacing={1} alignItems="center" mt={1}>
        <Iconify
          icon="mdi:text-box-outline"
          width={18}
          style={{ flexShrink: 0 }}
        />
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ lineHeight: 1 }}
        >
          Description
        </Typography>
      </Stack>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ whiteSpace: "pre-line", wordBreak: "break-word", mt: 1 }}
        data-cy="item-summary-description-area"
      >
        {newItem.description}
      </Typography>
    </SummaryCard>
  );
};

export default AgentSummary;
