import AgentsSkeleton from "../components/Skeletons/AgentsSkeleton";
import AgentsWidget from "../widgets/AgentsWidget/AgentsWidget";
import Page from "../components/Page/Page";
import SingleScrollableLayout from "../layouts/SingleScrollableLayout";
import { storage } from "@nucleoidjs/webstorage";
import { useEffect } from "react";
import { useEvent } from "@nucleoidai/react-event";
import useTeam from "../hooks/useTeams";
function Agents() {
  const teamId = storage.get("link", "projectid");

  const { getTeamById } = useTeam();

  const { loading } = getTeamById(teamId);

  const [teamSelected] = useEvent("ITEM_SELECTED", { itemId: teamId });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamSelected]);

  if (loading) {
    return <AgentsSkeleton />;
  }
  return (
    <>
      <Page name={"Agent"} />
      <SingleScrollableLayout>
        <AgentsWidget teamId={teamId} />
      </SingleScrollableLayout>
    </>
  );
}
export default Agents;
