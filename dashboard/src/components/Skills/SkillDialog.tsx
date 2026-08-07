import "../../styles/connectButton.css";

import AuthHandler from "../LoginHandler/AuthHandler";
import ClosableDialogTitle from "./ClosableDialogTitle";
import { Icon } from "@iconify/react";
import { Iconify } from "@canmingir/link/platform/components";
import SourcedAvatar from "../SourcedAvatar/SourcedAvatar";

import {
  Avatar,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

const SkillDialog = ({
  open,
  handleClose,
  skill,
  team,
  agents,
  acquiredMCPs,
  getTokens,
}: {
  getTokens: (mcp, code, id, isTeam) => Promise<{ refresh_token: string }>;
  acquiredMCPs?: Array<{
    id: string;
    mcpId: string;
    refreshToken: string;
  }>;
  open: boolean;
  handleClose: () => void;
  skill?: {
    id: string;
    name: string;
    icon: string;
    title: string;
    description: string;
    oauth: {
      scope: string;
      tokenUrl: string;
      clientId: string;
      redirectUri: string;
    };
  } | null;
  team?: { name: string; icon: string; id: string };
  agents?: Array<{ id: string; name: string; icon: string }>;
}) => {
  const matchingMCP = acquiredMCPs?.find((mcp) => mcp.mcpId === skill?.id);

  const [selectedOption, setSelectedOption] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [isSwitchChecked, setIsSwitchChecked] = useState(
    matchingMCP?.refreshToken !== undefined &&
      matchingMCP?.refreshToken !== null &&
      matchingMCP?.refreshToken !== ""
  );
  const NumberOne = "/media/number-one.png";
  const NumberTwo = "/media/number-two.png";
  const NumberThree = "/media/number-three.png";

  const { handleLogin } = AuthHandler({
    skill,
    getTokens,
    onAuthSuccess: () => setIsSwitchChecked(true),
  });

  useEffect(() => {
    if (team) {
      setSelectedOption(team.name);
      setSelectedOptionId(team.id);
    } else if (agents && agents.length > 0) {
      setSelectedOption(agents[0].name);
      setSelectedOptionId(agents[0].id);
    }
  }, [team, agents]);

  const handleChange = (event) => {
    const selectedName = event.target.value;
    setSelectedOption(selectedName);

    if (team && selectedName === team.name) {
      setSelectedOptionId(team.id);
    } else if (agents) {
      const selectedAgent = agents.find((agent) => agent.name === selectedName);
      setSelectedOptionId(selectedAgent?.id || "");
    }
  };

  useEffect(() => {
    setIsSwitchChecked(
      matchingMCP?.refreshToken !== undefined &&
        matchingMCP?.refreshToken !== null &&
        matchingMCP?.refreshToken !== ""
    );
  }, [matchingMCP]);

  const handleSwitchChange = () => {
    if (matchingMCP) {
      if (!isSwitchChecked) {
        handleLogin(selectedOptionId, team && selectedOptionId === team.id);
      }
      return;
    }
    setIsSwitchChecked(!isSwitchChecked);
  };

  if (!skill) return null;

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth={"sm"}
      slotProps={{
        paper: {
          tabIndex: -1,
          sx: { "&:focus, &:focus-visible": { outline: "none" } },
        },
      }}
      onClose={(event: React.KeyboardEvent) =>
        event.key === "Escape" ? handleClose() : null
      }
    >
      <ClosableDialogTitle handleClose={handleClose} />
      <DialogContent>
        <Box sx={{ textAlign: "center" }}>
          <Icon icon={skill.icon} width="20" height="20" />
          <Typography variant="h4" sx={{ mt: 1 }}>
            {skill.title}
          </Typography>
        </Box>
        <Box sx={{ mt: 3 }}>{skill.description}</Box>
        <Divider sx={{ mt: 3 }} />
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <h2>How it works?</h2>
        </Box>
        <Box sx={styles.listRoot}>
          <List sx={styles.list}>
            <ListItem>
              <ListItemAvatar>
                <Avatar src={NumberOne}></Avatar>
              </ListItemAvatar>
              <ListItemText primary="Integrate app with your device" />
            </ListItem>
            <ListItem>
              <ListItemAvatar>
                <Avatar src={NumberTwo}></Avatar>
              </ListItemAvatar>
              <ListItemText primary="Make the desired changes" />
            </ListItem>
            <ListItem>
              <ListItemAvatar>
                <Avatar src={NumberThree}></Avatar>
              </ListItemAvatar>
              <ListItemText primary="Use automation with joy" />
            </ListItem>
          </List>
        </Box>
        <Divider sx={{ mt: 3 }} />

        <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FormControl fullWidth sx={{ mr: 2 }}>
              <InputLabel id="select-label">Select Option</InputLabel>
              <Select
                labelId="select-label"
                value={selectedOption}
                onChange={handleChange}
                label="Select Option"
              >
                {team && (
                  <MenuItem value={team.name}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Iconify
                        icon={team.icon.replace(/^:|:$/g, "")}
                        sx={{ width: 40, height: 40 }}
                      />
                      <Box sx={{ ml: 1 }}>{team.name}</Box>
                    </Box>
                  </MenuItem>
                )}

                {agents &&
                  agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.name}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <SourcedAvatar
                          source={"MINIMAL"}
                          iconUrl={agent.icon}
                          name={agent.name}
                        />
                        <Box sx={{ ml: 1 }}>{agent.name}</Box>
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <label className="switch" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isSwitchChecked}
                onChange={handleSwitchChange}
              />
              <span></span>
            </label>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions></DialogActions>
    </Dialog>
  );
};

const styles = {
  dialog: {
    bgcolor: "custom.darkDialogBg",
    zIndex: 2147483647,
  },
  welcome: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    pb: 1,
  },
  content: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  howItWorks: {
    display: "flex",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  listRoot: {
    display: "flex",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    textAlign: "center",
  },
};

export default SkillDialog;
