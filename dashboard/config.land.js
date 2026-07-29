const config = {
  appId: "10b7bc8c-a49c-4002-b0ec-63599e4b5210",
  name: "BGTSAI Platform",
  base: "/dashboard",
  beta: false,
  api: "https://greycollar.nuc.land/api",
  socket: {
    host: "https://communication.land.greycollar.ai",
    path: "/socket.io",
  },
  project: {
    github: {
      redirectUri: "https://greycollar.nuc.land/dashboard/callback",
      authUrl: "https://github.com/login/oauth/authorize",
      userUrl: "https://api.github.com/user",
      clientId: "Ov23liDUwCkj5NPpApo7",
      scope: "user",
      response_type: "code",
    },
  },
};

export default config;
