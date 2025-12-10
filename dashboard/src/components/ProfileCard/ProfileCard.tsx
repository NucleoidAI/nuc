import Card from "@mui/material/Card";
import ProfileCover from "../ProfileCover/ProfileCover";
import TabBar from "../Tabs/Tabs";

function ProfileCard({
  name,
  iconUrl,
  coverUrl,
  currentTab,
  setCurrentTab,
  TABS,
  loading,
}) {
  return (
    <Card variant="profile-card" sx={{ position: "relative", height: 200 }}>
      <ProfileCover
        loading={loading}
        name={name}
        iconUrl={iconUrl}
        coverUrl={coverUrl}
      />

      <TabBar
        TABS={TABS}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />
    </Card>
  );
}

export default ProfileCard;
