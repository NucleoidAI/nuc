import { Skeleton, Stack } from "@mui/material";

function TeamChatNavItemSkeleton({ sx = {}, ...other }) {
  return (
    <Stack
      spacing={5}
      direction="row"
      alignItems="center"
      sx={{
        px: 2.5,
        py: 1.5,
        ...sx,
      }}
      {...other}
    >
      <Skeleton variant="circular" sx={{ width: 48, height: 48 }} />

      <Stack spacing={1} flexGrow={1}>
        <Skeleton sx={{ width: 0.9, height: 10 }} />
        <Skeleton sx={{ width: 0.5, height: 10 }} />
      </Stack>
    </Stack>
  );
}

export default TeamChatNavItemSkeleton;
