import { loadApiCall } from "./apiSession";

import ApiCallPanel, { type ApiCall } from "./ApiCallPanel";
import { useEffect, useState } from "react";

const POLL_INTERVAL = 1500;

const ApiSessionView = ({ taskId }: { taskId: string }) => {
  const [call, setCall] = useState<ApiCall | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const next = await loadApiCall(taskId);
        if (stopped) return;
        if (next) setCall(next);
        if (!next || !next.done) timer = setTimeout(load, POLL_INTERVAL);
      } catch {
        if (!stopped) timer = setTimeout(load, POLL_INTERVAL);
      }
    };

    setCall(null);
    load();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [taskId]);

  return <ApiCallPanel call={call} />;
};

export default ApiSessionView;
