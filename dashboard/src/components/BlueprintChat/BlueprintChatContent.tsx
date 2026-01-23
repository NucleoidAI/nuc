import BlueprintMessageBox from "../BlueprintMessageBox/BlueprintMessageBox";
import BlueprintWelcomeMessage from "./BlueprintWelcomeMessage";

import { Box, CircularProgress, useTheme } from "@mui/material";

const BlueprintChatContent = ({ loading, messages }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        overflow: "auto",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "transparent",
        paddingX: { xs: "12px", sm: "16px", md: "20px" },
        paddingTop: "8px",
        paddingBottom: "8px",
        minHeight: 0,
        "&::-webkit-scrollbar": {
          width: "6px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          background: theme.palette.divider,
          borderRadius: "3px",
          "&:hover": {
            background: theme.palette.text.disabled,
          },
        },
      }}
    >
      {messages.length === 0 && <BlueprintWelcomeMessage />}

      {messages.map((message, index) => (
        <BlueprintMessageBox key={index} message={message} />
      ))}

      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 2,
          }}
        >
          <CircularProgress
            size={24}
            thickness={4}
            sx={{
              color: theme.palette.primary.main,
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default BlueprintChatContent;
