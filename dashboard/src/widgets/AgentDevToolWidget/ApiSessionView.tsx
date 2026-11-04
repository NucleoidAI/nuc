import { loadApiCall } from "./apiSession";

import ApiCallPanel, { type ApiCall } from "./ApiCallPanel";
import { useEffect, useState } from "react";

const POLL_INTERVAL = 1500;

const ApiSessionView = ({
  agentId,
  sessionId,
}: {
  agentId: string;
  sessionId: string;
}) => {
  const [call, setCall] = useState<ApiCall | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      const next = await loadApiCall(agentId, sessionId).catch(() => null);
      if (stopped) return;
      setCall(next);
      if (next && !next.done) timer = setTimeout(load, POLL_INTERVAL);
    };

    setCall(null);
    load();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [agentId, sessionId]);

  return <ApiCallPanel call={call} />;
};

export default ApiSessionView;
