import DialogContentText from "@mui/material/DialogContentText";
import Grid from "@mui/material/Grid";
import { Iconify } from "@canmingir/link/platform/components";
import { cleanIconName } from "../../utils/cleanIconName";

import { Box, Card, CardContent, CardHeader, Typography } from "@mui/material";

export default function ItemSummary({ newItem }) {
  return (
    <>
      <DialogContentText sx={{ textAlign: "center", mb: 2 }}>
        Colleague Summary
      </DialogContentText>
      <Grid container spacing={2}>
        <Grid
          item
          xs={6}
          sx={{
            justifyContent: "center",
            alignContent: "center",
            display: "flex",
          }}
        >
          <Card
            sx={{
              bgcolor: (theme) => theme.palette.background.paper,
              boxShadow: (theme) => theme.customShadows.card,
              alignContent: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <CardContent
              children={
                <>
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
                      width="30%"
                      height="30%"
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
                </>
              }
            />
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardHeader title="Engine" />
            <CardContent>
              <Typography data-cy="item-summary-role-area">
                {newItem.engineName}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={8}>
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
