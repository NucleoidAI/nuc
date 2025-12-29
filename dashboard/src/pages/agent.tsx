import AgentLayout from "../layouts/AgentLayout";
import AgentSkeleton from "../components/Skeletons/AgentSkeleton";
import Page from "../components/Page/Page";
import useAgent from "../hooks/useAgent";
import { useParams } from "react-router-dom";

function Agent() {
  const { colleagueId } = useParams();

  const { getAgent } = useAgent();
  const { agent, loading } = getAgent(colleagueId);

  if (loading) {
    return <AgentSkeleton />;
  }

  return (
    <>
      <Page name={"Agent"} />
      <AgentLayout agent={agent} loading={loading} />
    </>
  );
}
export default Agent;
