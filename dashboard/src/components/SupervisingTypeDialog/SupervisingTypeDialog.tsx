import { Iconify } from "@canmingir/link/platform/components";

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

interface SupervisingTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectKnowledge: () => void;
  onSelectBlueprint: (blueprint: {
    id: string;
    title: string;
    description: string;
    agentId: string;
  }) => void;
  blueprint: {
    id: string;
    title: string;
    description: string;
    agentId: string;
  };
}

const SupervisingTypeDialog = ({
  open,
  onClose,
  onSelectKnowledge,
  onSelectBlueprint,
  blueprint,
}: SupervisingTypeDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          fontSize: "1.25rem",
          fontWeight: 600,
          pb: 2,
        }}
      >
        Select Supervising Type
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 2,
            pb: 2,
          }}
        >
          <Box
            onClick={onSelectKnowledge}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              p: 3,
              borderRadius: 2,
              border: "2px solid",
              borderColor: "rgba(33, 150, 243, 0.2)",
              backgroundColor: "rgba(33, 150, 243, 0.05)",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "#2196f3",
                backgroundColor: "rgba(33, 150, 243, 0.1)",
                boxShadow: "0 4px 12px rgba(33, 150, 243, 0.2)",
              },
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: "rgba(33, 150, 243, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Iconify
                icon="solar:chat-round-line-bold"
                sx={{ width: 32, height: 32, color: "#2196f3" }}
              />
            </Box>
            <Typography variant="h6" sx={{ color: "#2196f3", fontWeight: 600 }}>
              Knowledge
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                fontSize: "0.875rem",
              }}
            >
              Add general knowledge
            </Typography>
          </Box>

          <Box
            onClick={() => onSelectBlueprint(blueprint)}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              p: 3,
              borderRadius: 2,
              border: "2px solid",
              borderColor: "rgba(255, 152, 0, 0.2)",
              backgroundColor: "rgba(255, 152, 0, 0.05)",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "#ff9800",
                backgroundColor: "rgba(255, 152, 0, 0.1)",
                boxShadow: "0 4px 12px rgba(255, 152, 0, 0.2)",
              },
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 152, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Iconify
                icon="healthicons:crisis-response-center-person-outline"
                sx={{ width: 32, height: 32, color: "#ff9800" }}
              />
            </Box>
            <Typography variant="h6" sx={{ color: "#ff9800", fontWeight: 600 }}>
              Blueprint
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                fontSize: "0.875rem",
              }}
            >
              Manage specific blueprints
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SupervisingTypeDialog;
