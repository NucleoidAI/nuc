import ReactMarkdown from "react-markdown";
import { Box, CircularProgress, Typography } from "@mui/material";

type LogicViewProps = {
  height?: number | string;
  content?: string;
  loading?: boolean;
  rounded?: boolean;
  title?: string;
};

const LogicView = ({
  height,
  content,
  loading,
  title = "LOGIC.md",
  rounded = true,
}: LogicViewProps) => {
  return (
    <Box
      sx={{
        mb: rounded ? 1 : 0,
        height: height || "calc(100vh - 48px)",
        display: "flex",
        flexDirection: "column",
        borderRadius: "1px",
        overflow: "hidden",
        bgcolor: "#000000",
        flexShrink: 0,
        px: rounded ? 2 : 0,
        py: rounded ? 2 : 0,
      }}
    >
      <Box
        sx={{
          borderRadius: rounded ? "12px" : 0,
          border: rounded ? "1px solid rgba(255,255,255,0.08)" : "none",
        }}
      >
        <Box
          sx={{
            p: 1,
            borderBottom: "0.5px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              color: "#e3e3e3",
              fontWeight: 500,
              fontSize: "0.95rem",
            }}
          >
            {title}
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            pl: "35px",
            pr: 2,
            pt: 1,
            pb: 1,
            "& code": {
              bgcolor: "rgba(255,255,255,0.1)",
              px: 0.5,
              borderRadius: 0.5,
            },
            "& p:first-of-type": { mt: 0 },
            "& h1:first-of-type, & h2:first-of-type, & h3:first-of-type": {
              mt: 0,
            },
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(255,255,255,0.1)",
              borderRadius: 2,
            },
          }}
        >
          {loading && !content ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#a1a1aa",
                fontSize: "0.85rem",
                py: 1,
              }}
            >
              <CircularProgress size={14} sx={{ color: "#a1a1aa" }} />
              Generating…
            </Box>
          ) : content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <Box sx={{ height: "1.2em" }} />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default LogicView;
