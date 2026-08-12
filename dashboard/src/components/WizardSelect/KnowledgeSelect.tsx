import { Iconify } from "@canmingir/link/platform/components";
import type { Knowledge } from "../../hooks/useKnowledge";
import { storage } from "@nucleoidjs/webstorage";
import useKnowledge from "../../hooks/useKnowledge";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

const knowledgeTitle = (knowledge: Knowledge) => {
  switch (knowledge.type) {
    case "URL":
      return knowledge.url;
    case "QA":
      return knowledge.question;
    default:
      return knowledge.text;
  }
};

const knowledgeSubtitle = (knowledge: Knowledge) =>
  knowledge.type === "QA" ? knowledge.answer : "";

function KnowledgeSelect({
  selected,
  onToggle,
}: {
  selected: Knowledge[];
  onToggle: (knowledge: Knowledge) => void;
}) {
  const teamId = storage.get("projectId");
  const { getTeamKnowledges } = useKnowledge();
  const { knowledges, loading } = getTeamKnowledges(teamId);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!knowledges?.length) {
    return (
      <Stack sx={{ textAlign: "center", my: 4, color: "text.secondary" }}>
        <Typography variant="body2">
          No knowledge available for this team yet. You can skip this step and
          add knowledge later.
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      data-cy="agent-wizard-knowledge-step"
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 2,
        p: 2,
      }}
    >
      {knowledges.map((knowledge: Knowledge) => {
        const isSelected = selected.some((item) => item.id === knowledge.id);

        return (
          <Card
            key={knowledge.id}
            data-cy="wizard-knowledge-card"
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
              onClick={() => onToggle(knowledge)}
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
                  <Chip
                    size="small"
                    variant="outlined"
                    color="primary"
                    icon={<Iconify icon="mdi:book-open-outline" width={16} />}
                    label={knowledge.type}
                  />
                </Stack>

                <Typography
                  variant="subtitle2"
                  sx={{
                    wordBreak: "break-word",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}
                >
                  {knowledgeTitle(knowledge)}
                </Typography>

                {knowledgeSubtitle(knowledge) && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      wordBreak: "break-word",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      overflow: "hidden",
                    }}
                  >
                    {knowledgeSubtitle(knowledge)}
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

export { knowledgeTitle, knowledgeSubtitle };
export default KnowledgeSelect;
