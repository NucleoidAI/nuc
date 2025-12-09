import { Iconify } from "@canmingir/link/platform/components";
import { Skeleton } from "@mui/material";
import { cleanIconName } from "../../utils/cleanIconName";

import { Box, ListItemText, Stack, alpha, useTheme } from "@mui/material";

function bgGradient(props) {
  const direction = props?.direction || "to bottom";
  const startColor = props?.startColor;
  const endColor = props?.endColor;
  const imgUrl = props?.imgUrl;
  const color = props?.color;

  if (imgUrl) {
    return {
      background: `linear-gradient(${direction}, ${startColor || color}, ${
        endColor || color
      }), url(${imgUrl})`,
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center center",
    };
  }

  return {
    background: `linear-gradient(${direction}, ${startColor}, ${endColor})`,
  };
}

function ProfileCover({ name, iconUrl, role, coverUrl, loading }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        ...bgGradient({
          color: alpha(theme.palette.primary.dark, 0.3),
          imgUrl: coverUrl,
        }),
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
                mx: "auto",
                width: { xs: 32, md: 64 },
                height: { xs: 32, md: 64 },
                borderRadius: "50%",
                border: `2px solid ${theme.palette.common.white}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <Iconify
                icon={cleanIconName(iconUrl)}
                width="70%"
                height="70%"
                style={{ objectFit: "contain" }}
              />
            </Box>

            <ListItemText
              sx={{
                mt: 3,
                ml: { md: 3 },
                textAlign: { xs: "center", md: "unset" },
              }}
              primary={name}
              secondary={role}
              primaryTypographyProps={{
                typography: "h4",
              }}
              secondaryTypographyProps={{
                mt: 0.5,
                color: "inherit",
                component: "span",
                typography: "body2",
                sx: { opacity: 0.48 },
              }}
            />
          </>
        )}
      </Stack>
    </Box>
  );
}

export default ProfileCover;
