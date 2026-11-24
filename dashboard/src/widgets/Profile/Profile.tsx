import AIMarketplaceItem from "../AIMarketplace/AIMarketplaceItem";
import AgentAbout from "../../components/AgentAbout/AgentAbout";
import CostWidget from "../CostWidget/CostWidget";
import { Grid } from "@mui/material";
import Stack from "@mui/material/Stack";
import TaskScoresWidget from "../TaskScoresWidget/TaskScoresWidget";
import useAgent from "../../hooks/useAgent";

function Profile({ agentId }: { agentId: string }) {
  const { getAgent, updateAgent } = useAgent();
  const { agent } = getAgent(agentId);

  const engine = agent?.AIEngine;

  const renderEngine = <AIMarketplaceItem engine={engine} />;

  const renderAbout = <AgentAbout agent={agent} updateAgent={updateAgent} />;

  return (
    <Stack
      margin={2}
      spacing={1}
      sx={{
        height: { xs: "auto", md: "calc(100% - 32px)" },
        minHeight: 0,
        overflowY: { xs: "auto", md: "visible" },
      }}
    >
      <Grid container spacing={1} sx={{ flexShrink: 0 }}>
        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Stack spacing={1}>
            <Stack spacing={1}>{renderEngine}</Stack>
          </Stack>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Stack spacing={1}>
            <Stack spacing={1}>{renderAbout}</Stack>
          </Stack>
        </Grid>
      </Grid>
      <Grid
        container
        spacing={1}
        sx={{ flex: { xs: "0 0 auto", md: 1 }, minHeight: 0 }}
      >
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: { md: "100%" } }}>
          <Stack
            spacing={1}
            sx={{ mt: 1, height: { xs: "60vh", md: "calc(100% - 8px)" } }}
          >
            <TaskScoresWidget agentId={agentId} height="100%" />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: { md: "100%" } }}>
          <Stack
            spacing={1}
            sx={{ mt: 1, height: { xs: "60vh", md: "calc(100% - 8px)" } }}
          >
            <CostWidget agentId={agentId} height="100%" />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
export default Profile;
