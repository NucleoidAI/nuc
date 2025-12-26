import AddIcon from "@mui/icons-material/Add";
import ColleagueAndTeamAvatars from "../../lib/ColleagueAndTeamAvatars";
import IconButton from "@mui/material/IconButton";
import { Iconify } from "@canmingir/link/platform/components";
import Picker from "@emoji-mart/react";
import React from "react";
import { cleanIconName } from "../../utils/cleanIconName";

import { Dialog, Stack } from "@mui/material";

export default function AvatarSelector({
  handleEmojiSelect,
  newItem,
}: {
  handleEmojiSelect: (emoji) => void;
  newItem: { icon?: string };
}) {
  const [emojiDialogOpen, setEmojiDialogOpen] = React.useState(false);
  const handleEmojiButtonClick = () => {
    setEmojiDialogOpen(true);
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
      >
        <Picker
          onEmojiSelect={(emoji) => {
            handleEmojiSelect(emoji), setEmojiDialogOpen(false);
          }}
          custom={ColleagueAndTeamAvatars}
          categories={["colleague_icons"]}
          searchPosition={"none"}
          navPosition="none"
          emojiButtonSize={90}
          emojiSize={75}
          perLine={4}
          autoFocus="true"
          previewPosition={"none"}
          theme={"dark"}
        />
      </Dialog>
    </Stack>
  );
}
