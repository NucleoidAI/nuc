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
      "https://cdn.nucleoid.com/media/c4f30ffe-00b7-4f14-975f-82a4cf8d2207.png",
    icon: "https://cdn.nucleoid.com/media/c4f30ffe-00b7-4f14-975f-82a4cf8d2207.png",
    largeIcon:
      "https://cdn.nucleoid.com/media/c4f30ffe-00b7-4f14-975f-82a4cf8d2207.png",
  },
  projectBar: {
    label: "Team",
  },
};

export default templateConfig;
