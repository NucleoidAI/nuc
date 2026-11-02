import AddIcon from "@mui/icons-material/Add";
import ChannelDiagram from "../../components/ChannelDiagram/ChannelDiagram";
import ChannelWizard from "../ChannelWizard/ChannelWizard";
import useBlueprint from "../../hooks/useBlueprint";
import useChannels from "../../hooks/useChannels";

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
  {
    id: "email",
    label: "Email",
    icon: "mdi:email-outline",
    requiresInput: true,
    configurable: true,
    inputLabel: "Email Address",
  },
];

const Channel = () => {
  const { getBlueprint } = useBlueprint();
  const { Blueprint: blueprintList, loading, error } = getBlueprint();

  const { getChannels, createChannel, updateChannel, deleteChannel } =
    useChannels();
  const { channels: records } = getChannels();

  const [channels, setChannels] = useState([]);
  const [connections, setConnections] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (records && Array.isArray(records)) {
      const channelMap = new Map();
      records.forEach((record) => {
        const typeLower = record.channelType.toLowerCase();
        const code = record.channelCode;
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
              config: record.config ?? null,
              recordIds: [record.id],
            });
          }
        } else {
          channelMap.get(id).recordIds.push(record.id);
        }
      });
      setChannels(Array.from(channelMap.values()));
      setConnections(
        records.map((record) => ({
          left: `${record.channelType.toLowerCase()}-${record.channelCode}`,
          right: `tbp-${record.blueprintId}`,
        }))
      );
    }
  }, [records]);

  const handleAddChannel = (newChannel) => {
    setChannels((prev) => [...prev, newChannel]);
  };

  const handleUpdateChannelConfig = async (channelId, config) => {
    const channel = channels.find((c) => c.id === channelId);

    if (!channel?.recordIds?.length) {
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, config } : c))
      );
      return;
    }

    for (const id of channel.recordIds) {
      await updateChannel(id, config);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    const recordToDelete = records.find(
      (record) =>
        `${record.channelType.toLowerCase()}-${record.channelCode}` ===
        channelId
    );

    if (recordToDelete) {
      await deleteChannel(recordToDelete.id);
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      setConnections((prev) => prev.filter((c) => c.left !== channelId));
    }
  };

  const handleConnect = async (channelId, blueprintIds) => {
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      for (const rid of blueprintIds) {
        await createChannel({
          channelType: channel.type.toUpperCase(),
          channelCode: channel.code,
          blueprintId: rid.replace(/^tbp-/, ""),
          ...(channel.config ? { config: channel.config } : {}),
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
        <ChannelDiagram
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

        <ChannelWizard
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          channels={channels}
          Blueprints={Blueprints}
          availableChannels={availableChannels}
          connections={connections}
          onAddChannel={handleAddChannel}
          onDeleteChannel={handleDeleteChannel}
          onUpdateChannelConfig={handleUpdateChannelConfig}
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
          data-cy="add-channel-button"
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

export default Channel;
