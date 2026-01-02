import { Icon } from "@iconify/react";
import React from "react";

import { Card, Radio, Typography, useTheme } from "@mui/material";

const CommunicationTaskBluePrintSelection = ({
  taskBluePrints,
  selectedRights,
  onRightsChange,
  taskBluePrintIcon,
}: {
  taskBluePrints: Array<{
    id: string;
    title: string;
    icon?: string;
  }>;
  selectedRights: string[];
  onRightsChange: (rights: string[]) => void;
  taskBluePrintIcon?: string;
}) => {
  const theme = useTheme();

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select one task blueprint to connect to the channel:
      </Typography>
      {(taskBluePrints || []).map((taskBluePrint) => {
        const checked = selectedRights.includes(taskBluePrint.id);
        return (
          <Card
            key={taskBluePrint.id}
            onClick={() => {
              onRightsChange([taskBluePrint.id]);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2,
              cursor: "pointer",
              border: checked
                ? `2px solid ${theme.palette.primary.main}`
                : `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              backgroundColor: checked
                ? theme.palette.primary.light + "20"
                : "transparent",
              transition: theme.transitions.create([
                "border-color",
                "background-color",
              ]),
              "&:hover": {
                backgroundColor: checked
                  ? theme.palette.primary.light + "30"
                  : theme.palette.action.hover,
              },
            }}
          >
            <Radio
              checked={checked}
              onChange={() => {
                onRightsChange([taskBluePrint.id]);
              }}
              value={taskBluePrint.id}
              name="task-blue-print-selection"
              color="primary"
              sx={{ p: 0 }}
            />
            <Icon
              icon={taskBluePrint.icon || taskBluePrintIcon}
              width="24"
              height="24"
            />
            <Typography flexGrow={1}>{taskBluePrint.title}</Typography>
          </Card>
        );
      })}
      {selectedRights.length > 0 && (
        <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
          Selected:{" "}
          {taskBluePrints.find((r) => r.id === selectedRights[0])?.title}
        </Typography>
      )}
    </>
  );
};

export default CommunicationTaskBluePrintSelection;
