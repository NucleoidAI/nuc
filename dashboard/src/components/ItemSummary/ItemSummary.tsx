import AgentSummary from "./AgentSummary";
import BlueprintSummary from "./BlueprintSummary";
import { Box } from "@mui/material";
import EngineSummary from "./EngineSummary";
import Grid from "@mui/material/Grid";
import KnowledgeSummary from "./KnowledgeSummary";
const DETAIL_LIST_HEIGHT = 200;

const detailListSx = {
  height: DETAIL_LIST_HEIGHT,
  overflowY: "auto",
  pr: 0.5,
};

export default function ItemSummary({ newItem }) {
  const hasKnowledges = newItem.knowledges?.length > 0;
  const hasBlueprints = newItem.blueprints?.length > 0;
  const team = newItem.team;

  return (
    <Box>
      <Grid container spacing={2} alignItems="stretch" sx={{ p: 1 }}>
        <AgentSummary newItem={newItem} team={team} />

        <EngineSummary newItem={newItem} />

        {hasKnowledges && <KnowledgeSummary newItem={newItem} />}

        {hasBlueprints && (
          <BlueprintSummary newItem={newItem} detailListSx={detailListSx} />
        )}
      </Grid>
    </Box>
  );
}
