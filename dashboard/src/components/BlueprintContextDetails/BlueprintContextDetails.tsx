import type { BlueprintContext as BlueprintContextData } from "../../hooks/useBlueprint";
import React from "react";

import { Box, Chip, Divider, Typography, useTheme } from "@mui/material";

const Section = ({
  label,
  children,
}: {
  label: string;
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
          textTransform: "uppercase",
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
}: {
  context?: BlueprintContextData | null;
}) => {
  if (!context) {
    return (
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        No context captured for this flow
      </Typography>
    );
  }

  const {
    agent,
    knowledge = [],
    referenceBlueprint,
    supervising,
    userRequest,
    capturedAt,
  } = context;

  return (
    <Box>
      {agent?.name && (
        <Section label="Agent">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {agent.name}
          </Typography>
          {agent.description && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {agent.description}
            </Typography>
          )}
        </Section>
      )}

      <Section label="Knowledge">
        {knowledge.length > 0 ? (
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {knowledge.map((item, i) => (
              <Typography
                key={i}
                component="li"
                variant="caption"
                sx={{ color: "text.secondary" }}
              >
                {item.question || item.text || item.type || "Untitled"}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            No knowledge
          </Typography>
        )}
      </Section>

      <Section label="Reference blueprint">
        {referenceBlueprint ? (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {referenceBlueprint.title || referenceBlueprint.id} (
            {referenceBlueprint.nodeCount} node
            {referenceBlueprint.nodeCount === 1 ? "" : "s"})
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            Built from scratch
          </Typography>
        )}
      </Section>

      {supervising && (
        <Section label="Supervision">
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontStyle: "italic" }}
          >
            {supervising.question}
          </Typography>
          {supervising.status && (
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={supervising.status}
                size="small"
                variant="outlined"
              />
            </Box>
          )}
        </Section>
      )}

      {userRequest && (
        <Section label="Request">
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {userRequest}
          </Typography>
        </Section>
      )}

      {capturedAt && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            Captured {new Date(capturedAt).toLocaleString()}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default BlueprintContextDetails;
