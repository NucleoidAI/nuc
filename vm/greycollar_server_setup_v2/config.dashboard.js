const t = {
  appId: "10b7bc8c-a49c-4002-b0ec-63599e4b5210",
  name: "GreyCollar",
  base: "/dashboard",
  beta: !0,
  api: "http://localhost:3000/api",
  socket: { host: "http://10.98.228.27:3003", path: "/socket.io" },
  credentials: {
    provider: "DEMO",
  },
  project: {
    github: {
      authUrl: "https://github.com/login/oauth/authorize",
      clientId: "Ov23lihgDzlqJ1gnZxX3",
      redirectUri: "http://localhost:3000/dashboard/callback",
      userUrl: "https://api.github.com/user",
      scope: "user",
      response_type: "code",
    },
  },
};
export { t as c };
