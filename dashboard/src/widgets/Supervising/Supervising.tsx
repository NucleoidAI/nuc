import StatusToolbar from "../../components/StatusToolbar/StatusToolbar";
import SupervisingCard from "../../components/SupervisingCard/SupervisingCard";
import useSupervisings from "../../hooks/useSupervisings";

import {
  Box,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useMemo, useState } from "react";

const Supervising = ({ agentId }) => {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedType, setSelectedType] = useState<
    "All" | "KNOWLEDGE" | "RESPONSIBILITY"
  >("All");

  const { getColleagueSupervisingByStatus } = useSupervisings();

  const { supervisings, loading } = getColleagueSupervisingByStatus(
    agentId,
    selectedStatus
  );

  const filteredSupervisings = useMemo(() => {
    if (!supervisings) return [];
    if (selectedType === "All") return supervisings;
    return supervisings.filter((s) => s.type === selectedType);
  }, [supervisings, selectedType]);

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const handleTypeChange = (event, newType) => {
    if (newType !== null) {
      setSelectedType(newType);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        px: 2,
        pb: 2,
        minHeight: "calc(100vh - 240px)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <StatusToolbar
          statuses={["All", "ANSWERED", "IN_PROGRESS"]}
          handleChange={handleStatusChange}
          selectedStatus={selectedStatus}
        />

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <ToggleButtonGroup
            value={selectedType}
            exclusive
            onChange={handleTypeChange}
            aria-label="supervising type filter"
            size="small"
            sx={{
              backgroundColor: "background.paper",
              borderRadius: 1,
            }}
          >
            <ToggleButton value="All" aria-label="all types">
              All Types
            </ToggleButton>
            <ToggleButton
              value="KNOWLEDGE"
              aria-label="knowledge"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "rgba(33, 150, 243, 0.15)",
                  color: "#2196f3",
                  "&:hover": {
                    backgroundColor: "rgba(33, 150, 243, 0.25)",
                  },
                },
              }}
            >
              Knowledge
            </ToggleButton>
            <ToggleButton
              value="RESPONSIBILITY"
              aria-label="responsibility"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "rgba(255, 152, 0, 0.15)",
                  color: "#ff9800",
                  "&:hover": {
                    backgroundColor: "rgba(255, 152, 0, 0.25)",
                  },
                },
              }}
            >
              Responsibility
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          <Stack
            spacing={2}
            sx={{ textAlign: "center", p: 2, color: "text.secondary" }}
          >
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton
                key={item}
                variant="rectangular"
                height={180}
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Stack>
        ) : filteredSupervisings.length > 0 ? (
          filteredSupervisings.map((supervise) => (
            <SupervisingCard key={supervise.id} supervise={supervise} />
          ))
        ) : (
          <Stack sx={{ textAlign: "center", my: 4, color: "text.secondary" }}>
            No supervising data available for the selected filters
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default Supervising;
