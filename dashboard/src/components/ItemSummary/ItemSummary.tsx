import DialogContentText from "@mui/material/DialogContentText";
import Grid from "@mui/material/Grid";
import { Iconify } from "@canmingir/link/platform/components";
import { cleanIconName } from "../../utils/cleanIconName";
import { knowledgeTitle } from "../WizardSelect/KnowledgeSelect";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

export default function ItemSummary({ newItem }) {
  return (
    <>
      <DialogContentText sx={{ textAlign: "center", mb: 2 }}>
        Agent Summary
      </DialogContentText>

      <Grid container spacing={2} alignItems="stretch" sx={{ p: 2 }}>
        <Grid size={12}>
          <Card
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 2,
              bgcolor: "background.paper",
              boxShadow: (theme) => theme.customShadows?.card,
            }}
          >
            <CardContent sx={{ position: "relative" }}>
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

                  {newItem.engineName && (
                    <Chip
                      size="small"
                      variant="outlined"
                      color="default"
                      icon={<Iconify icon="mdi:chip" width={16} />}
                      label={newItem.engineName}
                      sx={{ mt: 1 }}
                      data-cy="item-summary-role-area"
                    />
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
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
                sx={{ whiteSpace: "pre-line", wordBreak: "break-word" }}
                data-cy="item-summary-description-area"
              >
                {newItem.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {newItem.knowledges?.length > 0 && (
          <Grid size={12}>
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
                  <Iconify
                    icon="mdi:book-open-outline"
                    width={18}
                    style={{ flexShrink: 0 }}
                  />
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ lineHeight: 1 }}
                  >
                    Knowledge
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ flexWrap: "wrap" }}
                  data-cy="item-summary-knowledge-area"
                >
                  {newItem.knowledges.map((knowledge) => (
                    <Chip
                      key={knowledge.id}
                      size="small"
                      variant="outlined"
                      color="default"
                      label={`${knowledge.type}: ${knowledgeTitle(knowledge)}`}
                      sx={{ maxWidth: "100%" }}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {newItem.blueprints?.length > 0 && (
          <Grid size={12}>
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
                  <Iconify
                    icon="mdi:sitemap-outline"
                    width={18}
                    style={{ flexShrink: 0 }}
                  />
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ lineHeight: 1 }}
                  >
                    Blueprints
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ flexWrap: "wrap" }}
                  data-cy="item-summary-blueprint-area"
                >
                  {newItem.blueprints.map((blueprint) => (
                    <Chip
                      key={blueprint.id}
                      size="small"
                      variant="outlined"
                      color="default"
                      label={blueprint.title}
                      sx={{ maxWidth: "100%" }}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </>
  );
}
