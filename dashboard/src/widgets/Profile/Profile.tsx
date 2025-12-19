import AIMarketplaceItem from "../AIMarketplace/AIMarketplaceItem";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import Stack from "@mui/material/Stack";
import WidgetSummaryWidget from "../WidgetSummary/WidgetSummary";
import useAgent from "../../hooks/useAgent";
import useStatistics from "../../hooks/useStatistics";

import {
  Card,
  CardHeader,
  Fab,
  Grid,
  InputBase,
  Typography,
  alpha,
} from "@mui/material";
import { useEffect, useState } from "react";

// ----------------------------------------------------------------------

function Profile({ agentId }) {
  //TODO - Refactor here
  const { getAgent, updateAgent } = useAgent();
  const { agent } = getAgent(agentId);
  const { statistics } = useStatistics();

  const [description, setDescription] = useState(agent?.description);
  const [tempDescription, setTempDescription] = useState(agent?.description);

  const [isUpdated, setIsUpdated] = useState(true);
  const engine = agent?.AIEngine;

  useEffect(() => {
    if (agent) {
      setDescription(agent.description);
      setTempDescription(agent.description);
    }
  }, [agent]);

  const handleUpdate = async () => {
    if (isUpdated) {
      setIsUpdated(false);
      return;
    }

    setDescription(tempDescription);

    await updateAgent({
      ...agent,
      description: tempDescription,
    });

    setIsUpdated(true);
  };

  const renderEngine = (
    <AIMarketplaceItem
      engine={engine}
      isWizardEngine={""}
      handleEngineSelect={""}
    />
  );

  const renderAbout = (
    <Card sx={{ p: 1, height: 220 }}>
      <CardHeader title="Name" sx={{ pl: 2 }} />
      <Typography sx={{ pl: 2 }}>{agent?.name}</Typography>

      <CardHeader
        title="Description"
        sx={{ p: 2 }}
        action={
          <Fab
            color="default"
            size="small"
            data-cy="edit-icon"
            onClick={handleUpdate}
          >
            {isUpdated ? <EditIcon /> : <CheckIcon />}
          </Fab>
        }
      />

      {isUpdated ? (
        <Typography sx={{ pl: 2 }}>{description}</Typography>
      ) : (
        <InputBase
          value={tempDescription}
          onChange={(e) => setTempDescription(e.target.value)}
          fullWidth
          data-cy="role"
          sx={{
            p: 1,
            mb: 2,
            ml: 2,
            mr: 2,
            borderRadius: 1,
            border: (theme) =>
              `solid 1px ${alpha(theme.palette.grey[500], 0.2)}`,
          }}
        />
      )}
    </Card>
  );

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
