import { Iconify } from "@canmingir/link/platform/components";
import React from "react";
import { alpha } from "@mui/material/styles";

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

const BlueprintSelector = ({
  Blueprints,
  selectedBlueprint,
  onBlueprintChange,
}: {
  Blueprints: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  selectedBlueprint?: string;
  onBlueprintChange: (blueprintId: string) => void;
}) => {
  return (
    <Box
      className="noDrag"
      sx={{
        width: "100%",
        p: 1.5,
        bgcolor: (theme) => alpha(theme.palette.grey[900], 0.8),
        boxShadow: 2,
      }}
    >
      <FormControl fullWidth>
        <InputLabel
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            "&.Mui-focused": {
              color: "white",
            },
          }}
        >
          Blueprint
        </InputLabel>
        <Select
          value={selectedBlueprint || "Automatic"}
          onChange={(e) => onBlueprintChange(e.target.value)}
          label="Blueprint"
          sx={{
            color: "white",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.3)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.5)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "white",
            },
            "& .MuiSelect-icon": {
              color: "rgba(255, 255, 255, 0.7)",
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: (theme) => alpha(theme.palette.grey[900], 0.95),
                "& .MuiMenuItem-root": {
                  color: "white",
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                  },
                  "&.Mui-selected": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.3),
                    "&:hover": {
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.4),
                    },
                  },
                },
              },
            },
          }}
        >
          <MenuItem value="Automatic">
            <Typography sx={{ color: "white" }}>Automatic</Typography>
          </MenuItem>
          {Blueprints.map((Blueprint) => (
            <MenuItem key={Blueprint.id} value={Blueprint.id}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Iconify
                  icon="healthicons:crisis-response-center-person-outline"
                  width={20}
                  height={20}
                  sx={{ color: "white" }}
                />
                <Typography sx={{ color: "white" }}>
                  {Blueprint.title}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default BlueprintSelector;
