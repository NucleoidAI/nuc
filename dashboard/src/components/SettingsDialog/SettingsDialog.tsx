import type { BlueprintMode } from "../ApiNode/apiNodes";
import CloseIcon from "@mui/icons-material/Close";
import { LinkSwipe } from "@canmingir/link/platform/components";
import TuneIcon from "@mui/icons-material/Tune";
import config from "../../../config";

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";

const MODE_HINTS: Record<Exclude<BlueprintMode, "API">, string> = {
  CHAT: "Runs in a conversation without input or response nodes.",
  JSON: "Starts from a JSON payload checked against the Input schema. Fields are available as session_variables.",
};

const SettingsDialog = ({
  showSettings,
  setShowSettings,
  settingsTab,
  setSettingsTab,
  blocking,
  setBlocking,
  liteMode,
  setLiteMode,
  mode = "CHAT",
  setMode,
  blueprintId,
}: {
  showSettings: boolean;
  setShowSettings: (value: boolean) => void;
  settingsTab: number;
  setSettingsTab: (value: number) => void;
  blocking: boolean;
  setBlocking: (value: boolean) => void;
  liteMode: boolean;
  setLiteMode: (value: boolean) => void;
  mode?: BlueprintMode;
  setMode?: (value: BlueprintMode) => void;
  blueprintId?: string;
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={showSettings}
      onClose={() => setShowSettings(false)}
      type="small"
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 3,
        "& .MuiDialog-paper": {
          height: "auto",
          width: "auto",
        },
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
                Supervision Mode
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Determines whether execution requires human supervision when
                uncertainty is detected.
              </Typography>
              <LinkSwipe
                checked={!blocking}
                onChange={(value) => setBlocking(!value)}
                theme={theme}
                idleColor="primary"
                offLabel="Training Mode"
                onLabel="Inference Mode"
                ariaLabel="Supervision mode"
                width={70}
                height={30}
                thumbSize={20}
                thumbIcon="⚡️"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1.5, display: "block" }}
              >
                {blocking
                  ? "Errors escalate to supervisor and halt the flow."
                  : "Errors are skipped and the flow continues."}
              </Typography>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 4 }}>
                Execution Mode
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Defines how execution is handled between AI and the platform.
              </Typography>
              <LinkSwipe
                checked={!!liteMode}
                onChange={setLiteMode}
                theme={theme}
                color="primary"
                variant="solid"
                showThumbIcon={false}
                offLabel="Full Mode"
                onLabel="Lite Mode"
                ariaLabel="Execution mode"
                width={70}
                height={30}
                thumbSize={20}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1.5, display: "block" }}
              >
                {liteMode
                  ? "Force nodes show only the lightning icon, no badge."
                  : "Force nodes show a badge while the flow has unsaved changes."}
              </Typography>

              {setMode && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 4 }}>
                    Input Mode
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Defines how the blueprint receives its input.
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    color="primary"
                    value={mode}
                    onChange={(_, value: BlueprintMode | null) =>
                      value && setMode(value)
                    }
                    aria-label="Input mode"
                  >
                    <ToggleButton value="CHAT">Chat</ToggleButton>
                    <ToggleButton value="JSON">JSON</ToggleButton>
                    <ToggleButton value="API">API</ToggleButton>
                  </ToggleButtonGroup>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      mt: 1.5,
                      display: "block",
                      ...(mode === "API" && {
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                      }),
                    }}
                  >
                    {mode === "API"
                      ? `POST ${config.api}/execute/${blueprintId}`
                      : MODE_HINTS[mode]}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
