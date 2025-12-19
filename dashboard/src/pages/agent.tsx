import AgentLayout from "../layouts/AgentLayout";
import Page from "../components/Page/Page";
import useAgent from "../hooks/useAgent";
import { useParams } from "react-router-dom";

function Agent() {
  const { colleagueId } = useParams();

  const { getAgent } = useAgent();
  const { agent, loading } = getAgent(colleagueId);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Page name={"Agent"} />
      <AgentLayout agent={agent} loading={loading} />
    </>
  );
}
export default Agent;
