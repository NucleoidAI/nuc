import AIMarketplaceItem from "../AIMarketplace/AIMarketplaceItem";
import { Grid } from "@mui/material";
import Stack from "@mui/material/Stack";
import useColleague from "../../hooks/useColleagueV2";

// ----------------------------------------------------------------------

function Profile({ colleagueId }) {
  //TODO - Refactor here
  const { getColleague } = useColleague();
  const { colleague, loading } = getColleague(colleagueId);

  const engine = colleague?.AIEngine;

  const renderEngine = (
    <AIMarketplaceItem
      engine={engine}
      isWizardEngine={""}
      handleEngineSelect={""}
    />
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack margin={2}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            <Stack spacing={3}>{renderEngine}</Stack>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
export default Profile;
