import CodeBlock from "../CodeBlock/CodeBlock";
import InfoCard from "../InfoCard/InfoCard";
import { ResultTable } from "../ResultTable/ResultTable";

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Switch,
  Typography,
} from "@mui/material";
import React, { useCallback, useState } from "react";

const TaskResultDialog = ({
  open,
  setOpen,
  task,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  task: {
    comment: string;
    createdAt: string;
    status: string;
    result: string | object | unknown[];
  };
}) => {
  const [viewMode, setViewMode] = useState("table");

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "table" ? "text" : "table"));
  }, []);

  const renderResult = () => {
    const result = task.result;
    if (result === null)
      return <Typography variant="body1">No result available</Typography>;

    if (typeof result === "string") {
      return <Typography variant="body1">{result}</Typography>;
    }

    return viewMode === "table" ? (
      <ResultTable data={result} />
    ) : (
      <CodeBlock>{JSON.stringify(result, null, 2)}</CodeBlock>
    );
  };

  const isJson = typeof task.result === "object" && task.result !== null;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          backgroundColor: (theme) => theme.palette.background.default,
          textAlign: "center",
        }}
      >
        Task Details
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "2rem",
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <Box>
          <InfoCard label="Comment" value={task.comment} />
          <InfoCard
            label="Status"
            value={task.status === "IN_PROGRESS" ? "In Progress" : "Done"}
          />
          <InfoCard
            label="Created At"
            value={new Date(task.createdAt).toLocaleTimeString()}
          />
          <InfoCard
            label="Result"
            sx={{ position: "relative" }}
            value={
              <>
                {isJson && (
                  <>
                    <Switch
                      checked={viewMode === "table"}
                      onChange={toggleViewMode}
                      sx={{
                        position: "absolute",
                        top: -5,
                        right: -12,
                        transform: "scale(0.8)",
                      }}
                    />
                    <Typography
                      variant="body2"
                      color={
                        viewMode === "table" ? "text.disabled" : "text.primary"
                      }
                      sx={{
                        position: "absolute",
                        top: 3,
                        right: 33,
                        transform: "scale(0.8)",
                      }}
                    >
                      JSON
                    </Typography>
                  </>
                )}
                {renderResult()}
              </>
            }
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TaskResultDialog;
