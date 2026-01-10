import { Iconify } from "@canmingir/link/platform/components";
import { ListItemText } from "@mui/material";
import { cleanIconName } from "../../../utils/cleanIconName";
import useTeamDetails from "../../../hooks/useTeamDetails";

function TeamChatNavAccount() {
  const { teamDetails } = useTeamDetails();

  return (
    <>
      <Iconify
        icon={cleanIconName(teamDetails?.coachAvatar)}
        width="30%"
        height="30%"
      />
      <ListItemText
        sx={{ ml: 2 }}
        primary={teamDetails?.coach}
        primaryTypographyProps={{
          noWrap: true,
          variant: "subtitle2",
        }}
        secondary={"Team Leader Agent"}
        secondaryTypographyProps={{
          noWrap: true,
          component: "span",
          variant: "body2",
          color: "text.secondary",
        }}
      />
    </>
  );
}

export default TeamChatNavAccount;
