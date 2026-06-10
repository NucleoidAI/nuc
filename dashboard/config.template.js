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
      "https://companieslogo.com/img/orig/TTKOM.IS-802a5da1.png?t=1720244494",
    icon: "https://companieslogo.com/img/orig/TTKOM.IS-802a5da1.png?t=1720244494",
    largeIcon:
      "https://companieslogo.com/img/orig/TTKOM.IS-802a5da1.png?t=1720244494",
  },
  projectBar: {
    label: "Team",
  },
};

export default templateConfig;
