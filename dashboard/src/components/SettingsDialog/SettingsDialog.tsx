import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CloseIcon from "@mui/icons-material/Close";
import Divider from "@mui/material/Divider";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import React from "react";
import TuneIcon from "@mui/icons-material/Tune";

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Switch,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

const SettingsDialog = ({
  showSettings,
  setShowSettings,
  settingsTab,
  setSettingsTab,
  blocking,
  setBlocking,
  force,
  setForce,
}) => {
  return (
    <Dialog
      open={showSettings}
      onClose={() => setShowSettings(false)}
      fullWidth
      maxWidth="md"
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 3,
      }}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Settings
          <IconButton size="small" onClick={() => setShowSettings(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 1, display: "flex", minHeight: 320 }}>
        <Tabs
          orientation="vertical"
          value={settingsTab}
          onChange={(_, v) => setSettingsTab(v)}
          sx={{
            borderRight: 1,
            borderColor: "divider",
            minWidth: 140,
            pt: 1,
          }}
        >
          <Tab
            icon={<TuneIcon fontSize="small" />}
            iconPosition="start"
            label="General"
            sx={{ justifyContent: "flex-start", gap: 1, minHeight: 48 }}
          />
        </Tabs>

        <Box sx={{ flex: 1, p: 3 }}>
          {settingsTab === 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Execution mode
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Controls how errors in this blueprint are handled during
                execution.
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {blocking ? (
                  <LockIcon fontSize="small" />
                ) : (
                  <LockOpenIcon fontSize="small" />
                )}
                <Typography variant="body2">
                  {blocking ? "Blocking" : "Non-blocking"}
                </Typography>
                <Switch
                  checked={!blocking}
                  onChange={(e) => setBlocking(!e.target.checked)}
                  color="success"
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1.5, display: "block" }}
              >
                {blocking
                  ? "Errors escalate to supervisor and halt the flow."
                  : "Errors are skipped and the flow continues."}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom>
                Force workflow
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                When enabled, the agent must follow the blueprint nodes in strict
                order, like a workflow. Steps cannot be skipped or reordered.
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <AccountTreeIcon fontSize="small" color={force ? "primary" : "disabled"} />
                <Typography variant="body2">
                  {force ? "Force enabled" : "Force disabled"}
                </Typography>
                <Switch
                  checked={!!force}
                  onChange={(e) => setForce(e.target.checked)}
                  color="primary"
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1.5, display: "block" }}
              >
                {force
                  ? "Agent must execute blueprint nodes in the defined order."
                  : "Agent may use blueprint nodes as guidance but is not required to follow them."}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
