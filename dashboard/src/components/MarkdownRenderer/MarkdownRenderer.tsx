import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Box, Typography, useTheme } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

interface MarkdownRendererProps {
  children: string;
  sx?: SxProps<Theme>;
}

const MarkdownRenderer = ({ children, sx }: MarkdownRendererProps) => {
  const theme = useTheme();

  const markdownComponents = {
    h1: ({ children }) => (
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{ mt: 1.5, mb: 0.5, "&:first-of-type": { mt: 0 } }}
      >
        {children}
      </Typography>
    ),
    h2: ({ children }) => (
      <Typography
        variant="subtitle2"
        fontWeight={700}
        sx={{ mt: 1.5, mb: 0.5, "&:first-of-type": { mt: 0 } }}
      >
        {children}
      </Typography>
    ),
    h3: ({ children }) => (
      <Typography
        variant="body2"
        fontWeight={700}
        sx={{ mt: 1.25, mb: 0.5, "&:first-of-type": { mt: 0 } }}
      >
        {children}
      </Typography>
    ),
    p: ({ children }) => (
      <Typography
        variant="body2"
        component="p"
        sx={{ mb: 1, "&:last-child": { mb: 0 } }}
      >
        {children}
      </Typography>
    ),
    ul: ({ children }) => (
      <Box component="ul" sx={{ pl: 2.5, mb: 1, listStyleType: "disc" }}>
        {children}
      </Box>
    ),
    ol: ({ children }) => (
      <Box component="ol" sx={{ pl: 2.5, mb: 1 }}>
        {children}
      </Box>
    ),
    li: ({ children }) => (
      <Typography component="li" variant="body2" sx={{ py: 0.25 }}>
        {children}
      </Typography>
    ),
    a: ({ children, href }) => (
      <Typography
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ color: theme.palette.primary.main }}
      >
        {children}
      </Typography>
    ),
    blockquote: ({ children }) => (
      <Box
        sx={{
          borderLeft: `3px solid ${theme.palette.divider}`,
          pl: 1.5,
          my: 1,
          color: theme.palette.text.secondary,
        }}
      >
        {children}
      </Box>
    ),
    code: ({ children }) => (
      <Box
        component="code"
        sx={{
          fontFamily: "monospace",
          fontSize: "0.8125rem",
          bgcolor: theme.palette.action.hover,
          borderRadius: 0.5,
          px: 0.5,
          py: 0.125,
        }}
      >
        {children}
      </Box>
    ),
    pre: ({ children }) => (
      <Box
        component="pre"
        sx={{
          fontFamily: "monospace",
          fontSize: "0.8125rem",
          bgcolor: theme.palette.action.hover,
          borderRadius: 1,
          p: 1,
          mb: 1,
          overflowX: "auto",
          "& code": {
            bgcolor: "transparent",
            borderRadius: 0,
            px: 0,
            py: 0,
          },
        }}
      >
        {children}
      </Box>
    ),
    table: ({ children }) => (
      <Box
        component="table"
        sx={{
          borderCollapse: "collapse",
          width: "100%",
          mb: 1,
          fontSize: "0.8125rem",
          "& th, & td": {
            border: `1px solid ${theme.palette.divider}`,
            px: 1,
            py: 0.5,
            textAlign: "left",
          },
        }}
      >
        {children}
      </Box>
    ),
  };

  return (
    <Box
      sx={{ fontSize: "0.875rem", color: theme.palette.text.secondary, ...sx }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {children}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;
