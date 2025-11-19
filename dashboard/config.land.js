const config = {
  appId: "10b7bc8c-a49c-4002-b0ec-63599e4b5210",
  name: "GreyCollar",
  base: "/dashboard",
  beta: true,
  api: "http://localhost:3000/api",
  socket: {
    host: "https://communication.land.greycollar.ai",
    path: "/socket.io",
  },
  project: {
    github: {
      redirectUri: "https://dashboard.land.greycollar.ai/dashboard/callback",
      authUrl: "https://github.com/login/oauth/authorize",
      userUrl: "https://api.github.com/user",
      clientId: "Ov23liDUwCkj5NPpApo7",
      scope: "user",
      response_type: "code",
    },
  },
};

export default config;
