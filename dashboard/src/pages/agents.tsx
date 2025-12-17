import AgentsWidget from "../widgets/AgentsWidget/AgentsWidget";
import Page from "../components/Page/Page";
import SingleScrollableLayout from "../layouts/SingleScrollableLayout";
import { storage } from "@nucleoidjs/webstorage";
import { useEffect } from "react";
import { useEvent } from "@nucleoidai/react-event";
import { useParams } from "react-router-dom";
import useTeam from "../hooks/useTeam";

function Agents() {
  const teamId = storage.get("itemId");

  const { team, loading } = useTeam(teamId);
  const { colleagueId } = useParams();

  const [teamSelected] = useEvent("ITEM_SELECTED", { itemId: teamId });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamSelected]);

  if (loading) {
    return <p>Loading...</p>;
  }
  return (
    <>
      <Page name={"Colleague"} />
      <SingleScrollableLayout title={team.name}>
        <AgentsWidget colleagueId={colleagueId} teamId={teamId} />
      </SingleScrollableLayout>
    </>
  );
}
export default Agents;
