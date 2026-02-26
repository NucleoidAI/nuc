import AddIcon from "@mui/icons-material/Add";
import { ICON_NAMES } from "../../lib/AgentAndTeamAvatars";
import IconButton from "@mui/material/IconButton";
import { Iconify } from "@canmingir/link/platform/components";
import React from "react";
import { cleanIconName } from "../../utils/cleanIconName";

import { Box, Dialog, Stack, Typography } from "@mui/material";

export default function AvatarSelector({
  handleEmojiSelect,
  newItem,
}: {
  handleEmojiSelect: (emoji: { id: string; src?: string }) => void;
  newItem: { icon?: string };
}) {
  const [emojiDialogOpen, setEmojiDialogOpen] = React.useState(false);

  const handleEmojiButtonClick = () => {
    setEmojiDialogOpen(true);
  };

  const handleIconClick = (iconName: string) => {
    handleEmojiSelect({ id: iconName, src: iconName });
    setEmojiDialogOpen(false);
  };

  return (
    <Stack alignContent={"center"} justifyContent={"center"}>
      <Stack>
        <IconButton
          data-cy="avatar-select-button"
          onClick={handleEmojiButtonClick}
          sx={{
            borderStyle: `dashed`,
            borderColor: "gray",
            borderWidth: "2px",
            mx: "auto",
            width: { xs: 64, md: 88 },
            height: { xs: 64, md: 88 },
          }}
        >
          {newItem.icon ? (
            <Iconify
              sx={{
                width: { xs: 48, md: 64 },
                height: { xs: 48, md: 64 },
              }}
              icon={cleanIconName(newItem.icon)}
              color="#ffffff"
            />
          ) : (
            <AddIcon
              sx={{ width: { xs: 32, md: 48 }, height: { xs: 32, md: 48 } }}
            />
          )}
        </IconButton>
      </Stack>
      <Dialog
        data-cy="avatar-selection"
        open={emojiDialogOpen}
        onClose={() => setEmojiDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: "background.default",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxHeight: "50vh",
            width: { xs: "90%", sm: 500 },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography sx={{ mb: 2 }}>Agent Icons</Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(100px, 1fr))",
              gap: 2,
            }}
          >
            {ICON_NAMES.map((iconName) => (
              <IconButton
                key={iconName}
                onClick={() => handleIconClick(iconName)}
                sx={{
                  width: 90,
                  height: 90,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Iconify
                  icon={iconName}
                  width={60}
                  height={60}
                  color="#ffffff"
                />
              </IconButton>
            ))}
          </Box>
        </Box>
      </Dialog>
    </Stack>
  );
}
