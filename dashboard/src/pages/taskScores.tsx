import { Box } from "@mui/material";
import Page from "../components/Page/Page";
import TaskScoresWidget from "../widgets/TaskScoresWidget/TaskScoresWidget";

function TaskScores() {
  return (
    <>
      <Page name="Task Scores" />
      <Box sx={{ px: { xs: 2, md: 4 }, pb: 1 }}>
        <TaskScoresWidget />
      </Box>
    </>
  );
}

export default TaskScores;
