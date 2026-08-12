import { Iconify } from "@canmingir/link/platform/components";
import useBlueprint from "../../hooks/useBlueprint";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

type BlueprintItem = {
  id: string;
  title: string;
  description?: string;
};

function BlueprintSelect({
  selected,
  onToggle,
}: {
  selected: BlueprintItem[];
  onToggle: (blueprint: BlueprintItem) => void;
}) {
  const { getBlueprint } = useBlueprint();
  const { Blueprint, loading } = getBlueprint();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!Blueprint?.length) {
    return (
      <Stack sx={{ textAlign: "center", my: 4, color: "text.secondary" }}>
        <Typography variant="body2">
          No blueprints available for this team yet. You can skip this step and
          add blueprints later.
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      data-cy="agent-wizard-blueprint-step"
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 2,
        p: 2,
      }}
    >
      {Blueprint.map((blueprint: BlueprintItem) => {
        const isSelected = selected.some((item) => item.id === blueprint.id);

        return (
          <Card
            key={blueprint.id}
            data-cy="wizard-blueprint-card"
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderColor: isSelected ? "primary.main" : "divider",
              borderWidth: isSelected ? 2 : 1,
              height: 140,
            }}
          >
            <CardActionArea
              sx={{ height: "100%", alignItems: "flex-start" }}
              onClick={() => onToggle(blueprint)}
            >
              <CardContent sx={{ height: "100%", overflow: "hidden" }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Checkbox
                    checked={isSelected}
                    tabIndex={-1}
                    disableRipple
                    sx={{ p: 0 }}
                  />
                  <Iconify icon="mdi:sitemap-outline" width={18} />
                  <Typography variant="subtitle2" noWrap>
                    {blueprint.title}
                  </Typography>
                </Stack>

                {blueprint.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      wordBreak: "break-word",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 3,
                      overflow: "hidden",
                    }}
                  >
                    {blueprint.description}
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}

export type { BlueprintItem };
export default BlueprintSelect;
