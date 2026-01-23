import React from "react";

import { Alert, Snackbar } from "@mui/material";

const SuccessSnackbar = ({
  saveSuccess,
  setSaveSuccess,
}: {
  saveSuccess: boolean;
  setSaveSuccess: (saveSuccess: boolean) => void;
}) => {
  return (
    <Snackbar
      open={saveSuccess}
      autoHideDuration={3000}
      onClose={() => setSaveSuccess(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        onClose={() => setSaveSuccess(false)}
        severity="success"
        variant="filled"
        sx={{
          width: "100%",
          boxShadow: 3,
          "& .MuiAlert-icon": {
            fontSize: "1.5rem",
          },
        }}
      >
        Flow saved successfully!
      </Alert>
    </Snackbar>
  );
};

export default SuccessSnackbar;
