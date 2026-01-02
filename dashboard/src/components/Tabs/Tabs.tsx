import Tab from "@mui/material/Tab";
import { useCallback } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";

import Tabs, { tabsClasses } from "@mui/material/Tabs";

function TabBar({ TABS, currentTab, setCurrentTab }) {
  const isWideScreen = useMediaQuery("(min-width:1450px)");

  const handleTabChange = useCallback(
    (event, newValue) => {
      setCurrentTab(newValue);
    },
    [setCurrentTab]
  );

  return (
    <Tabs
      value={currentTab}
      onChange={handleTabChange}
      variant={isWideScreen ? "standard" : "scrollable"}
      centered={isWideScreen}
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{
        width: 1,
        maxWidth: "100vw",
        bottom: 0,
        zIndex: 9,
        position: "absolute",
        bgcolor: "background.paper",
        boxShadow: 3,
        [`& .${tabsClasses.flexContainer}`]: {
          pr: { md: 3 },
        },
        [`& .MuiTabs-indicator`]: {
          height: 2,
        },
        [`& .MuiTabs-scrollButtons`]: {
          zIndex: 10,
          "&.Mui-disabled": { opacity: 0.3 },
        },
      }}
    >
      {TABS.map((tab) => (
        <Tab
          data-cy={`tab-${tab.value}`}
          key={tab.value}
          value={tab.value}
          icon={tab.icon}
          label={tab.label}
        />
      ))}
    </Tabs>
  );
}

export default TabBar;
