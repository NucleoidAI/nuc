import { getBackgroundUrl } from "../../utils/background";

export const TeamChartRenderer = (node) => {
  const bg = getBackgroundUrl(node.id);

  const base = {
    teamLineColor: "#D0D7E2",
    teamLineWidth: 1.8,
    teamGap: 14,
    teamLevelGap: 12,
    teamConnectorType: "default",
  };

  switch (node.nodeKind) {
    case "team":
      return {
        ...base,
        teamLayout: "gradient",
        teamBackground: bg,
        teamOverlayColor: "rgba(0,0,0,0.3)",
        teamHeight: 160,
        nodeSx: { minWidth: 400, minHeight: 130 },
      };

    case "agent":
      return {
        ...base,
        teamLayout: "media",
        teamBackground: bg,
        teamOverlayColor: "rgba(0,0,0,0.45)",
        teamHeight: 140,
        nodeSx: { minWidth: 400, minHeight: 130 },
      };

    case "Blueprint":
      return {
        ...base,
        teamLayout: "sideStripe",
        teamBackground: bg,
        teamOverlayColor: "rgba(0,0,0,0.4)",
        teamHeight: 110,
        teamStripeWidth: 70,
        nodeSx: { minWidth: 400, minHeight: 130 },
      };

    default:
      return base;
  }
};
