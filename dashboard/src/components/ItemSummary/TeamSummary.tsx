import DialogContentText from "@mui/material/DialogContentText";
import Grid from "@mui/material/Grid";
import { Iconify } from "@canmingir/link/platform/components";
import { cleanIconName } from "../../utils/cleanIconName";

import { Box, Card, CardContent, Typography } from "@mui/material";

function Summary({ organization, team, agent }) {
  return (
    <>
      {organization && (
        <>
          <DialogContentText sx={{ textAlign: "center", mb: 2 }}>
            Organization
          </DialogContentText>
          <Card
            sx={{
              bgcolor: (theme) => theme.palette.background.paper,
              boxShadow: (theme) => theme.customShadows.card,
              mb: 3,
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                textAlign="center"
                data-cy="org-summary-name-area"
              >
                {organization.name}
              </Typography>
            </CardContent>
          </Card>
        </>
      )}
      <DialogContentText sx={{ textAlign: "center", mb: 2 }}>
        Team
      </DialogContentText>
      <Grid container spacing={2}>
        <Grid
          sx={{
            justifyContent: "center",
            alignContent: "center",
            display: "flex",
          }}
          size={12}
        >
          <Card
            sx={{
              bgcolor: (theme) => theme.palette.background.paper,
              boxShadow: (theme) => theme.customShadows.card,
              width: "100%",
            }}
          >
            <CardContent>
              <Grid container alignItems="center" spacing={2}>
                <Grid size={4}>
                  <Box
                    sx={{
                      mx: "auto",
                      width: { xs: 32, md: 64 },
                      height: { xs: 32, md: 64 },
                      borderRadius: "50%",

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <Iconify
                      icon={cleanIconName(team.icon)}
                      width="70%"
                      height="70%"
                      style={{ objectFit: "contain" }}
                    />
                  </Box>
                </Grid>
                <Grid size={8}>
                  <Typography variant="h6" data-cy="team-summary-name-area">
                    {team.name}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {agent && (
        <>
          <DialogContentText sx={{ textAlign: "center", mb: 2, mt: 3 }}>
            Agent
          </DialogContentText>
          <Grid container spacing={2}>
            <Grid
              sx={{
                justifyContent: "center",
                alignContent: "center",
                display: "flex",
              }}
              size={12}
            >
              <Card
                sx={{
                  bgcolor: (theme) => theme.palette.background.paper,
                  boxShadow: (theme) => theme.customShadows.card,
                  width: "100%",
                }}
              >
                <CardContent>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid size={4}>
                      <Box
                        sx={{
                          mx: "auto",
                          width: { xs: 32, md: 64 },
                          height: { xs: 32, md: 64 },
                          borderRadius: "50%",

                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        <Iconify
                          icon={cleanIconName(agent.icon)}
                          width="70%"
                          height="70%"
                          style={{ objectFit: "contain" }}
                        />
                      </Box>
                    </Grid>
                    <Grid size={8}>
                      <Typography
                        variant="h6"
                        data-cy="agent-summary-name-area"
                      >
                        {agent.name}
                      </Typography>
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Description: {agent.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Engine: {agent.engineName}
                        </Typography>
                      </>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </>
  );
}
export { Summary };
