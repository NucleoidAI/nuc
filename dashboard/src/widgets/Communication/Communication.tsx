import AddIcon from "@mui/icons-material/Add";
import CommunicationDiagram from "../../components/CommunicationDiagram/CommunicationDiagram";
import CommunicationWizard from "../CommunicationWizard/CommunicationWizard";
import useCommunications from "../../hooks/useCommunications";
import useResponsibility from "../../hooks/useResponsibility";

import { Box, Fab } from "@mui/material";
import React, { useEffect, useState } from "react";

const availableChannels = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "logos:whatsapp-icon",
    requiresInput: true,
    inputLabel: "Phone Number",
  },
  { id: "slack", label: "Slack", icon: "devicon:slack" },
  { id: "email", label: "Email", icon: "mdi:email-outline" },
];

const Communication = () => {
  const { getResponsibility } = useResponsibility();
  const { responsibility: respList, loading, error } = getResponsibility();

  const { getCommunications, createCommunication, deleteCommunication } =
    useCommunications();
  const { communications } = getCommunications();

  const [channels, setChannels] = useState([]);
  const [connections, setConnections] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (communications && Array.isArray(communications)) {
      const channelMap = new Map();
      communications.forEach((comm) => {
        const typeLower = comm.channelType.toLowerCase();
        const code = comm.channelCode;
        const id = `${typeLower}-${code}`;
        if (!channelMap.has(id)) {
          const base = availableChannels.find((c) => c.id === typeLower);
          if (base) {
            channelMap.set(id, {
              type: typeLower,
              id,
              label:
                base.requiresInput && code
                  ? `${base.label} (${code})`
                  : base.label,
              icon: base.icon,
              code,
            });
          }
        }
      });
      setChannels(Array.from(channelMap.values()));
      setConnections(
        communications.map((comm) => ({
          left: `${comm.channelType.toLowerCase()}-${comm.channelCode}`,
          right: `resp-${comm.responsibilityId}`,
        }))
      );
    }
  }, [communications]);

  const handleAddChannel = (newChannel) => {
    setChannels((prev) => [...prev, newChannel]);
  };

  const handleDeleteChannel = async (channelId) => {
    const communicationToDelete = communications.find(
      (comm) =>
        `${comm.channelType.toLowerCase()}-${comm.channelCode}` === channelId
    );

    if (communicationToDelete) {
      await deleteCommunication(communicationToDelete.id);
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      setConnections((prev) => prev.filter((c) => c.left !== channelId));
    }
  };

  const handleConnect = async (channelId, responsibilityIds) => {
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      for (const rid of responsibilityIds) {
        await createCommunication({
          channelType: channel.type.toUpperCase(),
          channelCode: channel.code,
          responsibilityId: rid.replace(/^resp-/, ""),
        });
      }
    }
  };

  if (loading) {
    return <div>Loading task blueprints...</div>;
  }
  if (error) {
    return <div>Error loading task blueprints: {error}</div>;
  }

  const taskBluePrints =
    (respList || []).map((r) => ({
      id: `resp-${r.id}`,
      title: r.title,
    })) || [];

  return (
    <Box
      sx={{
        width: "100%",
        px: 2,
        pb: 2,
      }}
    >
      <Box position="relative">
        <CommunicationDiagram
          channels={channels}
          taskBluePrints={taskBluePrints}
          connections={connections}
          availableChannels={availableChannels}
          onAddChannel={handleAddChannel}
          onDeleteChannel={handleDeleteChannel}
          onConnect={handleConnect}
          colorMap={{
            whatsapp: "#25D366",
            slack: "#4A154B",
            email: "#1976d2",
          }}
        />

        <Fab
          variant="button"
          color="default"
          size="medium"
          sx={{ position: "fixed", bottom: 16, right: 16 }}
          onClick={() => setDialogOpen(true)}
          aria-label="Connect channel to task blueprint"
        >
          <AddIcon />
        </Fab>

        <CommunicationWizard
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          channels={channels}
          taskBluePrints={taskBluePrints}
          availableChannels={availableChannels}
          connections={connections}
          onAddChannel={handleAddChannel}
          onDeleteChannel={handleDeleteChannel}
          onConnect={handleConnect}
          taskBluePrintIcon="healthicons:crisis-response-center-person-outline"
        />
      </Box>
    </Box>
  );
};

export default Communication;
