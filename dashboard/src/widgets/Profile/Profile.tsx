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
    <Stack margin={1} spacing={1}>
      <Grid container spacing={1}>
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
      <Grid container spacing={1}>
        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Stack spacing={1}>
            <TaskScoresWidget agentId={agentId} />
          </Stack>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Stack spacing={1}>
            <CostWidget agentId={agentId} height="45vh" />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
export default Profile;
