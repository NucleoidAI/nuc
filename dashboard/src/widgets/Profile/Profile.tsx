import AIMarketplaceItem from "../AIMarketplace/AIMarketplaceItem";
import AgentAbout from "../../components/AgentAbout/AgentAbout";
import { Grid } from "@mui/material";
import Stack from "@mui/material/Stack";
import WidgetSummaryWidget from "../WidgetSummary/WidgetSummary";
import useAgent from "../../hooks/useAgent";
import useStatistics from "../../hooks/useStatistics";

function Profile({ agentId }: { agentId: string }) {
  const { getAgent, updateAgent } = useAgent();
  const { agent } = getAgent(agentId);
  const { statistics } = useStatistics();

  const engine = agent?.AIEngine;

  const renderEngine = <AIMarketplaceItem engine={engine} />;

  const renderAbout = <AgentAbout agent={agent} updateAgent={updateAgent} />;

  return (
    <Stack margin={2}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            <Stack spacing={3}>{renderEngine}</Stack>
          </Stack>
        </Grid>
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <Stack spacing={3}>{renderAbout}</Stack>
          </Stack>
        </Grid>
        <Grid item xs={12} md={3}>
          <WidgetSummaryWidget
            key={5}
            title="Response Rate"
            chartType={"bar"}
            size={statistics?.responseRate}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <WidgetSummaryWidget
            key={5}
            title="Supervising Rate"
            chartType={"bar"}
            size={statistics?.supervisingRate}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <WidgetSummaryWidget
            key={5}
            title="Knowledge Size"
            chartType={"bar"}
            size={statistics?.knowledgeSize}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <WidgetSummaryWidget
            key={5}
            title="Task Count"
            chartType={"bar"}
            size={statistics?.taskCount}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
export default Profile;
