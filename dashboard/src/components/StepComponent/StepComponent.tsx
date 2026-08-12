import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";
import LinkLoadingButton from "../LinkLoadingButton";
import React from "react";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";

import { Box, Button, Stack } from "@mui/material";

export default function StepComponent({
  activeStep,
  steps,
  stepExp,
  handleNext,
  handleBack,
  handleSave,
  children,
  isSubmitting,
  nextDisabled = false,
}) {
  return (
    <>
      <Stepper
        activeStep={activeStep}
        sx={{ backgroundColor: (theme) => theme.palette.background.default }}
      >
        {steps.map((label) => {
          const stepProps = {};
          const labelProps = {};
          return (
            <Step
              key={label}
              {...stepProps}
              sx={{
                backgroundColor: (theme) => theme.palette.background.default,
              }}
            >
              <StepLabel
                sx={{
                  backgroundColor: (theme) => theme.palette.background.default,
                }}
                {...labelProps}
              >
                {label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      <Stack
        sx={{ backgroundColor: (theme) => theme.palette.background.default }}
      >
        <DialogContentText
          sx={{
            textAlign: "center",
            my: 2,
            mx: 5,
            backgroundColor: (theme) => theme.palette.background.default,
            cursor: "default",
          }}
        >
          {stepExp[activeStep]}
        </DialogContentText>
      </Stack>
      {children}
      <DialogActions
        sx={{ backgroundColor: (theme) => theme.palette.background.default }}
      >
        <Button
          data-cy="agent-back-button"
          variant="outlined"
          color="inherit"
          disabled={activeStep === 0 || isSubmitting}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        <Box sx={{ flex: "1 1 auto" }} />
        {activeStep === steps.length - 1 ? (
          <LinkLoadingButton
            variant="contained"
            data-cy="agent-finish-button"
            onClick={handleSave}
            loading={isSubmitting}
          >
            Finish
          </LinkLoadingButton>
        ) : (
          <>
            <Button
              variant="outlined"
              data-cy="agent-next-button"
              disabled={nextDisabled}
              onClick={handleNext}
            >
              Next
            </Button>
          </>
        )}
      </DialogActions>
    </>
  );
}
