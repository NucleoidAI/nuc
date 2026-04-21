import StatusToolbar from "../../components/StatusToolbar/StatusToolbar";
import SupervisingCard from "../../components/SupervisingCard/SupervisingCard";
import SupervisingSkeleton from "../../components/Skeletons/SupervisingSkeleton";
import { useState } from "react";
import useSupervisings from "../../hooks/useSupervisings";

import { Box, Stack } from "@mui/material";

const Supervising = ({ agentId }) => {
  const [selectedStatus, setSelectedStatus] = useState("All");

  const { getAgentSupervisingByStatus } = useSupervisings();

  const { supervisings, loading } = getAgentSupervisingByStatus(
    agentId,
    selectedStatus
  );

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  return (
    <Box
      sx={{
        width: "100%",
        px: 2,
        pb: 2,
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

        {loading ? (
          <>
            {[...Array(supervisings?.length)].map((_, i) => (
              <SupervisingSkeleton key={i} />
            ))}
          </>
        ) : supervisings && supervisings.length > 0 ? (
          supervisings.map((supervise) => (
            <SupervisingCard
              agentId={agentId}
              key={supervise.id}
              supervise={supervise}
            />
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
