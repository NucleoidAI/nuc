import AIMarketplaceItem from "../AIMarketplace/AIMarketplaceItem";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import Stack from "@mui/material/Stack";
import WidgetSummaryWidget from "../WidgetSummary/WidgetSummary";
import useColleague from "../../hooks/useColleagueV2";
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

function Profile({ colleagueId }) {
  //TODO - Refactor here
  const { getColleague, updateColleague } = useColleague();
  const { colleague } = getColleague(colleagueId);
  const { statistics } = useStatistics();

  const [description, setDescription] = useState(colleague?.description);
  const [tempDescription, setTempDescription] = useState(
    colleague?.description
  );

  const [isUpdated, setIsUpdated] = useState(true);
  const engine = colleague?.AIEngine;

  useEffect(() => {
    if (colleague) {
      setDescription(colleague.description);
      setTempDescription(colleague.description);
    }
  }, [colleague]);

  const handleUpdate = async () => {
    if (isUpdated) {
      setIsUpdated(false);
      return;
    }

    setDescription(tempDescription);

    await updateColleague({
      ...colleague,
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
      <Typography sx={{ pl: 2 }}>{colleague?.name}</Typography>

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
            size={statistics.responseRate}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <WidgetSummaryWidget
            key={5}
            title="Supervising Rate"
            chartType={"bar"}
            size={statistics.supervisingRate}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <WidgetSummaryWidget
            key={5}
            title="Knowledge Size"
            chartType={"bar"}
            size={statistics.knowledgeSize}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <WidgetSummaryWidget
            key={5}
            title="Task Count"
            chartType={"bar"}
            size={statistics.taskCount}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
export default Profile;
