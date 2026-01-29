import React from "react";
import { ValidationError } from "./validation";

import { Alert, AlertTitle, List, ListItem, ListItemText } from "@mui/material";

const ValidationErrorView = ({
  validationErrors,
  setShowValidationErrors,
}: {
  validationErrors: ValidationError[];
  setShowValidationErrors: (show: boolean) => void;
}) => {
  return (
    <Alert
      severity="error"
      onClose={() => setShowValidationErrors(false)}
      sx={{
        position: "absolute",
        top: 80,
        right: 16,
        maxWidth: 500,
        zIndex: 1001,
      }}
    >
      <AlertTitle>Flow Validation Errors</AlertTitle>
      <List dense>
        {validationErrors.map((error, index) => (
          <ListItem key={index} sx={{ pl: 0 }}>
            <ListItemText
              primary={error.message}
              secondary={`Missing properties: ${error.missingProperties.join(
                ", "
              )}`}
            />
          </ListItem>
        ))}
      </List>
    </Alert>
  );
};

export default ValidationErrorView;
