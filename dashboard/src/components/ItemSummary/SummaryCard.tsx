import { Iconify } from "@canmingir/link/platform/components";
import React from "react";

import {
  Card,
  CardContent,
  Grid,
  GridProps,
  Stack,
  Typography,
} from "@mui/material";

const SummaryCard = ({
  icon,
  label,
  size = { xs: 12, md: 6 },
  children,
}: {
  icon: string;
  label: string;
  size?: GridProps["size"];
  children: React.ReactNode;
}) => {
  return (
    <Grid size={size}>
      <Card
        sx={{
          position: "relative",
          overflow: "hidden",
          height: "100%",
          borderRadius: 2,
          bgcolor: "background.paper",
          boxShadow: (theme) => theme.customShadows?.card,
        }}
      >
        <CardContent sx={{ position: "relative" }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <Iconify icon={icon} width={18} style={{ flexShrink: 0 }} />
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ lineHeight: 1 }}
            >
              {label}
            </Typography>
          </Stack>

          {children}
        </CardContent>
      </Card>
    </Grid>
  );
};

export default SummaryCard;
