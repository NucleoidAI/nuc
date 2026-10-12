import { Iconify } from "@canmingir/link/platform/components";
import { Skeleton } from "@mui/material";
import { cleanIconName } from "../../utils/cleanIconName";

import { Box, ListItemText, Stack } from "@mui/material";

function ProfileCover({ name, iconUrl, coverUrl, loading }) {
  return (
    <Box
      sx={{
        background: "#1e2730",
        height: 1,
        color: "common.white",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{
          left: { md: 24 },
          bottom: { md: 54 },
          zIndex: { md: 10 },
          pt: { xs: 6, md: 0 },
          position: { md: "absolute" },
        }}
      >
        {loading ? (
          <Skeleton variant="circular" height={90} />
        ) : (
          <>
            <Box
              sx={{
                mx: { md: "auto" },
                ml: { xs: "50%", md: "auto" },
                mt: { xs: -4, md: 3 },
                width: { xs: 32, md: 56 },
                height: { xs: 32, md: 56 },
                borderRadius: "50%",
                display: "flex",
                backgroundImage: coverUrl,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                transformStyle: "preserve-3d",
                transform:
                  "perspective(1500px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
                boxShadow: `
                3px 3px 0 #716f6f,
                20px 10px 40px rgba(0, 0, 0, 0.5)
              `,
                transition:
                  "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, filter 0.25s ease",
                "&:hover": {
                  transform:
                    "perspective(1500px) rotateX(0deg) rotateY(-10deg) rotateZ(0deg)",
                  filter: "brightness(1.070)",
                  boxShadow: `
                  3px 3px 0 #716f6f,
                  20px 10px 40px rgba(0, 0, 0, 0.5)
                  `,
                },
              }}
            >
              <Iconify
                icon={cleanIconName(iconUrl)}
                width="50%"
                height="50%"
                style={{ objectFit: "contain" }}
              />
            </Box>

            <ListItemText
              sx={{
                mt: { xs: 0.5, md: 7 },
                ml: { xs: 3, md: 2.5 },
                textAlign: { xs: "center", md: "unset" },
              }}
              primary={name}
              slotProps={{
                primary: {
                  typography: "h5",
                },

                secondary: {
                  mt: 0.5,
                  color: "inherit",
                  component: "span",
                  typography: "body2",
                  sx: { opacity: 0.48 },
                },
              }}
            />
          </>
        )}
      </Stack>
    </Box>
  );
}

export default ProfileCover;
