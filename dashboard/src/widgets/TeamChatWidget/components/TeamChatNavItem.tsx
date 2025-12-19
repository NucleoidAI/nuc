import { Box } from "@mui/material";
import { Iconify } from "@canmingir/link/platform/components";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import Stack from "@mui/material/Stack";
import { cleanIconName } from "../../../utils/cleanIconName";

function TeamChatNavItem({ member, selected, collapse, onClick }) {
  const { name, icon, role } = member;

  const handleClickMember = () => {
    onClick(member);
  };

  return (
    <>
      {!collapse && (
        <ListItemButton
          disableGutters
          onClick={handleClickMember}
          sx={{
            py: 1,
            px: 2,
            ...(selected && {
              bgcolor: "action.selected",
            }),
          }}
        >
          <Box
            sx={{
              mx: "auto",
              width: { xs: 32, md: 64 },
              height: { xs: 32, md: 64 },
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <Iconify
              icon={cleanIconName(icon)}
              width="40%"
              height="40%"
              style={{ objectFit: "contain" }}
            />
          </Box>
          <ListItemText
            sx={{ ml: 2 }}
            primary={name}
            primaryTypographyProps={{
              noWrap: true,
              variant: "subtitle2",
            }}
            secondary={role}
            secondaryTypographyProps={{
              noWrap: true,
              component: "span",
              variant: "body2",
              color: "text.secondary",
            }}
          />
          <Stack alignItems="flex-end" sx={{ ml: 1, height: 44 }}></Stack>
        </ListItemButton>
      )}
    </>
  );
}
export default TeamChatNavItem;
