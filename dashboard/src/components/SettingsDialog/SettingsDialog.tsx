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
  Typography,
  useTheme,
} from "@mui/material";

const SettingsDialog = ({
  showSettings,
  setShowSettings,
  settingsTab,
  setSettingsTab,
  blocking,
  setBlocking,
  liteMode,
  setLiteMode,
  api = false,
  setApi,
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
  api?: boolean;
  setApi?: (value: boolean) => void;
  blueprintId?: string;
}) => {
  const theme = useTheme();

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
                idleColor="primary"
                offLabel="Training Mode"
                onLabel="Inference Mode"
                ariaLabel="Force mode"
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
                {liteMode
                  ? "Force nodes show only the lightning icon, no badge."
                  : "Force nodes show a badge while the flow has unsaved changes."}
              </Typography>

              {setApi && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 4 }}>
                    API
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Expose this blueprint as an HTTP endpoint with request and
                    response nodes.
                  </Typography>
                  <LinkSwipe
                    checked={api}
                    onChange={setApi}
                    theme={theme}
                    color="primary"
                    variant="solid"
                    showThumbIcon={false}
                    offLabel="Off"
                    onLabel="On"
                    ariaLabel="API"
                    width={70}
                    height={30}
                    thumbSize={20}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      mt: 1.5,
                      display: "block",
                      ...(api && {
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                      }),
                    }}
                  >
                    {api
                      ? `POST ${config.api}/execute/${blueprintId}`
                      : "Turning this on adds Request and Response nodes to the flow. Turning it off removes them."}
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
