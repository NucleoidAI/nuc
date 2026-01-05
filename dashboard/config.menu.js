import TeamChartButton from "./src/widgets/TeamChartButton/index.ts";
const menuConfig = {
  topMenu: [],
  sideMenu: [
    {
      subheader: "Dashboard",
      items: [
        {
          title: "Agents",
          icon: "solar:chart-line-duotone",
          path: "/colleagues",
        },
        {
          title: "Team Chat",
          icon: "ic:baseline-chat",
          path: "/chat",
        },
        {
          title: "Knowledge Base",
          icon: "carbon:ibm-watson-knowledge-studio",
          path: "/knowledge",
        },
        {
          title: "MCPs",
          icon: "carbon:ibm-cloud-pak-integration",
          path: "/mcps",
        },
        {
          title: "Monitoring",
          icon: "ic:outline-dashboard",
          path: "/monitoring",
        },
        {
          title: "Documentation",
          icon: "oui:documentation",
          path: "https://greycollar.ai/docs",
          external: true,
        },
      ],
    },
  ],
  options: [
    {
      label: "Home",
      linkTo: "/",
    },
    {
      label: "Profile",
      linkTo: "/",
    },
    {
      label: "Settings",
      linkTo: "/",
    },
  ],
  actionButtons: [TeamChartButton],
  fullScreenLayout: "left",
};

export default menuConfig;
