import LandingDialog from "./LandingDialog";
import { useEffect } from "react";
import { useEvent } from "@nucleoidai/react-event";

import { storage, useStorage } from "@nucleoidjs/webstorage";

const Onboarding = () => {
  const [landing] = useStorage("nuc", "landinglevel", null);
  const [teamSelected] = useEvent("PROJECT_SELECTED", { projectId: null });

  useEffect(() => {
    if (landing === null && teamSelected.projectId !== null) {
      storage.set("nuc", "landinglevel", 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamSelected]);

  switch (landing) {
    case 0:
      return <LandingDialog />;
  }

  return;
};

export default Onboarding;
