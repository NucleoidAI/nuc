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
        nodeSx: { minWidth: 300 },
      };

    case "colleague":
      return {
        ...base,
        teamLayout: "media",
        teamBackground: bg,
        teamOverlayColor: "rgba(0,0,0,0.45)",
        teamHeight: 140,
        nodeSx: { maxWidth: 420 },
      };

    case "responsibility":
      return {
        ...base,
        teamLayout: "sideStripe",
        teamBackground: bg,
        teamOverlayColor: "rgba(0,0,0,0.4)",
        teamHeight: 110,
        teamStripeWidth: 70,
      };

    default:
      return base;
  }
};
