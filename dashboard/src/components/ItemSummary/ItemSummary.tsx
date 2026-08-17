import AgentSummary from "./AgentSummary";
import BlueprintSummary from "./BlueprintSummary";
import { Box } from "@mui/material";
import EngineSummary from "./EngineSummary";
import Grid from "@mui/material/Grid";
import KnowledgeSummary from "./KnowledgeSummary";
const DETAIL_LIST_HEIGHT = "calc(100vh - 600px)";

const detailListSx = {
  height: DETAIL_LIST_HEIGHT,
  overflowY: "auto",
  pr: 0.5,
};

export default function ItemSummary({ newItem }) {
  const team = newItem.team;

  return (
    <Box>
      <Grid container spacing={2} alignItems="stretch" sx={{ p: 1 }}>
        <AgentSummary newItem={newItem} team={team} />

        <EngineSummary newItem={newItem} />

        <KnowledgeSummary newItem={newItem} detailListSx={detailListSx} />

        <BlueprintSummary newItem={newItem} detailListSx={detailListSx} />
      </Grid>
    </Box>
  );
}
