const isBrowser = typeof window !== "undefined";

const config = {
  appId: "10b7bc8c-a49c-4002-b0ec-63599e4b5210",
  name: "nuc",
  base: "/dashboard",
  beta: true,
  api: isBrowser ? `${window.location.origin}/api` : "http://localhost:4000",
  socket: {
    host: isBrowser ? window.location.origin : "http://localhost:3003",
    path: "/socket.io",
  },
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

export default config;
