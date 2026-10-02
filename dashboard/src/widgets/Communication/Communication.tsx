import AddIcon from "@mui/icons-material/Add";
import CommunicationDiagram from "../../components/CommunicationDiagram/CommunicationDiagram";
import CommunicationWizard from "../CommunicationWizard/CommunicationWizard";
import useBlueprint from "../../hooks/useBlueprint";
import useCommunications from "../../hooks/useCommunications";

import { Box, CircularProgress, Fab, Stack } from "@mui/material";
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
  const { getBlueprint } = useBlueprint();
  const { Blueprint: blueprintList, loading, error } = getBlueprint();

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
              name: base.label,
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
          right: `tbp-${comm.blueprintId}`,
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

  const handleConnect = async (channelId, blueprintIds) => {
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      for (const rid of blueprintIds) {
        await createCommunication({
          channelType: channel.type.toUpperCase(),
          channelCode: channel.code,
          blueprintId: rid.replace(/^tbp-/, ""),
        });
      }
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 200,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <div>Error loading task blueprints: {error}</div>;
  }

  const Blueprints =
    (blueprintList || []).map((r) => ({
      id: `tbp-${r.id}`,
      title: r.title,
    })) || [];

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        px: 2,
        pb: 2,
      }}
    >
      <Box
        position="relative"
        sx={{
          backgroundColor: "rgb(28, 28, 29)",
          backgroundImage: `repeating-linear-gradient(145deg, #252424 0 2px, transparent 2px 15px, #252424 15px 16px, transparent 16px 29px)`,
          borderRadius: 2,
          p: 2,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <CommunicationDiagram
          channels={channels}
          Blueprints={Blueprints}
          connections={connections}
          minHeight="100%"
          colorMap={{
            whatsapp: "#25D366",
            slack: "#4A154B",
            email: "#1976d2",
          }}
        />

        <CommunicationWizard
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          channels={channels}
          Blueprints={Blueprints}
          availableChannels={availableChannels}
          connections={connections}
          onAddChannel={handleAddChannel}
          onDeleteChannel={handleDeleteChannel}
          onConnect={handleConnect}
          blueprintIcon="healthicons:crisis-response-center-person-outline"
        />
      </Box>

      <Stack
        sx={{
          position: "absolute",
          right: 16,
          bottom: 16,
        }}
      >
        <Fab
          variant="button"
          color="default"
          onClick={() => setDialogOpen(true)}
          aria-label="Connect channel to task blueprint"
        >
          <AddIcon />
        </Fab>
      </Stack>
    </Box>
  );
};

export default Communication;
