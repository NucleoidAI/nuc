/* eslint-disable no-unused-vars */
const templateConfig = {
  theme: {
    variants: () => ({
      MuiCard: {
        variants: [
          {
            props: { variant: "profile-card" },
            style: {
              mb: 3,
              height: 290,
            },
          },
        ],
      },
    }),
    mode: "dark",
    colorPresets: "cyan",
  },
  login: {
    variant: "modern",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/9/9f/T%C3%BCrk_Telekom_logo.svg",
    icon: "https://upload.wikimedia.org/wikipedia/commons/9/9f/T%C3%BCrk_Telekom_logo.svg",
    largeIcon:
      "https://upload.wikimedia.org/wikipedia/commons/9/9f/T%C3%BCrk_Telekom_logo.svg",
  },
  projectBar: {
    label: "Team",
  },
};

export default templateConfig;
