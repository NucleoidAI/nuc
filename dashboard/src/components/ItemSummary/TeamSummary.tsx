import DialogContentText from "@mui/material/DialogContentText";
import Grid from "@mui/material/Grid";
import { Iconify } from "@canmingir/link/platform/components";
import { cleanIconName } from "../../utils/cleanIconName";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

function HeroCard({ icon, name, children, nameDataCy }) {
  return (
    <Card
      sx={{
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: (theme) => theme.customShadows?.card,
      }}
    >
      <CardContent>
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
              icon={cleanIconName(icon)}
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
            />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{ wordBreak: "break-word" }}
              data-cy={nameDataCy}
            >
              {name}
            </Typography>
            {children}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SectionCard({ icon, label, children }) {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: (theme) => theme.customShadows?.card,
      }}
    >
      <CardContent>
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
  );
}

function Summary({ organization, team, agent }) {
  return (
    <>
      <DialogContentText sx={{ textAlign: "center", mb: 2 }}>
        Team Summary
      </DialogContentText>

      <Grid container spacing={2} alignItems="stretch">
        {organization && (
          <Grid size={12}>
            <SectionCard
              icon="mdi:office-building-outline"
              label="Organization"
            >
              <Typography
                variant="h5"
                color="text.primary"
                sx={{ wordBreak: "break-word" }}
                data-cy="org-summary-name-area"
              >
                {organization.name}
              </Typography>
            </SectionCard>
          </Grid>
        )}

        <Grid size={12}>
          <HeroCard
            icon={team.icon}
            name={team.name}
            nameDataCy="team-summary-name-area"
          >
            <Chip
              size="small"
              variant="outlined"
              color="default"
              icon={<Iconify icon="mdi:account-group-outline" width={16} />}
              label="Team"
              sx={{ mt: 1 }}
            />
          </HeroCard>
        </Grid>

        {agent && (
          <>
            <Grid size={12}>
              <HeroCard
                icon={agent.icon}
                name={agent.name}
                nameDataCy="agent-summary-name-area"
              >
                {agent.engineName && (
                  <Chip
                    size="small"
                    variant="outlined"
                    color="default"
                    icon={<Iconify icon="mdi:chip" width={16} />}
                    label={agent.engineName}
                    sx={{ mt: 1 }}
                  />
                )}
              </HeroCard>
            </Grid>
          </>
        )}
      </Grid>
    </>
  );
}

export { Summary };
