import LinkButton from "../../LinkButton";
import React from "react";
import { ValidationError } from "./validation";

import { Box, Button, alpha } from "@mui/material";

const ValidationButtons = ({
  validationErrors,
  setShowValidationErrors,
  handleSaveFlow,
  isSubmitting,
}: {
  validationErrors: ValidationError[];
  setShowValidationErrors: (show: boolean) => void;
  handleSaveFlow: () => void;
  isSubmitting?: boolean;
}) => {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 1000,
        display: "flex",
        gap: 2,
        alignItems: "center",
      }}
    >
      {validationErrors?.length > 0 && (
        <Button
          variant="outlined"
          onClick={() => setShowValidationErrors(true)}
          sx={{
            minWidth: 150,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            borderColor: (theme) => theme.palette.error.main,
            color: (theme) => theme.palette.error.main,
            backgroundColor: (theme) => alpha(theme.palette.error.main, 0.08),
            "&:hover": {
              borderColor: (theme) => theme.palette.error.dark,
              backgroundColor: (theme) => alpha(theme.palette.error.main, 0.16),
            },
          }}
        >
          {validationErrors.length} Error
          {validationErrors.length > 1 ? "s" : ""}
        </Button>
      )}
      <LinkButton
        onClick={handleSaveFlow}
        loading={isSubmitting}
        disabled={validationErrors.length > 0}
        sx={{
          minWidth: 150,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 600,
          background: (theme) =>
            `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          boxShadow: 3,
          "&:hover": {
            background: (theme) =>
              `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            boxShadow: 1,
            color: "white",
          },
          "&:disabled": {
            background: (theme) => theme.palette.action.disabledBackground,
            color: (theme) => theme.palette.action.disabled,
          },
        }}
      >
        Save Flow
      </LinkButton>
    </Box>
  );
};

export default ValidationButtons;
