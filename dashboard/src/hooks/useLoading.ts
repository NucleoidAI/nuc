import { useEffect, useRef } from "react";

function useLoading(loading: boolean): boolean {
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!loading) {
      hasLoadedOnce.current = true;
    }
  }, [loading]);

  return !hasLoadedOnce.current && loading;
}

export default useLoading;
