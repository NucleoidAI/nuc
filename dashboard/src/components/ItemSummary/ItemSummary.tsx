import DialogContentText from "@mui/material/DialogContentText";
import Grid from "@mui/material/Grid";
import { Iconify } from "@canmingir/link/platform/components";
import { cleanIconName } from "../../utils/cleanIconName";

import { Box, Card, CardContent, CardHeader, Typography } from "@mui/material";

export default function ItemSummary({ newItem }) {
  return (
    <>
      <DialogContentText sx={{ textAlign: "center", mb: 2 }}>
        Agent Summary
      </DialogContentText>
      <Grid container spacing={2} alignItems="stretch">
        <Grid size={6}>
          <Card
            sx={{
              bgcolor: (theme) => theme.palette.background.paper,
              boxShadow: (theme) => theme.customShadows.card,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <Iconify
                  icon={cleanIconName(newItem.icon)}
                  width={48}
                  height={48}
                  style={{ objectFit: "contain" }}
                />
              </Box>
              <Typography
                variant="h6"
                textAlign={"center"}
                mb={2}
                data-cy="item-summary-name-area"
              >
                {newItem.name}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={6}>
          <Card sx={{ height: "100%" }}>
            <CardHeader title="Engine" />
            <CardContent>
              <Typography data-cy="item-summary-role-area">
                {newItem.engineName}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardHeader title="Description" />
            <CardContent>
              <Typography data-cy="item-summary-description-area">
                {newItem.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
