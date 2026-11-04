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
          path: "/agents",
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
          title: "Task Scores",
          icon: "solar:document-text-bold",
          path: "/task-scores",
        },
        {
          title: "Cost",
          icon: "solar:wallet-money-bold-duotone",
          path: "/cost",
        },
        {
          title: "Operation",
          icon: "ic:outline-manage-accounts",
          path: "/operation",
        },
        {
          title: "Monitoring",
          icon: "ic:outline-dashboard",
          path: "/monitoring",
        },
        {
          title: "Reporting",
          icon: "iconoir:reports",
          path: "/reports",
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
