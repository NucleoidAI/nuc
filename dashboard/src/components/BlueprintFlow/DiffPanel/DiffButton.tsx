import React from "react";
import type { ValidationError } from "../Validation/validation";

import { Button, alpha } from "@mui/material";

const DiffButton = ({
  onShowDiff,
  validationErrors,
}: {
  onShowDiff: () => void;
  validationErrors?: ValidationError[];
}) => {
  return (
    <Button
      variant="outlined"
      onClick={onShowDiff}
      sx={{
        position: "absolute",
        top: 60,
        right: validationErrors?.length ? 350 : 180,
        zIndex: 2,
        minWidth: 150,
        borderRadius: 2,
        textTransform: "none",
        fontWeight: 500,
        borderColor: (theme) => theme.palette.info.main,
        color: (theme) => theme.palette.info.main,
        backgroundColor: (theme) => alpha(theme.palette.info.main, 0.1),
        "&:hover": {
          borderColor: (theme) => theme.palette.info.dark,
          backgroundColor: (theme) => alpha(theme.palette.info.main, 0.18),
        },
      }}
    >
      View JSON Diff
    </Button>
  );
};

export default DiffButton;
