import type { BlueprintContext as BlueprintContextData } from "../../hooks/useBlueprint";
import { Box, TextField, Typography, useTheme } from "@mui/material";
import React, { useMemo, useState } from "react";

const Section = ({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: "text.secondary",
          letterSpacing: "0.5px",
          display: "block",
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ pl: 1, borderLeft: `2px solid ${theme.palette.divider}` }}>
        {children}
      </Box>
    </Box>
  );
};

const BlueprintContextDetails = ({
  context,
  onOutputClick,
}: {
  context?: BlueprintContextData | null;
  onOutputClick?: (nodeId: string) => void;
}) => {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const nodeOutputs = useMemo(() => context?.nodeOutputs ?? [], [context]);

  const filteredOutputs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return nodeOutputs;
    }
    return nodeOutputs.filter(
      (output) =>
        output.field.toLowerCase().includes(query) ||
        output.nodeLabel?.toLowerCase().includes(query) ||
        output.description?.toLowerCase().includes(query)
    );
  }, [nodeOutputs, search]);

  if (!context) {
    return (
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        No context captured for this flow
      </Typography>
    );
  }

  return (
    <Box>
      {nodeOutputs.length > 0 && (
        <TextField
          size="small"
          fullWidth
          placeholder="Search context outputs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 1 }}
        />
      )}
      <Section>
        {filteredOutputs.length > 0 ? (
          <Box>
            {filteredOutputs.map((output, i) => (
              <Box
                key={`${output.nodeId}-${output.field}-${i}`}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  p: 1,
                  mb: 0.5,
                  "&:last-of-type": { mb: 0 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "primary.main",
                    fontFamily: "monospace",
                  }}
                >
                  context.{output.field}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  From:{" "}
                  <Box
                    component="span"
                    onClick={
                      onOutputClick
                        ? () => onOutputClick(output.nodeId)
                        : undefined
                    }
                    sx={{
                      fontWeight: 700,
                      color: onOutputClick ? "primary.main" : "inherit",
                      cursor: onOutputClick ? "pointer" : "default",
                    }}
                  >
                    {output.nodeLabel}
                  </Box>
                </Typography>
                {output.description &&
                  /[a-zA-Z0-9]/.test(output.description) && (
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {output.description}
                    </Typography>
                  )}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {nodeOutputs.length > 0 ? "No matching contexts" : "No outputs"}
          </Typography>
        )}
      </Section>
    </Box>
  );
};

export default BlueprintContextDetails;
