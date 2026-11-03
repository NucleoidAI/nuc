import ChannelBlueprintSelection from "./ChannelBlueprintSelection";
import ChannelInputDialog from "./ChannelInputDialog";
import ChannelSelection from "./ChannelSelection";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailChannelDialog from "./EmailChannelDialog";
import React from "react";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

const ChannelWizard = ({
  open,
  onClose,
  channels,
  Blueprints,
  availableChannels,
  connections,
  onAddChannel,
  onDeleteChannel,
  onUpdateChannelConfig,
  onConnect,
  blueprintIcon,
}) => {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [leftSelection, setLeftSelection] = React.useState(null);
  const [selectedRights, setSelectedRights] = React.useState([]);
  const [inputDialogOpen, setInputDialogOpen] = React.useState(false);
  const [pendingChannelOption, setPendingChannelOption] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [editingChannel, setEditingChannel] = React.useState(null);
  const handleDialogClose = () => {
    onClose();
    setTabIndex(0);
    setLeftSelection(null);
    setSelectedRights([]);
    setInputDialogOpen(false);
    setPendingChannelOption(null);
    setEmailDialogOpen(false);
    setEditingChannel(null);
  };

  const handleTabChange = (_event, newValue) => setTabIndex(newValue);

  const handleChannelSelect = (channelId) => {
    const isAlreadyConnected = connections?.some(
      (conn) => conn.left === channelId
    );

    setLeftSelection(channelId);

    if (!isAlreadyConnected) {
      setTabIndex(1);
    }
  };

  const handleChannelAddRequest = (optionId) => {
    const option = (availableChannels || []).find((c) => c.id === optionId);
    if (!option) return;

    if (option.configurable) {
      setPendingChannelOption(option);
      setEditingChannel(null);
      setEmailDialogOpen(true);
    } else if (option.requiresInput) {
      setPendingChannelOption(option);
      setInputDialogOpen(true);
    } else {
      const newChannel = {
        type: option.id,
        id: option.id,
        label: option.label,
        icon: option.icon,
        code: option.id,
      };
      onAddChannel && onAddChannel(newChannel);
      setLeftSelection(newChannel.id);
      setTabIndex(1);
    }
  };
  const handleInputDialogSubmit = (channelOption, inputValue) => {
    if (channelOption) {
      const newChannel = {
        type: channelOption.id,
        id: channelOption.id + "-" + inputValue,
        label: `${channelOption.label} (${inputValue})`,
        icon: channelOption.icon,
        code: inputValue,
      };
      onAddChannel && onAddChannel(newChannel);
      setLeftSelection(newChannel.id);
      setTabIndex(1);
    }
    setInputDialogOpen(false);
    setPendingChannelOption(null);
  };

  const handleChannelConfigure = (channelId) => {
    const channel = (channels || []).find((c) => c.id === channelId);
    if (!channel) return;
    setEditingChannel(channel);
    setEmailDialogOpen(true);
  };

  const closeEmailDialog = () => {
    setEmailDialogOpen(false);
    setEditingChannel(null);
    setPendingChannelOption(null);
  };

  const handleEmailDialogSubmit = async (config) => {
    if (editingChannel) {
      if (onUpdateChannelConfig) {
        await onUpdateChannelConfig(editingChannel.id, config);
      }
      closeEmailDialog();
      return;
    }

    if (pendingChannelOption) {
      const newChannel = {
        type: pendingChannelOption.id,
        id: `${pendingChannelOption.id}-${config.address}`,
        label: `${pendingChannelOption.label} (${config.address})`,
        icon: pendingChannelOption.icon,
        code: config.address,
        config,
      };
      onAddChannel && onAddChannel(newChannel);
      setLeftSelection(newChannel.id);
      setTabIndex(1);
    }
    closeEmailDialog();
  };

  const getExistingConnection = (channelId) => {
    if (!channelId || !connections) return null;
    return connections.find((conn) => conn.left === channelId);
  };

  const existingConnection = getExistingConnection(leftSelection);
  const isChannelAlreadyConnected = !!existingConnection;

  const handleConnect = async () => {
    setIsSubmitting(true);
    if (!leftSelection) return;
    if (isChannelAlreadyConnected) {
      return;
    }
    if (onConnect) await onConnect(leftSelection, selectedRights);
    handleDialogClose();
    setIsSubmitting(false);
  };

  return (
    <>
      <Dialog open={open} onClose={handleDialogClose} type="small">
        <DialogTitle>Connect Channel to Task Blueprint</DialogTitle>
        <DialogContent sx={{ minHeight: 200 }}>
          <Tabs value={tabIndex} onChange={handleTabChange}>
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    component="span"
                    sx={{
                      border: tabIndex === 0 ? "1px solid" : "none",
                      borderColor: "divider",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      color: tabIndex !== 0 ? "primary.main" : "inherit",
                    }}
                  >
                    {tabIndex === 0 ? (
                      "1"
                    ) : (
                      <CheckCircleIcon fontSize="small" />
                    )}
                  </Typography>
                  Channel
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    component="span"
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    2
                  </Typography>
                  Task Blueprint
                </Box>
              }
              disabled={!leftSelection}
            />
          </Tabs>
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: "1px dashed rgba(145, 158, 171, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {tabIndex === 0 && (
              <ChannelSelection
                channels={channels}
                availableChannels={availableChannels}
                connections={connections}
                leftSelection={leftSelection}
                onChannelSelect={handleChannelSelect}
                onChannelDelete={onDeleteChannel}
                onChannelConfigure={handleChannelConfigure}
                onChannelAddRequest={handleChannelAddRequest}
              />
            )}
            {tabIndex === 1 &&
              leftSelection &&
              (isChannelAlreadyConnected ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Channel Already Connected
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    This channel is already connected to a task blueprint:
                  </Typography>
                  <Typography
                    variant="body1"
                    color="primary"
                    sx={{ fontWeight: "bold" }}
                  >
                    {(() => {
                      const connectedblueprint = Blueprints.find(
                        (r) => r.id === existingConnection?.right
                      );
                      return connectedblueprint
                        ? connectedblueprint.title
                        : "Unknown Task Blueprint";
                    })()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 3 }}
                  >
                    To connect this channel to a different task blueprint,
                    please disconnect it first.
                  </Typography>
                </Box>
              ) : (
                <ChannelBlueprintSelection
                  Blueprints={Blueprints}
                  selectedRights={selectedRights}
                  onRightsChange={setSelectedRights}
                  blueprintIcon={blueprintIcon}
                />
              ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            data-cy="channel-wizard-connect-button"
            onClick={handleConnect}
            disabled={
              isChannelAlreadyConnected ||
              selectedRights.length !== 1 ||
              !leftSelection ||
              isSubmitting
            }
            variant="contained"
          >
            {isSubmitting ? (
              <Box style={{ display: "flex", alignItems: "center" }}>
                <CircularProgress
                  size={18}
                  color="inherit"
                  style={{ marginRight: "8px" }}
                />
                Connecting...
              </Box>
            ) : isChannelAlreadyConnected ? (
              "Already Connected"
            ) : (
              "Connect"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <EmailChannelDialog
        open={emailDialogOpen}
        onClose={closeEmailDialog}
        onSubmit={handleEmailDialogSubmit}
        initialConfig={editingChannel?.config}
      />

      {pendingChannelOption && !pendingChannelOption.configurable && (
        <ChannelInputDialog
          open={inputDialogOpen}
          onClose={() => {
            setInputDialogOpen(false);
            setPendingChannelOption(null);
          }}
          onSubmit={handleInputDialogSubmit}
          pendingChannelOption={pendingChannelOption}
        />
      )}
    </>
  );
};

export default ChannelWizard;
