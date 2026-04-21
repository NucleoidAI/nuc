import Tab from "@mui/material/Tab";
import useMediaQuery from "@mui/material/useMediaQuery";

import Tabs, { tabsClasses } from "@mui/material/Tabs";
import { useCallback, useEffect } from "react";

function TabBar({ TABS, currentTab, setCurrentTab, sidebarOpen = false }) {
  const isWideScreen = useMediaQuery("(min-width:1450px)");

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

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
      variant={"scrollable"}
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
          sx={{
            px: 2,
            display: "flex",
            flexDirection: "row",
            gap: 1,
            "&.Mui-selected": {
              color: "text.primary",
            },
          }}
        />
      ))}
    </Tabs>
  );
}

export default TabBar;
