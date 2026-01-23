import { Icon } from "@iconify/react";
import React from "react";

import { Card, Radio, Typography, useTheme } from "@mui/material";

const CommunicationBlueprintSelection = ({
  Blueprints,
  selectedRights,
  onRightsChange,
  blueprintIcon,
}: {
  Blueprints: Array<{
    id: string;
    title: string;
    icon?: string;
  }>;
  selectedRights: string[];
  onRightsChange: (rights: string[]) => void;
  blueprintIcon?: string;
}) => {
  const theme = useTheme();

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select one task blueprint to connect to the channel:
      </Typography>
      {(Blueprints || []).map((Blueprint) => {
        const checked = selectedRights.includes(Blueprint.id);
        return (
          <Card
            key={Blueprint.id}
            onClick={() => {
              onRightsChange([Blueprint.id]);
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
                onRightsChange([Blueprint.id]);
              }}
              value={Blueprint.id}
              name="blueprint-selection"
              color="primary"
              sx={{ p: 0 }}
            />
            <Icon
              icon={Blueprint.icon || blueprintIcon}
              width="24"
              height="24"
            />
            <Typography flexGrow={1}>{Blueprint.title}</Typography>
          </Card>
        );
      })}
      {selectedRights.length > 0 && (
        <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
          Selected: {Blueprints.find((r) => r.id === selectedRights[0])?.title}
        </Typography>
      )}
    </>
  );
};

export default CommunicationBlueprintSelection;
