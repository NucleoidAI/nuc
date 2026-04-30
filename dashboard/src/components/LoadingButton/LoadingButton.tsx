import type { LoadingButtonProps } from "@mui/lab/LoadingButton";
import MuiLoadingButton from "@mui/lab/LoadingButton";

function LoadingButton({ children, ...props }: LoadingButtonProps) {
  return (
    <MuiLoadingButton variant="contained" loadingPosition="start" {...props}>
      {children}
    </MuiLoadingButton>
  );
}

export default LoadingButton;
